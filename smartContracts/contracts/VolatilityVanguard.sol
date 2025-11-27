// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title VolatilityVanguard
 * @dev Round-based prediction market for token volatility using CELO native token
 * @notice Uses Inverse Liquidity Pool model with fees taken from losing pool
 */
contract VolatilityVanguard is ReentrancyGuard, Ownable {
    // Global State Variables
    address public oracleAddress;
    address public feeReceiver;
    uint256 public feeRate; // Fee rate in basis points (e.g., 250 = 2.50%, denominator = 10000)
    uint256 public currentRoundId;
    uint256 public riskThreshold; // Percentage change threshold (e.g., 150 = 1.5%, denominator = 10000)
    uint256 public lockTime; // Duration in seconds that a round stays open
    
    // Round Structure
    struct Round {
        uint256 id;
        uint256 startTime;
        uint256 lockTime;
        uint256 closeTime; // Time when settlement is called
        bool isSettled;
        uint256 totalPool; // Total CELO staked in this round
        uint256 totalHigherStaked; // Total CELO staked on Higher
        uint256 totalLowerStaked; // Total CELO staked on Lower
        uint8 result; // 0=Pending, 1=Higher, 2=Lower
    }
    
    // Mappings
    mapping(uint256 => Round) public rounds;
    mapping(uint256 => mapping(address => bool)) public hasPredicted;
    mapping(uint256 => mapping(address => uint256)) public stakedAmount;
    mapping(uint256 => mapping(address => bool)) public predictedHigher;
    mapping(uint256 => mapping(address => bool)) public hasClaimed; // Track if user has claimed for a round
    mapping(uint256 => bool) public feeCollected; // Track if fee has been collected for a round
    
    // Events
    event RoundStarted(uint256 indexed roundId, uint256 startTime, uint256 lockTime);
    event PredictionPlaced(
        uint256 indexed roundId,
        address indexed user,
        bool predictsHigher,
        uint256 amount
    );
    event RoundSettled(uint256 indexed roundId, uint8 result);
    event WinningsClaimed(
        uint256 indexed roundId,
        address indexed user,
        uint256 payoutAmount
    );
    event FeeCollected(uint256 indexed roundId, uint256 feeAmount);
    
    // Modifiers
    modifier onlyOracle() {
        require(msg.sender == oracleAddress, "Only oracle can call this");
        _;
    }
    
    modifier validRound(uint256 _roundId) {
        require(_roundId > 0 && _roundId <= currentRoundId, "Invalid round ID");
        _;
    }
    
    /**
     * @dev Constructor
     * @param _oracleAddress Address authorized to settle rounds
     * @param _feeReceiver Address to receive fees
     * @param _feeRate Fee rate in basis points (e.g., 250 = 2.50%)
     * @param _riskThreshold Risk threshold in basis points (e.g., 150 = 1.5%)
     * @param _lockTime Lock time in seconds
     */
    constructor(
        address _oracleAddress,
        address _feeReceiver,
        uint256 _feeRate,
        uint256 _riskThreshold,
        uint256 _lockTime
    ) Ownable(msg.sender) {
        require(_oracleAddress != address(0), "Invalid oracle address");
        require(_feeReceiver != address(0), "Invalid fee receiver address");
        require(_feeRate <= 10000, "Fee rate cannot exceed 100%");
        
        oracleAddress = _oracleAddress;
        feeReceiver = _feeReceiver;
        feeRate = _feeRate;
        riskThreshold = _riskThreshold;
        lockTime = _lockTime;
    }
    
    /**
     * @dev Start a new prediction round (Admin/OnlyOwner)
     */
    function startNewRound() external onlyOwner {
        currentRoundId++;
        
        rounds[currentRoundId] = Round({
            id: currentRoundId,
            startTime: block.timestamp,
            lockTime: lockTime,
            closeTime: 0,
            isSettled: false,
            totalPool: 0,
            totalHigherStaked: 0,
            totalLowerStaked: 0,
            result: 0 // Pending
        });
        
        emit RoundStarted(currentRoundId, block.timestamp, lockTime);
    }
    
    /**
     * @dev Get round information (Public/View)
     * @param _roundId The round ID to query
     */
    function getRoundInfo(uint256 _roundId)
        external
        view
        validRound(_roundId)
        returns (
            uint256 id,
            uint256 startTime,
            uint256 lockTime,
            uint256 closeTime,
            bool isSettled,
            uint256 totalPool,
            uint256 totalHigherStaked,
            uint256 totalLowerStaked,
            uint8 result
        )
    {
        Round storage round = rounds[_roundId];
        return (
            round.id,
            round.startTime,
            round.lockTime,
            round.closeTime,
            round.isSettled,
            round.totalPool,
            round.totalHigherStaked,
            round.totalLowerStaked,
            round.result
        );
    }
    
    /**
     * @dev Place a prediction (Public, Payable)
     * @param _roundId The round ID to predict on
     * @param _predictsHigher True for Higher volatility, false for Lower volatility
     * @notice CRITICAL: This function MUST be payable. The staked amount is read from msg.value
     */
    function placePrediction(uint256 _roundId, bool _predictsHigher)
        external
        payable
        nonReentrant
        validRound(_roundId)
    {
        Round storage round = rounds[_roundId];
        
        // Pre-checks
        require(_roundId == currentRoundId, "Round is not current");
        require(block.timestamp < round.startTime + round.lockTime, "Round is locked");
        require(msg.value > 0, "Stake amount must be greater than zero");
        require(!hasPredicted[_roundId][msg.sender], "User has already predicted in this round");
        require(!round.isSettled, "Round is already settled");
        
        // Update round totals
        round.totalPool += msg.value;
        if (_predictsHigher) {
            round.totalHigherStaked += msg.value;
        } else {
            round.totalLowerStaked += msg.value;
        }
        
        // Update user mappings
        hasPredicted[_roundId][msg.sender] = true;
        stakedAmount[_roundId][msg.sender] = msg.value;
        predictedHigher[_roundId][msg.sender] = _predictsHigher;
        
        emit PredictionPlaced(_roundId, msg.sender, _predictsHigher, msg.value);
    }
    
    /**
     * @dev Settle a round (Admin/OnlyOracle)
     * @param _roundId The round ID to settle
     * @param _result The outcome: 1=Higher, 2=Lower
     */
    function settleRound(uint256 _roundId, uint8 _result)
        external
        onlyOracle
        validRound(_roundId)
    {
        Round storage round = rounds[_roundId];
        
        // Pre-checks
        require(block.timestamp >= round.startTime + round.lockTime, "Round lock time not elapsed");
        require(!round.isSettled, "Round is already settled");
        require(_result == 1 || _result == 2, "Invalid result (must be 1 or 2)");
        
        // Set settlement
        round.isSettled = true;
        round.result = _result;
        round.closeTime = block.timestamp;
        
        emit RoundSettled(_roundId, _result);
    }
    
    /**
     * @dev Claim winnings for settled rounds (Public, Pull-based)
     * @param _roundIds Array of round IDs to claim winnings for
     * @notice CRITICAL: Fee is transferred to feeReceiver before user payout
     */
    function claimWinnings(uint256[] memory _roundIds)
        external
        nonReentrant
    {
        for (uint256 i = 0; i < _roundIds.length; i++) {
            uint256 roundId = _roundIds[i];
            
            // Validate round
            require(roundId > 0 && roundId <= currentRoundId, "Invalid round ID");
            Round storage round = rounds[roundId];
            require(round.isSettled, "Round is not settled");
            require(hasPredicted[roundId][msg.sender], "User did not predict in this round");
            require(!hasClaimed[roundId][msg.sender], "User has already claimed for this round");
            
            // Check if user won
            bool userWon = false;
            if (round.result == 1 && predictedHigher[roundId][msg.sender]) {
                userWon = true; // Higher won, user predicted Higher
            } else if (round.result == 2 && !predictedHigher[roundId][msg.sender]) {
                userWon = true; // Lower won, user predicted Lower
            }
            
            if (userWon) {
                uint256 userStake = stakedAmount[roundId][msg.sender];
                
                // Determine winning and losing pools
                uint256 winningPool = round.result == 1 
                    ? round.totalHigherStaked 
                    : round.totalLowerStaked;
                uint256 losingPool = round.result == 1 
                    ? round.totalLowerStaked 
                    : round.totalHigherStaked;
                
                // Calculate fee from losing pool (only on first claim for this round)
                uint256 feeAmount = 0;
                if (!feeCollected[roundId] && losingPool > 0 && feeRate > 0) {
                    feeAmount = (losingPool * feeRate) / 10000;
                    
                    // Transfer fee to feeReceiver (only once per round)
                    if (feeAmount > 0 && address(this).balance >= feeAmount) {
                        (bool feeSuccess, ) = payable(feeReceiver).call{value: feeAmount}("");
                        require(feeSuccess, "Fee transfer failed");
                        feeCollected[roundId] = true;
                        emit FeeCollected(roundId, feeAmount);
                    }
                }
                
                // Calculate payout using Inverse Liquidity Pool model
                // Payout = S * ((L - Fee) / W) + S
                // Where S = user stake, L = losing pool, W = winning pool
                uint256 netLosingPool = losingPool - feeAmount;
                uint256 payoutAmount = 0;
                
                if (winningPool > 0 && netLosingPool > 0) {
                    // Calculate winnings: S * (L - Fee) / W
                    uint256 winnings = (userStake * netLosingPool) / winningPool;
                    // Total payout = stake + winnings
                    payoutAmount = userStake + winnings;
                } else {
                    // If no winning pool or no losing pool, return stake only
                    payoutAmount = userStake;
                }
                
                // Transfer winnings to user
                require(payoutAmount > 0, "Payout amount must be greater than zero");
                require(address(this).balance >= payoutAmount, "Insufficient contract balance");
                
                (bool success, ) = payable(msg.sender).call{value: payoutAmount}("");
                require(success, "Payout transfer failed");
                
                // Mark as claimed
                hasClaimed[roundId][msg.sender] = true;
                
                emit WinningsClaimed(roundId, msg.sender, payoutAmount);
            } else {
                // User lost, mark as claimed (no payout)
                hasClaimed[roundId][msg.sender] = true;
            }
        }
    }
    
    /**
     * @dev Get user's prediction for a specific round
     * @param _roundId The round ID
     * @param _user The user address
     */
    function getUserPrediction(uint256 _roundId, address _user)
        external
        view
        validRound(_roundId)
        returns (
            bool hasPredictedInRound,
            uint256 amount,
            bool predictsHigher,
            bool hasClaimedReward
        )
    {
        return (
            hasPredicted[_roundId][_user],
            stakedAmount[_roundId][_user],
            predictedHigher[_roundId][_user],
            hasClaimed[_roundId][_user]
        );
    }
    
    /**
     * @dev Get user's rounds with predictions
     * @param _user The user address
     * @param _startRound Starting round ID (inclusive)
     * @param _endRound Ending round ID (inclusive)
     */
    function getUserRounds(address _user, uint256 _startRound, uint256 _endRound)
        external
        view
        returns (uint256[] memory)
    {
        require(_endRound >= _startRound, "Invalid range");
        require(_endRound <= currentRoundId, "End round exceeds current round");
        
        uint256 count = 0;
        for (uint256 i = _startRound; i <= _endRound; i++) {
            if (hasPredicted[i][_user]) {
                count++;
            }
        }
        
        uint256[] memory userRounds = new uint256[](count);
        uint256 index = 0;
        
        for (uint256 i = _startRound; i <= _endRound; i++) {
            if (hasPredicted[i][_user]) {
                userRounds[index] = i;
                index++;
            }
        }
        
        return userRounds;
    }
    
    // Admin Functions
    
    /**
     * @dev Update oracle address (OnlyOwner)
     */
    function setOracleAddress(address _oracleAddress) external onlyOwner {
        require(_oracleAddress != address(0), "Invalid oracle address");
        oracleAddress = _oracleAddress;
    }
    
    /**
     * @dev Update fee receiver address (OnlyOwner)
     */
    function setFeeReceiver(address _feeReceiver) external onlyOwner {
        require(_feeReceiver != address(0), "Invalid fee receiver address");
        feeReceiver = _feeReceiver;
    }
    
    /**
     * @dev Update fee rate (OnlyOwner)
     * @param _feeRate New fee rate in basis points (max 10000 = 100%)
     */
    function setFeeRate(uint256 _feeRate) external onlyOwner {
        require(_feeRate <= 10000, "Fee rate cannot exceed 100%");
        feeRate = _feeRate;
    }
    
    /**
     * @dev Update risk threshold (OnlyOwner)
     * @param _riskThreshold New risk threshold in basis points
     */
    function setRiskThreshold(uint256 _riskThreshold) external onlyOwner {
        riskThreshold = _riskThreshold;
    }
    
    /**
     * @dev Update lock time (OnlyOwner)
     * @param _lockTime New lock time in seconds
     */
    function setLockTime(uint256 _lockTime) external onlyOwner {
        lockTime = _lockTime;
    }
    
    /**
     * @dev Emergency withdraw (OnlyOwner) - for stuck funds
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
    }
    
    // Receive function to accept CELO
    receive() external payable {
        // Contract can receive CELO for predictions
    }
}

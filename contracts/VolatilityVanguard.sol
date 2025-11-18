// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title VolatilityVanguard
 * @dev Prediction market for token volatility based on VibeCheck scores
 */
contract VolatilityVanguard is ReentrancyGuard, Ownable {
    IERC20 public immutable cUSD;
    
    uint256 public constant PREDICTION_COST = 0.1 ether; // 0.1 cUSD
    uint256 public constant PREDICTION_PERIOD = 7 days;
    uint256 public constant PLATFORM_FEE_PERCENT = 5; // 5%
    
    struct Prediction {
        address user;
        address token;
        uint8 impliedRiskLevel; // 0=Low, 1=Medium, 2=High
        bool predictedHigher;
        uint256 startPrice;
        uint256 startTime;
        uint256 poolId;
        bool resolved;
        bool won;
    }
    
    struct Pool {
        address token;
        uint8 impliedRiskLevel;
        uint256 totalAmount;
        uint256 higherAmount;
        uint256 lowerAmount;
        uint256 startTime;
        bool resolved;
        bool higherWon;
    }
    
    mapping(uint256 => Prediction) public predictions;
    mapping(uint256 => Pool) public pools;
    mapping(address => mapping(uint8 => uint256)) public tokenRiskPools; // token => riskLevel => poolId
    
    uint256 public nextPredictionId = 1;
    uint256 public nextPoolId = 1;
    
    // Mock price oracle for testing (replace with real oracle in production)
    mapping(address => uint256) public tokenPrices;
    
    event PredictionPlaced(
        uint256 indexed predictionId,
        address indexed user,
        address indexed token,
        uint8 impliedRiskLevel,
        bool predictedHigher,
        uint256 poolId
    );
    
    event PredictionResolved(
        uint256 indexed predictionId,
        bool won,
        uint256 payout
    );
    
    event PoolResolved(
        uint256 indexed poolId,
        bool higherWon,
        uint256 totalPayout
    );
    
    constructor(address _cUSD) {
        cUSD = IERC20(_cUSD);
    }
    
    /**
     * @dev Place a prediction on token volatility
     * @param token The token to predict
     * @param impliedRiskLevel Risk level from VibeCheck (0=Low, 1=Medium, 2=High)
     * @param predictedHigher True if predicting higher volatility than expected
     */
    function placePrediction(
        address token,
        uint8 impliedRiskLevel,
        bool predictedHigher
    ) external nonReentrant {
        require(impliedRiskLevel <= 2, "Invalid risk level");
        require(token != address(0), "Invalid token address");
        
        // Transfer cUSD from user
        require(
            cUSD.transferFrom(msg.sender, address(this), PREDICTION_COST),
            "Failed to transfer cUSD"
        );
        
        // Get or create pool for this token and risk level
        uint256 poolId = _getOrCreatePool(token, impliedRiskLevel);
        
        // Get current token price (mock implementation)
        uint256 currentPrice = _getCurrentPrice(token);
        require(currentPrice > 0, "Unable to get token price");
        
        // Create prediction
        predictions[nextPredictionId] = Prediction({
            user: msg.sender,
            token: token,
            impliedRiskLevel: impliedRiskLevel,
            predictedHigher: predictedHigher,
            startPrice: currentPrice,
            startTime: block.timestamp,
            poolId: poolId,
            resolved: false,
            won: false
        });
        
        // Update pool amounts
        Pool storage pool = pools[poolId];
        pool.totalAmount += PREDICTION_COST;
        
        if (predictedHigher) {
            pool.higherAmount += PREDICTION_COST;
        } else {
            pool.lowerAmount += PREDICTION_COST;
        }
        
        emit PredictionPlaced(
            nextPredictionId,
            msg.sender,
            token,
            impliedRiskLevel,
            predictedHigher,
            poolId
        );
        
        nextPredictionId++;
    }
    
    /**
     * @dev Resolve a prediction after the 7-day period
     * @param predictionId The prediction to resolve
     */
    function resolvePrediction(uint256 predictionId) external nonReentrant {
        Prediction storage prediction = predictions[predictionId];
        require(prediction.user != address(0), "Prediction does not exist");
        require(!prediction.resolved, "Prediction already resolved");
        require(
            block.timestamp >= prediction.startTime + PREDICTION_PERIOD,
            "Prediction period not elapsed"
        );
        
        Pool storage pool = pools[prediction.poolId];
        
        // Resolve pool if not already resolved
        if (!pool.resolved) {
            _resolvePool(prediction.poolId);
        }
        
        // Check if prediction won
        bool won = (prediction.predictedHigher && pool.higherWon) || 
                   (!prediction.predictedHigher && !pool.higherWon);
        
        prediction.resolved = true;
        prediction.won = won;
        
        uint256 payout = 0;
        
        if (won) {
            // Calculate payout based on pool distribution
            uint256 winningAmount = pool.higherWon ? pool.higherAmount : pool.lowerAmount;
            uint256 totalPayout = pool.totalAmount * (100 - PLATFORM_FEE_PERCENT) / 100;
            
            payout = (PREDICTION_COST * totalPayout) / winningAmount;
            
            // Transfer payout
            require(cUSD.transfer(prediction.user, payout), "Failed to transfer payout");
        }
        
        emit PredictionResolved(predictionId, won, payout);
    }
    
    /**
     * @dev Get pool information for a token and risk level
     */
    function getPoolInfo(address token, uint8 impliedRiskLevel) 
        external 
        view 
        returns (
            uint256 poolId,
            uint256 totalAmount,
            uint256 higherAmount,
            uint256 lowerAmount,
            bool resolved
        ) 
    {
        poolId = tokenRiskPools[token][impliedRiskLevel];
        if (poolId > 0) {
            Pool storage pool = pools[poolId];
            return (poolId, pool.totalAmount, pool.higherAmount, pool.lowerAmount, pool.resolved);
        }
        return (0, 0, 0, 0, false);
    }
    
    /**
     * @dev Get user's predictions
     */
    function getUserPredictions(address user) 
        external 
        view 
        returns (uint256[] memory) 
    {
        uint256 count = 0;
        for (uint256 i = 1; i < nextPredictionId; i++) {
            if (predictions[i].user == user) {
                count++;
            }
        }
        
        uint256[] memory userPredictions = new uint256[](count);
        uint256 index = 0;
        
        for (uint256 i = 1; i < nextPredictionId; i++) {
            if (predictions[i].user == user) {
                userPredictions[index] = i;
                index++;
            }
        }
        
        return userPredictions;
    }
    
    /**
     * @dev Set token price (mock oracle function)
     */
    function setTokenPrice(address token, uint256 price) external onlyOwner {
        tokenPrices[token] = price;
    }
    
    /**
     * @dev Withdraw platform fees
     */
    function withdrawFees() external onlyOwner {
        uint256 balance = cUSD.balanceOf(address(this));
        require(cUSD.transfer(owner(), balance), "Failed to transfer fees");
    }
    
    // Internal functions
    
    function _getOrCreatePool(address token, uint8 impliedRiskLevel) internal returns (uint256) {
        uint256 poolId = tokenRiskPools[token][impliedRiskLevel];
        
        if (poolId == 0) {
            // Create new pool
            poolId = nextPoolId;
            pools[poolId] = Pool({
                token: token,
                impliedRiskLevel: impliedRiskLevel,
                totalAmount: 0,
                higherAmount: 0,
                lowerAmount: 0,
                startTime: block.timestamp,
                resolved: false,
                higherWon: false
            });
            
            tokenRiskPools[token][impliedRiskLevel] = poolId;
            nextPoolId++;
        }
        
        return poolId;
    }
    
    function _resolvePool(uint256 poolId) internal {
        Pool storage pool = pools[poolId];
        require(!pool.resolved, "Pool already resolved");
        require(
            block.timestamp >= pool.startTime + PREDICTION_PERIOD,
            "Pool period not elapsed"
        );
        
        // Get current price
        uint256 currentPrice = _getCurrentPrice(pool.token);
        require(currentPrice > 0, "Unable to get current token price");
        
        // Calculate actual volatility (simplified as absolute percentage change)
        uint256 startPrice = tokenPrices[pool.token];
        uint256 volatility = startPrice > currentPrice 
            ? ((startPrice - currentPrice) * 100) / startPrice
            : ((currentPrice - startPrice) * 100) / startPrice;
        
        // Determine threshold based on implied risk level
        uint256 threshold;
        if (pool.impliedRiskLevel == 0) {
            threshold = 5; // 5% for low risk
        } else {
            threshold = 15; // 15% for medium and high risk
        }
        
        // Determine if higher volatility occurred
        bool higherVolatility = volatility > threshold;
        
        pool.resolved = true;
        pool.higherWon = higherVolatility;
        
        emit PoolResolved(poolId, higherVolatility, pool.totalAmount);
    }
    
    function _getCurrentPrice(address token) internal view returns (uint256) {
        // Mock implementation - replace with real oracle
        return tokenPrices[token];
    }
}

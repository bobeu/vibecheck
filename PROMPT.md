#Vibecheck Project: VolatilityVanguard Game Smart Contract Implementation (CELO Native Token Focus)

**Target**: Implement the complete Solidity contracts for the VolatilityVanguard prediction market (Game Component of Vibecheck).

**Prerequisites**:

- Solidity Version: Must use 0.8.28 or higher.

**Standards**: Utilize OpenZeppelin contracts for security (e.g., Ownable).

Asset Requirement (CRITICAL): The game MUST ONLY use the native chain token CELO for all staking and payouts. cUSD may be used on the frontend for payment reports but is not the staking asset.

**Chain**: Optimized for the Celo/MiniApp ecosystem.

**1. Contract Architecture Overview**

The solution requires one core contract. Interaction relies on native token transfers (CELO) for staking and reward distribution.

`VolatilityVanguard.sol` (Main Logic): The core contract handling prediction rounds, state, settlement, and reward distribution using CELO.

**2. Core State Management & Data Structures**

The `VolatilityVanguard.sol` contract must manage game rounds and user predictions.

A. Global State Variables (CELO & Fee Focused)

Variable | Type | Description
-------- | ---- | -----------
oracleAddress | address | The address authorized to finalize game rounds and provide the settlement data (e.g., the Vibe Engine's official address).
feeReceiver | address | **MANDATORY**: The wallet address where the contract fee (rake) is forwarded upon settlement.
feeRate | uint256 | The percentage fee applied to the losing pool (e.g., 250 means 2.50%). Must be based on a fixed denominator (e.g., 10,000).
currentRoundId | uint256 | Counter for the current open prediction round.
riskThreshold | uint256 | The percentage change threshold (e.g., 1.5%) used to define volatility outcomes (Higher/Lower).
lockTime | uint256 | Duration (in seconds) that a round stays open after it starts.

**B. Data Structures (Structs)**

1. Round Structure:

```solidity
struct Round {
    uint256 id;
    uint256 startTime;
    uint256 lockTime;
    uint256 closeTime; // Time when settlement is called
    bool isSettled;
    uint256 totalPool; // Total CELO staked in this round
    uint256 totalHigherStaked; // Total CELO staked on Higher
    uint256 totalLowerStaked; // Total CELO staked on Lower
    // Prediction outcome: 0=Pending, 1=Higher, 2=Lower
    uint8 result;
}
```

2. Prediction `Mapping`:

Must track individual user stakes for each round.

- `mapping(uint256 => mapping(address => bool)) hasPredicted`: Tracks if a user has predicted in a round.

- `mapping(uint256 => mapping(address => uint256)) stakedAmount`: Tracks the CELO staked.

`mapping(uint256 => mapping(address => bool)) predictedHigher`: Tracks the user's direction choice (true for Higher Volatility, false for Lower Volatility).

3. Core Game Logic Functions

A. Round Management

- `startNewRound()` (Admin/OnlyOwner): Increments `currentRoundId`, initializes new `Round` struct, emits `RoundStarted(currentRoundId)`.

B. Prediction Placement

- `placePrediction(uint256 _roundId, bool _predictsHigher)` (Public, Payable):

    - CRITICAL Action: This function MUST be `payable`. The staked amount is read from `msg.value`.

    - **Pre-checks**: Must ensure `msg.value` is greater than zero and meets any minimum staking requirement.

    - The staked amount is `_amount = msg.value`.

    - Updates the `Round` total pool and the specific Higher/Lower staked totals (all in CELO).

    - Emits an event `PredictionPlaced(_roundId, msg.sender, _predictsHigher, msg.value)`.

C. Round Settlement (Oracle Function)

- `settleRound(uint256 _roundId, uint8 _result) (Admin/OnlyOracle)`:
    
    - Sets the `result` and `isSettled = true` for the Round struct.
    - No payouts happen here. This only locks the result.

D. Reward Claiming (Pull-based with Fee Transfer)

- `claimWinnings(uint256[] memory _roundIds) (Public)`:

    - Allows a user to claim winnings for settled rounds.

    - CRITICAL Fee Logic: When the contract processes a round for the first time:

    1. Determine the **Losing Pool** size (in CELO) for the settled round.

    2. Calculate the `feeAmount = Losing Pool * (feeRate / 10000)`.

    3. **Forward Fee (Native Transfer)**: Transfer the calculated `feeAmount` of CELO to the global `feeReceiver` address using a low-level call: `(bool success, ) = payable(feeReceiver).call{value: feeAmount}("")`. Must revert on failure.

    4. Calculate the user's share (staked amount + winnings) in CELO.

    5. Transfer Winnings (Native Transfer): Transfer the calculated winnings to the user: `(bool success, ) = payable(msg.sender).call{value: payoutAmount}("")`. Must revert on failure.

4. Tokenomics & Reward Calculation

The game uses an Inverse Liquidity Pool model where the rake is applied to the losing side.

- Asset Used: CELO only.

- Total Stake: $T = \text{Total Higher Staked} + \text{Total Lower Staked}$

- Winning Pool (W): Stake amount on the correct outcome.

- Losing Pool (L): Stake amount on the incorrect outcome.

- Contract Fee (Rake): A fixed percentage determined by `feeRate`, applied only to the Losing Pool (L).

$$\text{Net Pool} = W + (L - \text{Fee})$$

$$\text{Fee Collected} = L \times \frac{\text{feeRate}}{10000} \quad \text{(Transferred to } \mathbf{feeReceiver} \text{)}$$

- Payout Calculation (for a winning user staking amount S):

$$\text{Payout} = \text{S} \times \left(\frac{L - \text{Fee Collected}}{W}\right) + S$$

The `claimWinnings` function must execute the fee transfer to `feeReceiver` before distributing the winnings to the user.


# CRITICAL: Additional information - Prediction Mapping:

Must track individual user stakes for each round.

- `mapping(uint256 => mapping(address => bool)) hasPredicted`: Tracks if a user has predicted in a round.

- `mapping(uint256 => mapping(address => uint256)) stakedAmount`: Tracks the VibePoints staked.

- `mapping(uint256 => mapping(address => bool)) predictedHigher`: Tracks the user's direction choice (true for Higher Volatility, false for Lower Volatility).

# Core Game Logic Functions
The game operates in a strict, sequential lifecycle.

**A. Round Management**
- startNewRound() (Admin/OnlyOwner):
    - Increments currentRoundId.
    - Initializes a new Round struct with the current timestamp as startTime.
    - Emits an event RoundStarted(currentRoundId).

- getRoundInfo(uint256 _roundId) 
**(Public/View)**:
    - Returns the details of a specific Round struct for frontend display.

**B. Prediction Placement**
- `placePrediction(uint256 _roundId, bool _predictsHigher, uint256 _amount) (Public)`:
    - **Pre-checks**:
        - Must check if `_roundId` is the current, open round.
        
        - Must check if the round is still before `lockTime`.

        - Must check if the user has approved the `_amount` of `PredictionToken` to the contract.

        - Must ensure the user hasn't predicted yet in this round.

- **Action**:
    - Transfers `_amount` of VibePoints from the user to the `VolatilityVanguard` contract (Requires transferFrom).

    - Updates the `Round` total pool and the specific Higher/Lower staked totals.

    - Updates the user's `Prediction` mappings.

    - Emits an event `PredictionPlaced(_roundId, msg.sender, _predictsHigher, _amount).`

**C. Round Settlement (Oracle Function)**
- `settleRound(uint256 _roundId, uint8 _result) (Admin/OnlyOracle)`:

    - **Pre-checks**:

        - Must ensure `_roundId` has passed the `lockTime`.

        - Must ensure `_roundId` is not already settled.

        - Must ensure `_result` is a valid outcome (1 or 2).

    - **Action**:

        - Sets the `result` and `isSettled = true` for the Round struct.

        - Emits an event `RoundSettled(_roundId, _result)`.

_Note_: Reward distribution is handled in a separate, pull-based function (D).

**D. Reward Claiming (Pull-based)**
- `claimWinnings(uint256[] memory _roundIds) (Public)`:

    - Allows a user to claim winnings for one or more **settled** rounds they participated in.

    - **Logic**:

        - Iterate through each provided `_roundId`.

        - Check if the user predicted and if the round is settled.

        - If the user's prediction matches the `Round.result`:

            - Calculate rewards based on the **Inverse Liquidity Pool** model (see Section 4).

            - Transfer VibePoints (staked amount + winnings) from the contract back to the user.

- This function is vital for the frontend to allow users to collect rewards post-settlement.


**4. Tokenomics & Reward Calculation**

The game uses an **Inverse Liquidity Pool** model: the smaller the pool of winning predictions, the higher the payout.

- **Total Stake**: `T = totalHigherStaked + totalLowerStaked`
- **Winning Pool**: (Example: Higher wins): `W = totalHigherStaked`
- **Losing Pool**: L = totalLowerStaked
- **Contract Fee (Rake)**: A percentage fee (can be dynamically updated by an authorized address, e.g., 2.5%) taken from the Losing Pool (where 100% of the funds are lost).
- **Payout Calculation** (If Higher wins, for a user staking amount S):$$\text{Winnings} = \text{S} \times \left(\frac{\text{L} \times (1 - \text{Fee Rate})}{\text{W}}\right)$$The entire staked amount $T$ (minus the fee) is redistributed among the winners.

**5. Frontend Interaction (Wagmi Hooks Mapping)**

The contract structure must be designed to integrate seamlessly with the Wagmi library as instructed previously.

Frontend Action | Wagmi Hook | Contract Function Mapping
--------------- | ---------- | ---------------------------
Check current round state. | useReadContract (with polling) | getRoundInfo(currentRoundId)
Stake VibePoints. | useWriteContract (after useSimulateContract) | placePrediction(...)
Claim Winnings. | useWriteContract (after useSimulateContract) | claimWinnings(...)
Admin starting a round. | useWriteContract (OnlyOwner/Admin) | startNewRound()
Oracle settling a round. | useWriteContract (OnlyOracle) | settleRound(...)
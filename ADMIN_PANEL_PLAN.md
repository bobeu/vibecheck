# Admin Panel Implementation Plan

## Overview
This document outlines the plan to:
1. Add a guard to `startNewRound()` to prevent starting rounds when lockTime is still open
2. Build a comprehensive admin panel for contract management

## Part 1: Smart Contract Guard

### Current Issue
- `startNewRound()` can be called anytime by owner
- No check if current round's lockTime has elapsed
- Risk of starting new round while users can still place predictions

### Solution
Add guard logic to `startNewRound()`:
- If `currentRoundId == 0`: Allow (first round)
- If `currentRoundId > 0`: 
  - Check if current round is settled OR
  - Check if `block.timestamp >= round.startTime + round.lockTime`
- Revert with clear error message if conditions not met

### Implementation
```solidity
function startNewRound() external onlyOwner {
    // Guard: Check if we can start a new round
    if (currentRoundId > 0) {
        Round storage currentRound = rounds[currentRoundId];
        require(
            currentRound.isSettled || 
            block.timestamp >= currentRound.startTime + currentRound.lockTime,
            "Cannot start new round: current round is still open"
        );
    }
    
    // ... rest of function
}
```

## Part 2: Admin Panel Frontend

### Component Structure
**File**: `vibecheck/frontend/src/components/AdminPanel.tsx`

### Sections:

#### 1. Access Control
- Check if connected wallet is contract owner
- Display owner address
- Show warning if not owner

#### 2. Contract State (Read-Only)
- Current Round ID
- Fee Rate (with percentage display)
- Risk Threshold (with percentage display)
- Lock Time (with human-readable format)
- Oracle Address
- Fee Receiver Address
- Contract Balance (CELO)

#### 3. Current Round Information
- Round ID
- Start Time
- Lock Time
- Close Time (if settled)
- Is Settled status
- Total Pool
- Higher Staked
- Lower Staked
- Result (Pending/Higher/Lower)
- Time Remaining (if not settled)

#### 4. Admin Actions

##### A. Start New Round
- **Function**: `startNewRound()`
- **Description**: "Starts a new prediction round. Can only be called when current round is settled or lockTime has elapsed."
- **Status Check**: 
  - Show current round status
  - Show if lockTime has elapsed
  - Enable/disable button based on status
- **Inputs**: None
- **Warning**: "This will create a new round. Ensure current round is settled or closed."

##### B. Set Oracle Address
- **Function**: `setOracleAddress(address)`
- **Description**: "Updates the oracle address that can settle rounds. This address has permission to call settleRound()."
- **Input**: 
  - Address input field
  - Validation: Must be valid address, not zero address
- **Warning**: "Changing oracle address affects who can settle rounds. Use with caution."

##### C. Set Fee Receiver
- **Function**: `setFeeReceiver(address)`
- **Description**: "Updates the address that receives fees from losing pools. Fees are collected when winners claim."
- **Input**:
  - Address input field
  - Validation: Must be valid address, not zero address
- **Warning**: "This address will receive all future fees. Verify address carefully."

##### D. Set Fee Rate
- **Function**: `setFeeRate(uint256)`
- **Description**: "Updates the fee rate taken from losing pools. Fee rate is in basis points (e.g., 250 = 2.50%). Maximum is 10000 (100%)."
- **Input**:
  - Number input field
  - Validation: Must be <= 10000
  - Display: Show percentage equivalent
- **Example**: "250 basis points = 2.50%"

##### E. Set Risk Threshold
- **Function**: `setRiskThreshold(uint256)`
- **Description**: "Updates the risk threshold used for volatility calculations. Threshold is in basis points (e.g., 150 = 1.5%)."
- **Input**:
  - Number input field
  - Display: Show percentage equivalent
- **Example**: "150 basis points = 1.5%"

##### F. Set Lock Time
- **Function**: `setLockTime(uint256)`
- **Description**: "Updates the duration (in seconds) that a round stays open for predictions. After this time, the round can be settled."
- **Input**:
  - Number input field (seconds)
  - Display: Show human-readable format (e.g., "604800 seconds = 7 days")
- **Warning**: "Changing lock time affects future rounds only, not current round."

##### G. Emergency Withdraw
- **Function**: `emergencyWithdraw()`
- **Description**: "Emergency function to withdraw all CELO from contract. Use only if funds are stuck. WARNING: This withdraws ALL funds including user stakes."
- **Inputs**: None
- **Warning**: "⚠️ DANGER: This will withdraw ALL funds from the contract. Only use in emergency situations. Ensure no active rounds with pending claims."

### UI/UX Design
- Use project theme colors (Celo yellow, MiniPay green)
- Card-based layout for each section
- Clear visual hierarchy
- Status indicators (green/yellow/red badges)
- Input validation with error messages
- Confirmation modals for critical actions
- Loading states for transactions
- Success/error toasts

### Integration
- Add route/access in App.tsx
- Use Wagmi hooks for contract interactions
- Use VolatilityVanguardService for read operations
- Use useWriteContract for admin actions

## Part 3: Testing

### Smart Contract Tests
1. Test guard prevents starting when lockTime not elapsed
2. Test guard allows starting when lockTime elapsed
3. Test guard allows starting when round is settled
4. Test guard allows starting first round (currentRoundId == 0)
5. Test all existing functionality still works

### Frontend Tests
- Test owner detection
- Test admin panel only shows for owner
- Test all admin actions with proper validation
- Test error handling

## Implementation Order
1. Smart contract guard modification
2. Write/update tests
3. Run all tests to ensure no regressions
4. Add owner check to service
5. Create AdminPanel component
6. Integrate into App.tsx
7. Test end-to-end


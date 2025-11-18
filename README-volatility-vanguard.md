# Volatility Vanguard Integration Guide

## Overview
Volatility Vanguard is a cUSD-based prediction market integrated into VibeCheck where users bet on token volatility relative to AI-predicted risk levels.

## Smart Contract Deployment

### Prerequisites
```bash
npm install
cp .env.example .env
# Fill in your private key and API keys in .env
```

### Deploy to Celo Testnet
```bash
# Deploy the contract
npx hardhat deploy --network celoTestnet

# Sync artifacts to frontend
npx hardhat run scripts/sync-artifacts.js --network celoTestnet
```

### Deploy to Celo Mainnet
```bash
# Deploy the contract
npx hardhat deploy --network celoMainnet

# Sync artifacts to frontend
npx hardhat run scripts/sync-artifacts.js --network celoMainnet
```

## Smart Contract Functions

### Core Functions

1. **placePrediction(token, impliedRiskLevel, predictedHigher)**
   - Cost: 0.1 cUSD
   - Records prediction with current token price
   - Maps VibeCheck score to risk level (0=Low, 1=Medium, 2=High)

2. **resolvePrediction(predictionId)**
   - Can only be called after 7 days
   - Calculates actual volatility vs expected threshold
   - Distributes winnings to correct predictors

3. **getPoolInfo(token, impliedRiskLevel)**
   - Returns current pool statistics
   - Shows betting distribution (Higher vs Lower)

### Risk Level Mapping
- **Score ≥80**: Low Risk (≤5% expected volatility)
- **Score 50-79**: Medium Risk (≤15% expected volatility)  
- **Score <50**: High Risk (>15% expected volatility)

## Frontend Integration

### Components
- **VolatilityVanguard.tsx**: Main prediction interface
- **VolatilityVanguardService.ts**: Contract interaction layer

### Key Features
1. **Risk Assessment Display**: Shows AI-derived risk level
2. **Pool Statistics**: Current betting distribution
3. **Prediction Interface**: Higher/Lower volatility buttons
4. **Prediction Management**: Track and resolve user predictions
5. **Real-time Updates**: Pool data refreshes automatically

### Usage Flow
1. User selects token and views VibeCheck score
2. AI maps score to risk level (Low/Medium/High)
3. User predicts if actual volatility will be Higher or Lower than threshold
4. User pays 0.1 cUSD via MiniPay
5. After 7 days, prediction can be resolved
6. Winners share the pool proportionally

## File Structure
```
contracts/
  VolatilityVanguard.sol          # Main prediction contract
deploy/
  01-deploy-volatility-vanguard.js # Deployment script
scripts/
  sync-artifacts.js               # Frontend artifact sync
src/
  components/
    VolatilityVanguard.tsx        # Prediction UI component
  lib/
    volatilityVanguardService.ts  # Contract service layer
  contracts/
    volatilityVanguardAddress.ts  # Contract address (auto-generated)
  abis/
    VolatilityVanguardABI.json    # Contract ABI (auto-generated)
```

## Testing

The contract includes mock price oracle functionality for testing. In production, integrate with a real price oracle like Chainlink or Pyth.

### Mock Functions (Owner Only)
- `setTokenPrice(token, price)`: Set mock token price
- `withdrawFees()`: Withdraw platform fees (5% of pools)

## Security Features
- **ReentrancyGuard**: Prevents reentrancy attacks
- **Ownable**: Admin functions for price oracle and fee management
- **ERC20 Integration**: Uses actual cUSD token for payments
- **Time-based Resolution**: Enforces 7-day prediction period

## Gas Optimization
- Efficient struct packing
- Batch operations where possible
- Minimal external calls
- Optimized for Celo's low gas costs

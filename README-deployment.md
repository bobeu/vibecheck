# VibeCheck Development Workflow - Deployment Guide

This guide follows the standardized VibeCheck development workflow for modular development and smart contract integration.

## 🏗️ Architecture Overview

### Code Modularity
- **Components**: Broken into single-responsibility modules
- **Services**: Separated business logic from UI presentation  
- **Hooks**: Custom hooks for state management and contract interactions

### Smart Contract Environment
- **Platform**: Hardhat v2 with hardhat-deploy plugin
- **Network**: Celo testnet (11142220) and mainnet (42220)
- **Deployment**: Standardized artifact generation

### Artifact Synchronization
- **Protocol**: Automatic sync from deployment to frontend
- **File**: `src/constants/contract-artifacts.json`
- **Structure**: Standardized format for easy frontend access

## 📦 Deployment Instructions

### 1. Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Add your private key and API keys to .env
PRIVATE_KEY=your_private_key_here
ETHERSCAN_API_KEY=your_etherscan_api_key_here
REACT_APP_GEMINI_API_KEY=your_gemini_api_key_here
```

### 2. Deploy Smart Contract

#### Deploy to Celo Testnet
```bash
# Install dependencies
npm install

# Deploy VolatilityVanguard contract
npx hardhat deploy --network celoTestnet

# Sync artifacts to frontend
npx hardhat run scripts/sync-artifacts.js --network celoTestnet
```

#### Deploy to Celo Mainnet
```bash
# Deploy to mainnet
npx hardhat deploy --network celoMainnet

# Sync artifacts to frontend
npx hardhat run scripts/sync-artifacts.js --network celoMainnet
```

### 3. Verify Deployment

After deployment, verify the following files are created:

```
deployments/
  celoTestnet/
    VolatilityVanguard.json      # Deployment artifact

src/
  constants/
    contract-artifacts.json      # Frontend artifact sync
  contracts/
    volatilityVanguardAddress.ts # Contract address
  abis/
    VolatilityVanguardABI.json  # Contract ABI
```

### 4. Start Frontend Application

```bash
# Start development server
npm run dev

# Build for production
npm run build
```

## 🎯 Modular Component Structure

### Volatility Vanguard Components

```
src/components/volatility/
├── PredictionInput.tsx        # Betting interface
├── PoolStatistics.tsx         # Pool data display  
├── PredictionList.tsx         # User predictions management
└── RiskAssessment.tsx         # AI risk display

src/hooks/
└── useVolatilityVanguard.ts   # Contract interaction hook

src/lib/
└── volatilityVanguardService.ts # Contract service layer
```

### Key Features

- **Single Responsibility**: Each component handles one specific function
- **Reusable Logic**: Hooks extract shared state management
- **Type Safety**: Full TypeScript integration
- **Error Handling**: Comprehensive error states and user feedback

## 🔧 Contract Integration

### Artifact Synchronization Protocol

The `scripts/sync-artifacts.js` automatically:

1. Reads deployment artifacts from `deployments/` directory
2. Extracts contract addresses and ABIs  
3. Creates standardized `frontend-artifacts.json`
4. Generates individual contract files for easy imports

### Frontend Usage

```typescript
// Import contract artifacts
import contractArtifacts from '@/constants/contract-artifacts.json';

// Access contract data
const { address, abi } = contractArtifacts.contracts.VolatilityVanguard;

// Use in service layer
const contract = new ethers.Contract(address, abi, provider);
```

## 🚀 Production Deployment

### Pre-deployment Checklist

- [ ] All environment variables configured
- [ ] Smart contracts deployed to target network
- [ ] Artifacts synchronized to frontend
- [ ] Frontend build passes without errors
- [ ] Contract functions tested on testnet

### Network Configuration

| Network | Chain ID | RPC URL |
|---------|----------|---------|
| Celo Testnet | 11142220 | https://forno.celo-sepolia.celo-testnet.org |
| Celo Mainnet | 42220 | https://forno.celo.org |

This standardized workflow ensures consistent, maintainable, and scalable development for all VibeCheck features.

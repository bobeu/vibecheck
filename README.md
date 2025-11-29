# VibeCheck

AI-Powered Crypto Project Viability Predictor with VolatilityVanguard Prediction Market

## Table of Contents

- [Overview](#overview)
- [Recent Changes](#recent-changes)
- [Prerequisites](#prerequisites)
- [Setup Instructions](#setup-instructions)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [MiniPay Integration](#minipay-integration)
- [Project Structure](#project-structure)
- [Troubleshooting](#troubleshooting)
- [Project Overview & Vision](#project-overview--vision)
- [Technical Architecture](#technical-architecture)
- [Volatility Vanguard Integration](#volatility-vanguard-integration)

## Overview

VibeCheck is a Next.js-based mini-app that provides AI-powered cryptocurrency project analysis and a prediction market game (VolatilityVanguard). The application supports multiple wallet contexts including MiniPay, Farcaster, and external wallets (MetaMask).

### Key Features

- **AI-Powered Token Analysis**: Get vibrancy scores and detailed reports for any cryptocurrency token
- **VolatilityVanguard Game**: Predict token volatility and compete for rewards using cUSD
- **Multi-Wallet Support**: Seamless integration with MiniPay, Farcaster, and MetaMask
- **Watchlist Management**: Track favorite tokens with premium features
- **Admin Panel**: Manage contract settings and rounds (admin only)
- **Onboarding Experience**: Interactive guide for new users

## Recent Changes

### Version Updates

- **cUSD Integration**: Migrated from native CELO to cUSD (ERC20) for all staking and payouts
- **Multi-Network Support**: Added support for both Celo Sepolia testnet and Celo Mainnet with automatic chain detection
- **Onboarding System**: New interactive onboarding flow with 6 educational steps
- **Admin Panel**: Comprehensive admin interface for contract management
- **Mock cUSD for Development**: Support for mock cUSD tokens when using external wallets
- **Improved Error Handling**: Better error messages and user feedback
- **Performance Optimizations**: Lightweight animations and optimized bundle size

### Technical Improvements

- Updated to use Wagmi v2 with `readContract` and `writeContract` from `wagmi/actions`
- ChainId-based contract address selection for multi-network support
- Enhanced webpack configuration to handle build issues
- Improved TypeScript types and error handling

## Prerequisites

Before setting up the project, ensure you have the following installed:

- **Node.js**: v18.0.0 or higher
- **Yarn**: v1.22.0 or higher (package manager)
- **Git**: For cloning the repository
- **MiniPay Wallet**: For testing in MiniPay context (optional)
- **MetaMask**: For testing with external wallets (optional)

### Verify Installation

```bash
node --version  # Should be v18.0.0 or higher
yarn --version  # Should be v1.22.0 or higher
```

## Setup Instructions

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd vibecheck
```

### Step 2: Install Dependencies

Install dependencies for both smart contracts and frontend:

```bash
# Install smart contract dependencies
cd smartContracts
yarn install

# Install frontend dependencies
cd ../frontend
yarn install
```

### Step 3: Configure Environment Variables

#### Smart Contracts

Create a `.env` file in the `smartContracts` directory:

```bash
cd smartContracts
cp .env.example .env  # If .env.example exists
```

Required variables:
- Private key for deployment
- RPC URLs for networks
- cUSD contract addresses

#### Frontend

Create a `.env.local` file in the `frontend` directory:

```bash
cd ../frontend
cp .env.example .env.local  # If .env.example exists
```

See [Environment Variables](#environment-variables) section for details.

### Step 4: Set Up Firebase (Optional)

Firebase is used for data persistence (watchlist, premium status). The app will fall back to localStorage if Firebase is not configured.

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication (Anonymous auth)
3. Create a Firestore database
4. Copy your Firebase config to `.env.local`

### Step 5: Deploy Smart Contracts

Deploy the VolatilityVanguard contract to your desired network:

```bash
cd smartContracts

# Deploy to Celo Sepolia (testnet)
yarn deploy-sepolia

# Or deploy to Celo Mainnet
yarn deploy-celo
```

### Step 6: Sync Smart Contract Artifacts

After deploying the smart contracts, sync the artifacts to the frontend:

```bash
cd smartContracts
yarn sync:data
```

This will generate:
- `frontend/src/constants/contract-artifacts.json` - Contract addresses and ABIs for all networks
- `frontend/src/contracts/volatilityVanguardAddress.ts` - Helper functions for contract addresses
- `frontend/src/abis/VolatilityVanguardABI.json` - Contract ABI

### Step 7: Mint Mock cUSD (Development Only)

For testing with external wallets on Sepolia, deploy and mint mock cUSD:

```bash
cd smartContracts
yarn hardhat run scripts/mintMockCUSDMultiple.ts --network sepolia
```

This will deploy a mock cUSD contract and mint tokens to specified addresses.

## Environment Variables

### Frontend Environment Variables

Create a `.env.local` file in the `frontend` directory:

```env
# Firebase Configuration (Optional - app works without it)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# RPC URLs (Required)
NEXT_PUBLIC_ALCHEMY_CELO_SEPOLIA_API=https://celo-sepolia.g.alchemy.com/v2/YOUR_API_KEY
NEXT_PUBLIC_ALCHEMY_CELO_MAINNET_API=https://celo-mainnet.g.alchemy.com/v2/YOUR_API_KEY

# WalletConnect (Optional - for WalletConnect integration)
NEXT_PUBLIC_WALLETCONNECT_ID=your_walletconnect_project_id

# Mock cUSD (Optional - for development with external wallets)
MOCK_CUSD_ADDRESS_SEPOLIA=0x...
MOCK_CUSD_ADDRESS_MAINNET=0x...
```

### Getting RPC URLs

1. **Alchemy**: Sign up at [Alchemy](https://www.alchemy.com/) and create apps for Celo Sepolia and Celo Mainnet
2. **Alternative**: Use public RPC endpoints (not recommended for production):
   - Celo Sepolia: `https://forno.celo-sepolia.celo-testnet.org`
   - Celo Mainnet: `https://forno.celo.org`

## Running the Application

### Development Mode

```bash
cd frontend
yarn dev
```

The application will start on `http://localhost:3000`

**Note**: The app uses `--webpack` flag to avoid Turbopack build issues with certain dependencies.

### Production Build

```bash
cd frontend
yarn build
yarn start
```

The production build will be optimized and ready for deployment.

### Linting

```bash
cd frontend
yarn lint
```

## MiniPay Integration

### Setting Up for MiniPay

MiniPay is a mobile wallet that provides a seamless Web3 experience. To test your app in MiniPay:

1. **Install MiniPay**: Download the MiniPay app on your mobile device
2. **Configure Network**: Ensure MiniPay is connected to Celo Sepolia (for testing) or Celo Mainnet
3. **Access via URL**: Open your app URL in MiniPay's browser

### MiniPay-Specific Features

- **Automatic Wallet Connection**: Wallet is automatically detected and connected
- **Native cUSD Support**: Uses real cUSD tokens (no mock tokens needed)
- **Optimized UI**: Mobile-first design optimized for MiniPay's viewport
- **Context Detection**: App automatically detects MiniPay context and adjusts UI

### Testing in MiniPay

1. Deploy your app to a public URL (Vercel, Netlify, etc.)
2. Open the URL in MiniPay's browser
3. The app will automatically detect MiniPay and connect the wallet
4. Ensure you have cUSD tokens in your MiniPay wallet for transactions

### Development with MiniPay

For local development, you can use:
- **ngrok**: Create a tunnel to your local server
- **LocalTunnel**: Alternative tunneling solution
- **MiniPay Dev Mode**: Some versions support localhost connections

```bash
# Example with ngrok
ngrok http 3000
# Use the ngrok URL in MiniPay
```

## Project Structure

```
vibecheck/
├── smartContracts/          # Smart contract development
│   ├── contracts/          # Solidity contracts
│   ├── deploy/             # Deployment scripts
│   ├── scripts/            # Utility scripts
│   └── test/               # Contract tests
├── frontend/               # Next.js frontend application
│   ├── src/
│   │   ├── app/            # Next.js App Router
│   │   ├── components/    # React components
│   │   ├── lib/           # Core libraries
│   │   ├── hooks/         # Custom React hooks
│   │   ├── contracts/    # Contract addresses and helpers
│   │   ├── constants/    # Constants and artifacts
│   │   └── abis/        # Contract ABIs
│   └── public/           # Static assets
└── README.md            # This file
```

## Troubleshooting

### Build Errors

**Error**: `Module not found: Can't resolve './contract-artifacts.json'`
- **Solution**: Run `yarn sync:data` from the `smartContracts` directory to generate contract artifacts

**Error**: Turbopack build errors with `thread-stream`
- **Solution**: The app uses `--webpack` flag by default. If issues persist, ensure `next.config.mjs` has the IgnorePlugin configuration

### Wallet Connection Issues

**Issue**: Wallet not connecting in MiniPay
- **Solution**: 
  - Ensure the app is accessed via HTTPS or localhost
  - Check that MiniPay is on the correct network (Sepolia or Mainnet)
  - Verify RPC URLs in `.env.local`

**Issue**: "Insufficient balance" errors
- **Solution**: 
  - For MiniPay: Ensure you have cUSD tokens in your wallet
  - For external wallets: Deploy and mint mock cUSD tokens using the script in `smartContracts/scripts/mintMockCUSDMultiple.ts`

### Contract Interaction Issues

**Issue**: Contract calls failing
- **Solution**:
  - Verify contract is deployed and artifacts are synced
  - Check that you're on the correct network
  - Ensure you have approved cUSD spending (for VolatilityVanguard)
  - Check browser console for detailed error messages

### Firebase Issues

**Issue**: Firebase authentication errors
- **Solution**: 
  - The app gracefully falls back to localStorage if Firebase is not configured
  - To enable Firebase: Configure all required environment variables
  - Ensure Anonymous authentication is enabled in Firebase Console

## Project Overview & Vision

### Concept

Vibecheck is a real-time sentiment analysis and prediction engine built for decentralized social networks and crypto communities. Its core function is to synthesize unstructured public data—primarily derived from Farcaster and other social platforms—into a singular, quantifiable metric: the Vibe Score. This score provides instant, actionable insight into the current emotional state and market outlook of a specific community, project, or token.

### Vision

Our vision is to become the definitive, objective layer for community sentiment in the decentralized space. Vibecheck aims to empower users, traders, and project teams by transforming noisy, qualitative data into a clear, predictive signal, bridging the gap between social conversation and on-chain action. We seek to foster engagement through gamified prediction markets based on the very scores we generate.

### Problem Solved

| Problem | Vibecheck Solution |
|---------|-------------------|
| Information Overload/Noise | Social media streams are overwhelming, making it impossible to manually gauge overall community feeling toward a topic. |
| Sentiment Lag & Bias | Existing tools often use lagged data or simple keyword counting, failing to capture subtle shifts in emotional tone (the "vibe"). |
| Low User Engagement | Data platforms are often passive. Users consume information but don't actively participate in shaping or predicting it. |

## Technical Architecture

### Layered Architecture

Vibecheck operates on a three-layer architecture:

1. **Data Acquisition Layer**: Ingests raw social data.
2. **Vibe Engine Layer (Business Logic)**: Processes, cleans, and scores the data.
3. **Application Layer (Frontend)**: Displays the score, handles user interactions, and manages the gaming aspect.

### Data Acquisition

- **Primary Source**: Farcaster (via public APIs like Neynar/Warpcast), prioritizing frame interactions and cast content.
- **Secondary Sources (Future Scaling)**: Selected Telegram/Discord channels, Twitter, and on-chain activity (e.g., DEX trading volume spikes, high-velocity transactions).
- **Data Structure**: All raw input is standardized into a JSON object containing: timestamp, platform, user_id/fid, raw_text, engagements (replies, likes, recasts/retweets).

### The Vibe Engine

The Vibe Engine is the proprietary, multi-stage processing pipeline that converts raw data into the final Vibe Score.

#### Data Cleaning and Normalization

- Removal of spam, bots (via basic heuristics/rate limiting), and non-textual content.
- Tokenization and lemmatization.

#### Sentiment Scoring (LLM Integration)

This utilizes the Gemini API for advanced sentiment detection:

- **Contextual Analysis**: For each piece of text, the LLM analyzes the sentiment, accounting for crypto-specific jargon and subtext (e.g., "NGMI" is negative, "WAGMI" is positive).
- **Nuance Detection**: The LLM detects:
  - Intensity: Is the emotion mild or fervent?
  - Polarity: Positive, Negative, or Neutral.
  - Conditional Sentiment: Is the positivity/negativity conditional on a future event?

#### Vibe Score Calculation

The final Vibe Score is a normalized weighted average, ranging from 0.0 to 10.0, derived from three factors:

Vibe Score = ((Σ S × W_E) + (Σ I × W_I) + (Σ R × W_R)) / 3

Where:
- **S (Sentiment)**: The LLM-derived Polarity score (e.g., -1 to +1), weighted by Engagement (W_E)
- **I (Intensity)**: The LLM-derived emotional strength score (0-1), weighted by Influence (W_I)
- **R (Recency)**: Time decay factor, giving more weight to recent data points, weighted by Recency (W_R)

### Frontend Implementation

- **Technology Stack**: Next.js 16 with React 18, Tailwind CSS, and TypeScript
- **Conditional Rendering**: The app checks the execution context (MiniPay, Farcaster, or external wallet) to adjust UI accordingly
- **Data Persistence**: Uses Firestore for real-time synchronization with localStorage fallback

## Volatility Vanguard Integration

### Overview

Volatility Vanguard is a cUSD-based prediction market integrated into VibeCheck where users bet on token volatility relative to AI-predicted risk levels.

### Smart Contract Deployment

#### Prerequisites

```bash
cd smartContracts
yarn install
cp .env.example .env
# Fill in your private key and API keys in .env
```

#### Deploy to Celo Sepolia

```bash
yarn deploy-sepolia
yarn sync:data
```

#### Deploy to Celo Mainnet

```bash
yarn deploy-celo
yarn sync:data
```

### Smart Contract Functions

#### Core Functions

1. **placePrediction(roundId, predictsHigher, amount)**
   - Requires cUSD approval before calling
   - Stakes cUSD tokens on volatility prediction
   - Records prediction with current round information

2. **claimWinnings(roundIds)**
   - Claims winnings from settled rounds
   - Pull-based claiming mechanism
   - Fees are taken from losing pool

3. **startNewRound()**
   - Admin-only function
   - Starts a new prediction round
   - Protected by lock time guard

### Risk Level Mapping

- **Score ≥80**: Low Risk (≤5% expected volatility)
- **Score 50-79**: Medium Risk (≤15% expected volatility)  
- **Score <50**: High Risk (>15% expected volatility)

### Frontend Integration

#### Components

- **VolatilityVanguard.tsx**: Main prediction interface
- **VolatilityVanguardService.ts**: Contract interaction layer using Wagmi
- **AdminPanel.tsx**: Admin interface for contract management

#### Key Features

1. **Risk Assessment Display**: Shows AI-derived risk level
2. **Pool Statistics**: Current betting distribution
3. **Prediction Interface**: Higher/Lower volatility buttons
4. **Prediction Management**: Track and resolve user predictions
5. **Real-time Updates**: Pool data refreshes automatically

#### Usage Flow

1. User selects token and views VibeCheck score
2. AI maps score to risk level (Low/Medium/High)
3. User approves cUSD spending (one-time or max approval)
4. User predicts if actual volatility will be Higher or Lower than threshold
5. User stakes cUSD amount
6. After lock period, oracle settles the round
7. Winners can claim their share of the losing pool

### Security Features

- **ReentrancyGuard**: Prevents reentrancy attacks
- **Ownable**: Admin functions for contract management
- **ERC20 Integration**: Uses actual cUSD token for payments
- **Time-based Resolution**: Enforces lock period before settlement
- **Pull-based Claiming**: Users actively claim winnings

### Gas Optimization

- Efficient struct packing
- Batch operations where possible
- Minimal external calls
- Optimized for Celo's low gas costs

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Wagmi Documentation](https://wagmi.sh)
- [Viem Documentation](https://viem.sh)
- [Celo Documentation](https://docs.celo.org)
- [MiniPay Documentation](https://docs.celo.org/developer/minipay)

## Contributing

When contributing to the project:

1. Follow the existing code style and patterns
2. Use TypeScript for all new code
3. Ensure components are mobile-responsive
4. Test in both MiniPay and browser contexts
5. Update this README if adding new setup steps

## License

See the LICENSE file for details.

---

**Need Help?** Check the troubleshooting section or open an issue in the repository.

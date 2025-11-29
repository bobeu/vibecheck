# VibeCheck Frontend

Next.js frontend application for VibeCheck - AI-Powered Crypto Project Viability Predictor

## Overview

This is the frontend application for VibeCheck, built with Next.js 16, React 18, and TypeScript. It provides a mobile-first interface optimized for MiniPay, Farcaster, and external wallets.

## Technology Stack

- **Framework**: Next.js 16.0.5 (App Router)
- **UI Library**: React 18.3.1
- **Styling**: Tailwind CSS 3.4.11
- **Web3**: Wagmi 2.12.17, Viem 2.21.19
- **State Management**: React Query (TanStack Query)
- **UI Components**: Radix UI
- **Type Safety**: TypeScript 5.5.3

## Quick Start

### Prerequisites

- Node.js v18.0.0 or higher
- Yarn v1.22.0 or higher

### Installation

```bash
# Install dependencies
yarn install

# Copy environment variables
cp .env.example .env.local

# Configure environment variables (see Environment Variables section)
```

### Development

```bash
yarn dev
```

The app will be available at `http://localhost:3000`

### Production Build

```bash
yarn build
yarn start
```

## Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── App.tsx            # Main application component
│   │   ├── page.tsx           # Home page entry point
│   │   ├── layout.tsx         # Root layout with providers
│   │   ├── providers.tsx      # Wagmi and React Query providers
│   │   └── admin/             # Admin panel route
│   ├── components/            # React components
│   │   ├── Onboarding.tsx    # Interactive onboarding flow
│   │   ├── VolatilityVanguard.tsx  # Prediction game UI
│   │   ├── AdminPanel.tsx     # Admin interface
│   │   ├── TokenSearch.tsx   # Token search component
│   │   ├── Watchlist.tsx     # Watchlist management
│   │   ├── WalletConnect.tsx # Wallet connection UI
│   │   └── ui/               # Reusable UI components (Radix UI)
│   ├── lib/                  # Core libraries and services
│   │   ├── wagmi.ts          # Wagmi configuration
│   │   ├── volatilityVanguardService.ts  # Contract interactions
│   │   ├── paymentService.ts # Payment handling
│   │   ├── firebaseService.ts # Firebase integration
│   │   ├── vibeService.ts    # AI analysis service
│   │   └── utils.ts          # Utility functions
│   ├── hooks/                # Custom React hooks
│   │   ├── useVolatilityVanguard.ts
│   │   ├── useWallet.ts
│   │   └── use-toast.ts
│   ├── contracts/            # Contract addresses and helpers
│   │   ├── volatilityVanguardAddress.ts
│   │   └── mockCUSD.ts
│   ├── constants/            # Constants and artifacts
│   │   └── contract-artifacts.json
│   └── abis/                 # Contract ABIs
│       └── VolatilityVanguardABI.json
├── public/                   # Static assets
│   ├── logo.png
│   └── frame.svg
├── next.config.mjs          # Next.js configuration
├── tailwind.config.js       # Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration
└── package.json            # Dependencies and scripts
```

## Key Components

### Onboarding Component

Interactive 6-step onboarding flow that educates users about:
- VibeCheck features
- How the platform works
- VolatilityVanguard game mechanics
- How to join and play
- Winner determination
- Withdrawal process

### VolatilityVanguard Component

Main prediction game interface featuring:
- Real-time round information
- Risk assessment display
- Pool statistics
- Prediction input (Higher/Lower)
- cUSD balance display
- Claim winnings functionality

### AdminPanel Component

Admin-only interface for:
- Viewing contract configuration
- Starting new rounds
- Managing contract settings (oracle, fees, thresholds)
- Emergency withdrawals

## Environment Variables

Required environment variables (see main README for full list):

```env
# RPC URLs (Required)
NEXT_PUBLIC_ALCHEMY_CELO_SEPOLIA_API=https://...
NEXT_PUBLIC_ALCHEMY_CELO_MAINNET_API=https://...

# Firebase (Optional)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
# ... other Firebase vars

# WalletConnect (Optional)
NEXT_PUBLIC_WALLETCONNECT_ID=...
```

## Wallet Integration

### Supported Wallets

1. **MiniPay**: Automatic detection and connection
2. **Farcaster**: Context-aware UI adjustments
3. **MetaMask/External Wallets**: Full support with mock cUSD for development

### Wallet Detection

The app automatically detects the wallet context using helper functions in `src/lib/wagmi.ts`:
- `isMiniPay()`: Detects MiniPay context
- `isFarcaster()`: Detects Farcaster context
- `isExternalWallet()`: Detects external wallets

## Contract Integration

### Contract Address Management

The app uses chainId-based contract address selection:

```typescript
import { getVolatilityVanguardAddress, getVolatilityVanguardABI } from '@/contracts/volatilityVanguardAddress';

const address = getVolatilityVanguardAddress(chainId);
const abi = getVolatilityVanguardABI(chainId);
```

### Contract Service

The `VolatilityVanguardService` class handles all contract interactions:
- Uses Wagmi's `readContract` and `writeContract` from `wagmi/actions`
- Accepts Wagmi config at construction
- Handles cUSD approval flow automatically
- Provides error handling and user feedback

## Styling

### Theme Colors

The app uses a custom color scheme defined in `tailwind.config.js`:
- `celo`: Primary brand color (green)
- `minipay`: MiniPay accent color
- Custom gradients and shadows

### Responsive Design

- Mobile-first approach
- Optimized for MiniPay viewport
- Breakpoints: sm, md, lg

## Development Guidelines

### Code Style

- Use TypeScript for all new code
- Follow React best practices (hooks, functional components)
- Use Tailwind CSS for styling
- Keep components small and focused
- Use custom hooks for reusable logic

### Testing

- Test in MiniPay context
- Test with external wallets (MetaMask)
- Verify contract interactions on testnet
- Check responsive design on mobile devices

### Performance

- Use Next.js Image component for images
- Lazy load heavy components
- Optimize bundle size
- Use React.memo for expensive components

## Build Configuration

### Webpack Configuration

The app uses webpack (not Turbopack) to avoid issues with certain dependencies. Configuration in `next.config.mjs`:
- Ignores test files from `thread-stream` package
- Aliases React Native AsyncStorage to web stub
- Configures standalone output

### TypeScript Configuration

Strict TypeScript configuration in `tsconfig.json`:
- Path aliases: `@/` for `src/`
- Strict mode enabled
- Next.js types included

## Common Issues

### Contract Artifacts Not Found

Run the sync script from the smart contracts directory:
```bash
cd ../smartContracts
yarn sync:data
```

### Build Errors

Ensure you're using the webpack build:
```bash
yarn build  # Uses --webpack flag automatically
```

### Wallet Connection

- Check network configuration
- Verify RPC URLs
- Ensure wallet is on correct network

## Scripts

- `yarn dev`: Start development server
- `yarn build`: Build for production
- `yarn start`: Start production server
- `yarn lint`: Run ESLint

## Dependencies

Key dependencies:
- `next`: 16.0.5
- `react`: 18.3.1
- `wagmi`: 2.12.17
- `viem`: 2.21.19
- `firebase`: 12.6.0
- `@radix-ui/*`: UI component library
- `tailwindcss`: 3.4.11

See `package.json` for complete list.

## License

See the main project LICENSE file.

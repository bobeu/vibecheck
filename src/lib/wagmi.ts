import { http, createConfig } from 'wagmi'
import { celo, celoAlfajores } from 'wagmi/chains'
import { injected, walletConnect } from 'wagmi/connectors'

// Celo Sepolia Testnet configuration (since it's not in wagmi/chains by default)
const celoSepolia = {
  id: 11142220,
  name: 'Celo Sepolia',
  nativeCurrency: {
    decimals: 18,
    name: 'CELO',
    symbol: 'CELO',
  },
  rpcUrls: {
    default: {
      http: ['https://forno.celo-sepolia.celo-testnet.org'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Celo Sepolia Explorer',
      url: 'https://celo-sepolia.blockscout.com',
    },
  },
  contracts: {
    multicall3: {
      address: '0xcA11bde05977b3631167028862bE2a173976CA11',
      blockCreated: 21758,
    },
  },
  testnet: true,
} as const

// WalletConnect project ID - you'll need to get this from https://cloud.walletconnect.com
const projectId = process.env.REACT_APP_WALLETCONNECT_PROJECT_ID || 'your-walletconnect-project-id'

export const wagmiConfig = createConfig({
  chains: [celoSepolia, celo, celoAlfajores],
  connectors: [
    injected({
      target: {
        id: 'minipay',
        name: 'MiniPay',
        provider: () => {
          if (typeof window !== 'undefined' && window.ethereum?.isMiniPay) {
            return window.ethereum
          }
          return null
        },
      },
    }),
    injected({
      target: 'metaMask',
    }),
    walletConnect({
      projectId,
      metadata: {
        name: 'VibeCheck',
        description: 'AI-Powered Crypto Project Viability Predictor',
        url: 'https://vibecheck.app',
        icons: ['https://vibecheck.app/favicon.ico'],
      },
    }),
  ],
  transports: {
    [celoSepolia.id]: http(),
    [celo.id]: http(),
    [celoAlfajores.id]: http(),
  },
})

declare module 'wagmi' {
  interface Register {
    config: typeof wagmiConfig
  }
}

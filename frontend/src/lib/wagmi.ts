import { http, createConfig } from 'wagmi'
import { celo, celoSepolia } from 'wagmi/chains'
import { injected, walletConnect } from 'wagmi/connectors'

// Celo Sepolia Testnet configuration (since it's not in wagmi/chains by default)
// const celoSepolia = {
//   id: 11142220,
//   name: 'Celo Sepolia',
//   nativeCurrency: {
//     decimals: 18,
//     name: 'CELO',
//     symbol: 'CELO',
//   },
//   rpcUrls: {
//     default: {
//       http: ['https://forno.celo-sepolia.celo-testnet.org'],
//     },
//   },
//   blockExplorers: {
//     default: {
//       name: 'Celo Sepolia Explorer',
//       url: 'https://celo-sepolia.blockscout.com',
//     },
//   },
//   contracts: {
//     multicall3: {
//       address: '0xcA11bde05977b3631167028862bE2a173976CA11',
//       blockCreated: 21758,
//     },
//   },
//   testnet: true,
// } as const

// WalletConnect project ID - you'll need to get this from https://cloud.walletconnect.com
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_ID as string;

// Helper function to detect MiniPay
export const isMiniPay = (): boolean => {
  if (typeof window === 'undefined') return false
  return !!(window as any).ethereum?.isMiniPay
}

// Helper function to detect Farcaster context
export const isFarcaster = (): boolean => {
  if (typeof window === 'undefined') return false
  const userAgent = window.navigator.userAgent.toLowerCase()
  const urlParams = new URLSearchParams(window.location.search)
  return (
    userAgent.includes('farcaster') ||
    urlParams.has('farcaster') ||
    urlParams.get('mode') === 'farcaster' ||
    (window as any).farcaster !== undefined
  )
}

// Helper function to detect external wallet context (MetaMask, etc.)
// Returns true if wallet is connected but NOT MiniPay or Farcaster
export const isExternalWallet = (): boolean => {
  if (typeof window === 'undefined') return false
  const ethereum = (window as any).ethereum
  if (!ethereum) return false
  
  // If it's MiniPay or Farcaster, it's not an external wallet
  if (isMiniPay() || isFarcaster()) return false
  
  // If it's MetaMask or another external wallet, return true
  return !!(ethereum.isMetaMask || ethereum.isCoinbaseWallet || ethereum.isRabby || ethereum.isBraveWallet)
}

// Helper function to get the provider
export const getProvider = () => {
  if (typeof window === 'undefined') return undefined
  // Verify window.ethereum exists before returning
  if ((window as any).ethereum) {
    return (window as any).ethereum
  }
  return undefined
}

// Configure connectors with MiniPay priority
const connectorsList = [
  // MiniPay connector (highest priority)
  injected({
    target: {
      id: 'minipay',
      name: 'MiniPay',
      provider: getProvider,
    },
  }),
  // MetaMask connector
  injected({ target: 'metaMask' }),
  // Generic injected connector (fallback)
  injected(),
  // WalletConnect (if project ID is available)
  ...(projectId
    ? [
        walletConnect({
          projectId,
          metadata: {
            name: 'VibeCheck',
            description: 'AI-Powered Crypto Project Viability Predictor',
            url: 'https://vibecheck.app',
            icons: ['https://vibecheck.app/favicon.ico'],
          },
        }),
      ]
    : []),
]


export const wagmiConfig = createConfig({
  chains: [celoSepolia, celo],
  connectors: connectorsList,
  transports: {
    [celoSepolia.id]: http(process.env.NEXT_PUBLIC_ALCHEMY_CELO_SEPOLIA_API as string),
    [celo.id]: http(process.env.NEXT_PUBLIC_ALCHEMY_CELO_MAINNET_API),
  },
});

declare module 'wagmi' {
  interface Register {
    config: typeof wagmiConfig
  }
}

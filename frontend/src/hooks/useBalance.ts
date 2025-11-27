// import { useBalance as useWagmiBalance } from 'wagmi'
// import { Address } from 'viem'
// import { formatUnits } from 'viem'

// export const useBalance = (address?: Address) => {
//   const { data, isError, isLoading, refetch } = useWagmiBalance({
//     address,
//     query: {
//       enabled: !!address,
//       refetchInterval: 10000, // Refetch every 10 seconds
//     },
//   })

//   const formatBalance = (decimals: number = 18) => {
//     if (!data) return '0'
//     return formatUnits(data.value, decimals)
//   }

//   return {
//     data,
//     balance: data?.value || 0n,
//     symbol: data?.symbol || 'CELO',
//     decimals: data?.decimals || 18,
//     formatted: data?.formatted || '0',
//     formatBalance,
//     isLoading,
//     isError,
//     refetch,
//   }
// }

// // Hook for cUSD balance specifically
// export const useCUSDBalance = (address?: Address) => {
//   const cUSDAddress = '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1' // Celo Sepolia cUSD

//   const { data, isError, isLoading, refetch } = useWagmiBalance({
//     address,
//     token: cUSDAddress as Address,
//     query: {
//       enabled: !!address,
//       refetchInterval: 10000,
//     },
//   })

//   return {
//     data,
//     balance: data?.value || 0n,
//     formatted: data?.formatted || '0',
//     isLoading,
//     isError,
//     refetch,
//   }
// }

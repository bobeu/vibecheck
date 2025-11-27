// import { useReadContract, useReadContracts } from 'wagmi'
// import { Address } from 'viem'

// // Generic hook for reading single contract values
// export const useContractRead = <T = unknown>({
//   address,
//   abi,
//   functionName,
//   args,
//   enabled = true,
//   watch = false,
// }: {
//   address?: Address
//   abi: readonly unknown[]
//   functionName: string
//   args?: readonly unknown[]
//   enabled?: boolean
//   watch?: boolean
// }) => {
//   const result = useReadContract({
//     address,
//     abi,
//     functionName,
//     args,
//     query: {
//       enabled: enabled && !!address,
//       refetchInterval: watch ? 5000 : undefined, // Poll every 5 seconds if watching
//     },
//   })

//   return {
//     data: result.data as T,
//     isLoading: result.isLoading,
//     isError: result.isError,
//     error: result.error,
//     refetch: result.refetch,
//   }
// }

// // Hook for reading multiple contract values at once
// export const useMultipleContractReads = <T = unknown[]>({
//   contracts,
//   enabled = true,
//   watch = false,
// }: {
//   contracts: {
//     address?: Address
//     abi: readonly unknown[]
//     functionName: string
//     args?: readonly unknown[]
//   }[]
//   enabled?: boolean
//   watch?: boolean
// }) => {
//   const result = useReadContracts({
//     contracts: contracts.map(contract => ({
//       address: contract.address,
//       abi: contract.abi,
//       functionName: contract.functionName,
//       args: contract.args,
//     })),
//     query: {
//       enabled,
//       refetchInterval: watch ? 5000 : undefined,
//     },
//   })

//   return {
//     data: result.data as T,
//     isLoading: result.isLoading,
//     isError: result.isError,
//     error: result.error,
//     refetch: result.refetch,
//   }
// }

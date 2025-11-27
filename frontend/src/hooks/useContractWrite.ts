// import { useWriteContract, useSimulateContract, useWaitForTransactionReceipt } from 'wagmi'
// import { Address } from 'viem'
// import { useState, useEffect } from 'react'
// import { useToast } from '@/hooks/use-toast'

// export const useContractWrite = ({
//   address,
//   abi,
//   functionName,
//   onSuccess,
//   onError,
// }: {
//   address?: Address
//   abi: readonly unknown[]
//   functionName: string
//   onSuccess?: (hash: string) => void
//   onError?: (error: Error) => void
// }) => {
//   const { toast } = useToast()
//   const [args, setArgs] = useState<readonly unknown[]>([])
//   const [value, setValue] = useState<bigint>(0n)

//   // Simulate the transaction before writing
//   const {
//     data: simulateData,
//     error: simulateError,
//     isLoading: isSimulating,
//   } = useSimulateContract({
//     address,
//     abi,
//     functionName,
//     args,
//     value,
//     query: {
//       enabled: !!address && args.length > 0,
//     },
//   })

//   // Write contract
//   const {
//     writeContract,
//     data: hash,
//     error: writeError,
//     isPending: isWriting,
//   } = useWriteContract()

//   // Wait for transaction confirmation
//   const {
//     isLoading: isConfirming,
//     isSuccess: isConfirmed,
//     error: confirmError,
//   } = useWaitForTransactionReceipt({
//     hash,
//   })

//   // Handle successful transaction
//   useEffect(() => {
//     if (isConfirmed && hash) {
//       toast({
//         title: 'Transaction Successful',
//         description: `TX: ${hash.substring(0, 16)}...`,
//       })
//       onSuccess?.(hash)
//     }
//   }, [isConfirmed, hash, toast, onSuccess])

//   // Handle errors
//   useEffect(() => {
//     const error = simulateError || writeError || confirmError
//     if (error) {
//       console.error('Contract write error:', error)
      
//       let errorMessage = 'Transaction failed'
//       if (error.message?.includes('User rejected')) {
//         errorMessage = 'Transaction was rejected by user'
//       } else if (error.message?.includes('insufficient funds')) {
//         errorMessage = 'Insufficient funds for transaction'
//       } else if (error.message?.includes('execution reverted')) {
//         errorMessage = 'Transaction reverted - check contract conditions'
//       }
      
//       toast({
//         title: 'Transaction Failed',
//         description: errorMessage,
//       })
      
//       onError?.(error)
//     }
//   }, [simulateError, writeError, confirmError, toast, onError])

//   const execute = async (newArgs: readonly unknown[], newValue: bigint = 0n) => {
//     setArgs(newArgs)
//     setValue(newValue)

//     // Wait a bit for simulation to complete
//     await new Promise(resolve => setTimeout(resolve, 100))

//     if (simulateData?.request) {
//       writeContract(simulateData.request)
//     } else {
//       // Fallback: write without simulation
//       writeContract({
//         address: address!,
//         abi,
//         functionName,
//         args: newArgs,
//         value: newValue,
//       })
//     }
//   }

//   const canExecute = !!address && !simulateError && !isSimulating

//   return {
//     execute,
//     canExecute,
//     isLoading: isSimulating || isWriting || isConfirming,
//     isSimulating,
//     isWriting,
//     isConfirming,
//     isConfirmed,
//     hash,
//     simulateError,
//     writeError,
//     confirmError,
//   }
// }

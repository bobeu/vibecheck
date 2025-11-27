import { Address } from 'viem'
import { useReadContract, useWriteContract, useSimulateContract, useWaitForTransactionReceipt } from 'wagmi'
import { useEffect, useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import VolatilityVanguardABI from '@/abis/VolatilityVanguardABI.json'
import { VOLATILITY_VANGUARD_ADDRESS } from '@/contracts/volatilityVanguardAddress'
import { parseUnits } from 'viem'

const contractAddress = VOLATILITY_VANGUARD_ADDRESS as Address

// Hook for reading pool information
export const usePoolInfo = (tokenAddress: string, riskLevel: number) => {
  return useReadContract({
    address: contractAddress,
    abi: VolatilityVanguardABI,
    functionName: 'getPoolInfo',
    args: [tokenAddress as Address, BigInt(riskLevel)],
    query: {
      enabled: !!tokenAddress && riskLevel >= 0 && contractAddress !== '0x0000000000000000000000000000000000000000',
      refetchInterval: 5000, // Poll every 5 seconds for real-time updates
    },
  })
}

// Hook for reading user predictions
export const useUserPredictions = (userAddress?: Address) => {
  return useReadContract({
    address: contractAddress,
    abi: VolatilityVanguardABI,
    functionName: 'getUserPredictions',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress && contractAddress !== '0x0000000000000000000000000000000000000000',
      refetchInterval: 5000, // Poll every 5 seconds
    },
  })
}

// Hook for reading specific prediction details
export const usePredictionDetails = (predictionId: number) => {
  return useReadContract({
    address: contractAddress,
    abi: VolatilityVanguardABI,
    functionName: 'predictions',
    args: [BigInt(predictionId)],
    query: {
      enabled: predictionId > 0 && contractAddress !== '0x0000000000000000000000000000000000000000',
    },
  })
}

// Hook for placing predictions
export const usePlacePrediction = () => {
  const { toast } = useToast()
  const [args, setArgs] = useState<readonly unknown[]>([])
  const [value, setValue] = useState<bigint>(BigInt(0))

  // Simulate the transaction
  const { data: simulateData, error: simulateError, isLoading: isSimulating } = useSimulateContract({
    address: contractAddress,
    abi: VolatilityVanguardABI,
    functionName: 'placePrediction',
    args,
    value,
    query: {
      enabled: args.length > 0 && contractAddress !== '0x0000000000000000000000000000000000000000',
    },
  })

  // Write contract
  const { writeContract, data: hash, error: writeError, isPending: isWriting } = useWriteContract()

  // Wait for transaction confirmation
  const { isLoading: isConfirming, isSuccess: isConfirmed, error: confirmError } = useWaitForTransactionReceipt({
    hash,
  })

  // Handle success
  useEffect(() => {
    if (isConfirmed && hash) {
      toast({
        title: 'Transaction Successful',
        description: `Prediction placed! TX: ${hash.substring(0, 16)}...`,
      })
    }
  }, [isConfirmed, hash, toast])

  // Handle errors
  useEffect(() => {
    const error = simulateError || writeError || confirmError
    if (error) {
      let errorMessage = 'Transaction failed'
      if (error.message?.includes('User rejected')) {
        errorMessage = 'Transaction was rejected by user'
      } else if (error.message?.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for transaction'
      }
      toast({
        title: 'Transaction Failed',
        description: errorMessage,
      })
    }
  }, [simulateError, writeError, confirmError, toast])

  const execute = async (newArgs: readonly unknown[], newValue: bigint = BigInt(0)) => {
    setArgs(newArgs)
    setValue(newValue)

    // Wait a bit for simulation to complete
    await new Promise(resolve => setTimeout(resolve, 100))

    if (simulateData?.request) {
      writeContract(simulateData.request)
    } else {
      // Fallback: write without simulation
      writeContract({
        address: contractAddress,
        abi: VolatilityVanguardABI,
        functionName: 'placePrediction',
        args: newArgs,
        value: newValue,
      })
    }
  }

  return {
    execute,
    canExecute: !!simulateData?.request && !isSimulating,
    isLoading: isSimulating || isWriting || isConfirming,
    isSimulating,
    isWriting,
    isConfirming,
    isConfirmed,
    hash,
    simulateError,
    writeError,
    confirmError,
  }
}

// Hook for resolving predictions
export const useResolvePrediction = () => {
  const { toast } = useToast()
  const [args, setArgs] = useState<readonly unknown[]>([])
  const [value, setValue] = useState<bigint>(BigInt(0))

  // Simulate the transaction
  const { data: simulateData, error: simulateError, isLoading: isSimulating } = useSimulateContract({
    address: contractAddress,
    abi: VolatilityVanguardABI,
    functionName: 'resolvePrediction',
    args,
    value,
    query: {
      enabled: args.length > 0 && contractAddress !== '0x0000000000000000000000000000000000000000',
    },
  })

  // Write contract
  const { writeContract, data: hash, error: writeError, isPending: isWriting } = useWriteContract()

  // Wait for transaction confirmation
  const { isLoading: isConfirming, isSuccess: isConfirmed, error: confirmError } = useWaitForTransactionReceipt({
    hash,
  })

  // Handle success
  useEffect(() => {
    if (isConfirmed && hash) {
      toast({
        title: 'Transaction Successful',
        description: `Prediction resolved! TX: ${hash.substring(0, 16)}...`,
      })
    }
  }, [isConfirmed, hash, toast])

  // Handle errors
  useEffect(() => {
    const error = simulateError || writeError || confirmError
    if (error) {
      let errorMessage = 'Transaction failed'
      if (error.message?.includes('User rejected')) {
        errorMessage = 'Transaction was rejected by user'
      } else if (error.message?.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for transaction'
      }
      toast({
        title: 'Transaction Failed',
        description: errorMessage,
      })
    }
  }, [simulateError, writeError, confirmError, toast])

  const execute = async (newArgs: readonly unknown[], newValue: bigint = BigInt(0)) => {
    setArgs(newArgs)
    setValue(newValue)

    // Wait a bit for simulation to complete
    await new Promise(resolve => setTimeout(resolve, 100))

    if (simulateData?.request) {
      writeContract(simulateData.request)
    } else {
      // Fallback: write without simulation
      writeContract({
        address: contractAddress,
        abi: VolatilityVanguardABI,
        functionName: 'resolvePrediction',
        args: newArgs,
        value: newValue,
      })
    }
  }

  return {
    execute,
    canExecute: !!simulateData?.request && !isSimulating,
    isLoading: isSimulating || isWriting || isConfirming,
    isSimulating,
    isWriting,
    isConfirming,
    isConfirmed,
    hash,
    simulateError,
    writeError,
    confirmError,
  }
}

// Hook for reading contract constants
export const useContractConstants = () => {
  const { data: predictionCost } = useReadContract({
    address: contractAddress,
    abi: VolatilityVanguardABI,
    functionName: 'PREDICTION_COST',
    query: {
      enabled: contractAddress !== '0x0000000000000000000000000000000000000000',
    },
  })

  const { data: predictionPeriod } = useReadContract({
    address: contractAddress,
    abi: VolatilityVanguardABI,
    functionName: 'PREDICTION_PERIOD',
    query: {
      enabled: contractAddress !== '0x0000000000000000000000000000000000000000',
    },
  })

  const { data: platformFee } = useReadContract({
    address: contractAddress,
    abi: VolatilityVanguardABI,
    functionName: 'PLATFORM_FEE_PERCENT',
    query: {
      enabled: contractAddress !== '0x0000000000000000000000000000000000000000',
    },
  })

  return {
    predictionCost: predictionCost ? Number(predictionCost) / 1e18 : 0.1,
    predictionPeriod: predictionPeriod ? Number(predictionPeriod) : 7 * 24 * 60 * 60,
    platformFee: platformFee ? Number(platformFee) : 5,
  }
}

// Utility functions for contract interaction
export const contractUtils = {
  // Parse prediction cost to wei
  parsePredictionCost: () => parseUnits('0.1', 18),
  
  // Format pool data
  formatPoolData: (poolData: [bigint, bigint, bigint, bigint, boolean]) => {
    const [poolId, totalAmount, higherAmount, lowerAmount, resolved] = poolData
    const total = Number(totalAmount) / 1e18
    const higher = Number(higherAmount) / 1e18
    const lower = Number(lowerAmount) / 1e18
    
    return {
      poolId: Number(poolId),
      totalAmount: total,
      higherAmount: higher,
      lowerAmount: lower,
      resolved,
      higherPercentage: total > 0 ? (higher / total) * 100 : 0,
      lowerPercentage: total > 0 ? (lower / total) * 100 : 0,
    }
  },
  
  // Map vibrancy score to risk level
  mapScoreToRiskLevel: (score: number): number => {
    if (score >= 80) return 0 // Low risk
    if (score >= 50) return 1 // Medium risk
    return 2 // High risk
  },
}

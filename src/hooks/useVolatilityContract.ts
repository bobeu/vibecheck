import { Address } from 'viem'
import { useContractRead, useContractWrite } from '@/hooks/useContractRead'
import { useContractWrite as useWrite } from '@/hooks/useContractWrite'
import VolatilityVanguardABI from '@/abis/VolatilityVanguardABI.json'
import { VOLATILITY_VANGUARD_ADDRESS } from '@/contracts/volatilityVanguardAddress'
import { parseUnits } from 'viem'

const contractAddress = VOLATILITY_VANGUARD_ADDRESS as Address

// Hook for reading pool information
export const usePoolInfo = (tokenAddress: string, riskLevel: number) => {
  return useContractRead<[bigint, bigint, bigint, bigint, boolean]>({
    address: contractAddress,
    abi: VolatilityVanguardABI,
    functionName: 'getPoolInfo',
    args: [tokenAddress as Address, riskLevel],
    enabled: !!tokenAddress && riskLevel >= 0,
    watch: true, // Enable real-time updates
  })
}

// Hook for reading user predictions
export const useUserPredictions = (userAddress?: Address) => {
  return useContractRead<bigint[]>({
    address: contractAddress,
    abi: VolatilityVanguardABI,
    functionName: 'getUserPredictions',
    args: [userAddress],
    enabled: !!userAddress,
    watch: true,
  })
}

// Hook for reading specific prediction details
export const usePredictionDetails = (predictionId: number) => {
  return useContractRead({
    address: contractAddress,
    abi: VolatilityVanguardABI,
    functionName: 'predictions',
    args: [predictionId],
    enabled: predictionId > 0,
  })
}

// Hook for placing predictions
export const usePlacePrediction = () => {
  return useWrite({
    address: contractAddress,
    abi: VolatilityVanguardABI,
    functionName: 'placePrediction',
  })
}

// Hook for resolving predictions
export const useResolvePrediction = () => {
  return useWrite({
    address: contractAddress,
    abi: VolatilityVanguardABI,
    functionName: 'resolvePrediction',
  })
}

// Hook for reading contract constants
export const useContractConstants = () => {
  const { data: predictionCost } = useContractRead<bigint>({
    address: contractAddress,
    abi: VolatilityVanguardABI,
    functionName: 'PREDICTION_COST',
  })

  const { data: predictionPeriod } = useContractRead<bigint>({
    address: contractAddress,
    abi: VolatilityVanguardABI,
    functionName: 'PREDICTION_PERIOD',
  })

  const { data: platformFee } = useContractRead<bigint>({
    address: contractAddress,
    abi: VolatilityVanguardABI,
    functionName: 'PLATFORM_FEE_PERCENT',
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

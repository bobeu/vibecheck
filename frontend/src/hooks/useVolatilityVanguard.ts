import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAccount, useConfig } from 'wagmi';
import { useToast } from '@/hooks/use-toast';
import { 
  VolatilityVanguardService,
  type RoundData,
  type UserPrediction 
} from '@/lib/volatilityVanguardService';
import { parseEther, formatEther } from 'viem';

interface UseVolatilityVanguardProps {
  // No longer need tokenAddress or vibrancyScore for round-based system
}

export const useVolatilityVanguard = ({}: UseVolatilityVanguardProps = {}) => {
  const { toast } = useToast();
  const { address: userAddress } = useAccount();
  const config = useConfig();
  
  // Create service instance with wagmi config
  const volatilityVanguardService = useMemo(
    () => new VolatilityVanguardService(config),
    [config]
  );
  
  const [currentRound, setCurrentRound] = useState<RoundData | null>(null);
  const [currentRoundId, setCurrentRoundId] = useState<number>(0);
  const [userPrediction, setUserPrediction] = useState<UserPrediction | null>(null);
  const [userRounds, setUserRounds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [contractConfig, setContractConfig] = useState<{
    feeRate: bigint;
    riskThreshold: bigint;
    lockTime: bigint;
  } | null>(null);

  // Load current round info
  const loadCurrentRound = useCallback(async () => {
    try {
      const roundId = await volatilityVanguardService.getCurrentRoundId();
      setCurrentRoundId(roundId);
      
      if (roundId > 0) {
        const roundInfo = await volatilityVanguardService.getRoundInfo(roundId);
        setCurrentRound(roundInfo);
        
        // Load user's prediction for current round if connected
        if (userAddress && roundInfo) {
          const prediction = await volatilityVanguardService.getUserPrediction(roundId, userAddress);
          setUserPrediction(prediction);
        }
      }
    } catch (error) {
      console.error('Error loading current round:', error);
    }
  }, [userAddress, volatilityVanguardService]);

  // Load user's rounds
  const loadUserRounds = useCallback(async () => {
    if (!userAddress) {
      setUserRounds([]);
      return;
    }
    
    try {
      const currentId = await volatilityVanguardService.getCurrentRoundId();
      if (currentId > 0) {
        // Get rounds from 1 to current
        const rounds = await volatilityVanguardService.getUserRounds(userAddress, 1, currentId);
        setUserRounds(rounds);
      }
    } catch (error) {
      console.error('Error loading user rounds:', error);
    }
  }, [userAddress, volatilityVanguardService]);

  // Load contract configuration
  const loadContractConfig = useCallback(async () => {
    try {
      const contractConfigData = await volatilityVanguardService.getContractConfig();
      setContractConfig(contractConfigData);
    } catch (error) {
      console.error('Error loading contract config:', error);
    }
  }, [volatilityVanguardService]);

  // Place prediction - Uses service which handles cUSD approval
  const placePrediction = useCallback(async (
    roundId: number,
    predictsHigher: boolean,
    stakeAmount: string // Amount in cUSD
  ) => {
    if (!userAddress) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet"
      });
      return { success: false, error: "Wallet not connected" };
    }

    setIsLoading(true);
    try {
      const result = await volatilityVanguardService.placePrediction(
        roundId,
        predictsHigher,
        stakeAmount
      );

      if (result.success) {
        toast({
          title: "Prediction Placed!",
          description: `Staked ${stakeAmount} cUSD on Round ${roundId}`
        });
        
        // Refresh data
        await loadCurrentRound();
        await loadUserRounds();
      } else {
        throw new Error(result.error);
      }
      
      return result;
    } catch (error: any) {
      toast({
        title: "Prediction Failed",
        description: error.message || "Failed to place prediction"
      });
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  }, [toast, loadCurrentRound, loadUserRounds, userAddress, volatilityVanguardService]);

  // Claim winnings - Uses Wagmi internally
  const claimWinnings = useCallback(async (roundIds: number[]) => {
    if (!userAddress) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet"
      });
      return { success: false, error: "Wallet not connected" };
    }

    setIsLoading(true);
    try {
      const result = await volatilityVanguardService.claimWinnings(roundIds);

      if (result.success) {
        toast({
          title: "Winnings Claimed!",
          description: `Successfully claimed winnings for ${roundIds.length} round(s)`
        });
        
        // Refresh data
        await loadCurrentRound();
        await loadUserRounds();
      } else {
        throw new Error(result.error);
      }
      
      return result;
    } catch (error: any) {
      toast({
        title: "Claim Failed",
        description: error.message || "Failed to claim winnings"
      });
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  }, [toast, loadCurrentRound, loadUserRounds, userAddress, volatilityVanguardService]);

  // Initialize data
  useEffect(() => {
    loadCurrentRound();
    loadContractConfig();
  }, [loadCurrentRound, loadContractConfig]);

  useEffect(() => {
    if (userAddress) {
      loadUserRounds();
    }
  }, [userAddress, loadUserRounds]);

  // Poll for round updates
  useEffect(() => {
    const interval = setInterval(() => {
      loadCurrentRound();
      if (userAddress) {
        loadUserRounds();
      }
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(interval);
  }, [loadCurrentRound, loadUserRounds, userAddress]);

  return {
    currentRound,
    currentRoundId,
    userPrediction,
    userRounds,
    isLoading,
    contractConfig,
    placePrediction,
    claimWinnings,
    refreshData: useCallback(() => {
      loadCurrentRound();
      if (userAddress) {
        loadUserRounds();
      }
    }, [loadCurrentRound, loadUserRounds, userAddress])
  };
};

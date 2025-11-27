import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { useToast } from '@/hooks/use-toast';
import { 
  volatilityVanguardService, 
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
  }, [userAddress]);

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
  }, [userAddress]);

  // Load contract configuration
  const loadContractConfig = useCallback(async () => {
    try {
      const config = await volatilityVanguardService.getContractConfig();
      setContractConfig(config);
    } catch (error) {
      console.error('Error loading contract config:', error);
    }
  }, []);

  // Place prediction - This function is kept for compatibility but should use Wagmi hooks in component
  const placePrediction = useCallback(async (
    roundId: number,
    predictsHigher: boolean,
    stakeAmount: string // Amount in CELO
  ) => {
    if (!userAddress) {
      toast({
        title: "Wallet Required",
        description: "Please connect your MiniPay wallet"
      });
      return { success: false, error: "Wallet not connected" };
    }

    setIsLoading(true);
    try {
      if (!window.ethereum) {
        throw new Error("Wallet provider not available");
      }

      // Use ethers if available, otherwise import it
      let ethersModule: any;
      if (typeof window !== 'undefined' && (window as any).ethers) {
        ethersModule = (window as any).ethers;
      } else {
        ethersModule = await import('ethers');
      }

      const provider = new ethersModule.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      const result = await volatilityVanguardService.placePrediction(
        roundId,
        predictsHigher,
        stakeAmount,
        signer
      );

      if (result.success) {
        toast({
          title: "Prediction Placed!",
          description: `Staked ${stakeAmount} CELO on Round ${roundId}`
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
  }, [toast, loadCurrentRound, loadUserRounds, userAddress]);

  // Claim winnings - This function is kept for compatibility but should use Wagmi hooks in component
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
      if (!window.ethereum) {
        throw new Error("Wallet provider not available");
      }

      // Use ethers if available, otherwise import it
      let ethersModule: any;
      if (typeof window !== 'undefined' && (window as any).ethers) {
        ethersModule = (window as any).ethers;
      } else {
        ethersModule = await import('ethers');
      }

      const provider = new ethersModule.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      const result = await volatilityVanguardService.claimWinnings(roundIds, signer);

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
  }, [toast, loadCurrentRound, loadUserRounds, userAddress]);

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

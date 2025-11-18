import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useToast } from '@/hooks/use-toast';
import { 
  volatilityVanguardService, 
  type PoolData,
  type PredictionData 
} from '@/lib/volatilityVanguardService';

interface UseVolatilityVanguardProps {
  tokenAddress: string;
  vibrancyScore: number;
}

export const useVolatilityVanguard = ({ 
  tokenAddress, 
  vibrancyScore 
}: UseVolatilityVanguardProps) => {
  const { toast } = useToast();
  const [poolData, setPoolData] = useState<PoolData | null>(null);
  const [userPredictions, setUserPredictions] = useState<PredictionData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userAddress, setUserAddress] = useState<string | null>(null);

  // Check user address
  const checkUserAddress = useCallback(async () => {
    try {
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const accounts = await provider.listAccounts();
        if (accounts.length > 0) {
          setUserAddress(accounts[0]);
        }
      }
    } catch (error) {
      console.error('Error checking user address:', error);
    }
  }, []);

  // Load pool data
  const loadPoolData = useCallback(async () => {
    try {
      // Skip loading if using mock token address
      if (tokenAddress === '0x0000000000000000000000000000000000000000') {
        setPoolData(null);
        return;
      }
      
      const data = await volatilityVanguardService.getPoolInfo(tokenAddress, vibrancyScore);
      setPoolData(data);
    } catch (error) {
      console.warn('Error loading pool data (expected if contract not deployed):', error);
      setPoolData(null);
    }
  }, [tokenAddress, vibrancyScore]);

  // Load user predictions
  const loadUserPredictions = useCallback(async () => {
    if (!userAddress) return;
    
    try {
      const predictions = await volatilityVanguardService.getUserPredictions(userAddress);
      // Filter predictions for current token
      const tokenPredictions = predictions.filter(p => 
        p.token.toLowerCase() === tokenAddress.toLowerCase()
      );
      setUserPredictions(tokenPredictions);
    } catch (error) {
      console.error('Error loading user predictions:', error);
    }
  }, [userAddress, tokenAddress]);

  // Place prediction
  const placePrediction = useCallback(async (predictedHigher: boolean) => {
    if (!window.ethereum) {
      toast({
        title: "Wallet Required",
        description: "Please connect your MiniPay wallet"
      });
      return;
    }

    setIsLoading(true);
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      const result = await volatilityVanguardService.placePrediction(
        tokenAddress,
        vibrancyScore,
        predictedHigher,
        signer
      );

      if (result.success) {
        toast({
          title: "Prediction Placed!",
          description: `Prediction ID: ${result.predictionId}. Resolves in 7 days.`
        });
        
        // Refresh data
        await loadPoolData();
        await loadUserPredictions();
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({
        title: "Prediction Failed",
        description: error.message || "Failed to place prediction"
      });
    } finally {
      setIsLoading(false);
    }
  }, [tokenAddress, vibrancyScore, toast, loadPoolData, loadUserPredictions]);

  // Resolve prediction
  const resolvePrediction = useCallback(async (predictionId: number) => {
    if (!window.ethereum) return;

    setIsLoading(true);
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      const result = await volatilityVanguardService.resolvePrediction(predictionId, signer);

      if (result.success) {
        const payout = result.payout ? parseFloat(result.payout) : 0;
        toast({
          title: "Prediction Resolved!",
          description: payout > 0 ? `You won ${payout.toFixed(4)} cUSD!` : "Prediction resolved."
        });
        
        // Refresh data
        await loadPoolData();
        await loadUserPredictions();
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({
        title: "Resolution Failed",
        description: error.message || "Failed to resolve prediction"
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, loadPoolData, loadUserPredictions]);

  // Initialize data
  useEffect(() => {
    checkUserAddress();
    loadPoolData();
  }, [checkUserAddress, loadPoolData]);

  useEffect(() => {
    if (userAddress) {
      loadUserPredictions();
    }
  }, [userAddress, loadUserPredictions]);

  return {
    poolData,
    userPredictions,
    isLoading,
    userAddress,
    placePrediction,
    resolvePrediction,
    refreshData: useCallback(() => {
      loadPoolData();
      if (userAddress) {
        loadUserPredictions();
      }
    }, [loadPoolData, loadUserPredictions, userAddress])
  };
};

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { volatilityPredictionService, type VolatilityPrediction } from '@/lib/volatilityPredictionService';

interface UseVolatilityPredictionProps {
  tokenSymbol: string;
  enabled: boolean;
}

export const useVolatilityPrediction = ({ 
  tokenSymbol, 
  enabled 
}: UseVolatilityPredictionProps) => {
  const { toast } = useToast();
  const [prediction, setPrediction] = useState<VolatilityPrediction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPrediction = useCallback(async () => {
    if (!enabled || !tokenSymbol) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await volatilityPredictionService.fetchVolatilityPrediction(tokenSymbol);
      
      if (result.success && result.data) {
        setPrediction(result.data);
        toast({
          title: "AI Prediction Updated",
          description: `Latest volatility analysis for ${tokenSymbol} loaded`
        });
      } else {
        throw new Error(result.error || 'Failed to fetch prediction');
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to fetch volatility prediction';
      setError(errorMessage);
      
      if (error.message.includes('access') || error.message.includes('purchase')) {
        toast({
          title: "Prediction Access Required",
          description: "Purchase a VibeCheck report to access volatility predictions"
        });
      } else {
        toast({
          title: "Prediction Failed",
          description: errorMessage
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [tokenSymbol, enabled, toast]);

  // Auto-fetch when enabled and token changes
  useEffect(() => {
    if (enabled && tokenSymbol) {
      fetchPrediction();
    }
  }, [enabled, tokenSymbol, fetchPrediction]);

  const refreshPrediction = useCallback(() => {
    fetchPrediction();
  }, [fetchPrediction]);

  return {
    prediction,
    isLoading,
    error,
    refreshPrediction
  };
};

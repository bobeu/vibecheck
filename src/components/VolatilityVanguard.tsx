import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Target, Zap, Clock, TrendingUp, TrendingDown, CheckCircle, XCircle, AlertTriangle, Brain, Timer } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useWallet } from '@/hooks/useWallet';
import { usePoolInfo, usePlacePrediction, useUserPredictions, contractUtils } from '@/hooks/useVolatilityContract';
import { useVolatilityPrediction } from '@/hooks/useVolatilityPrediction';
import AIVolatilityAnalysis from './volatility/AIVolatilityAnalysis';
import PredictionInput from './volatility/PredictionInput';
import PoolStatistics from './volatility/PoolStatistics';
import PredictionList from './volatility/PredictionList';
import RiskAssessment from './volatility/RiskAssessment';
import { useToast } from '@/hooks/use-toast';
import { parseUnits } from 'viem';

interface VolatilityVanguardProps {
  tokenSymbol: string;
  tokenAddress: string;
  vibrancyScore: number;
  isVisible: boolean;
}

const VolatilityVanguard: React.FC<VolatilityVanguardProps> = ({
  tokenSymbol,
  tokenAddress,
  vibrancyScore,
  isVisible
}) => {
  // Calculate implied risk level from VibeCheck score
  const impliedRiskLevel = contractUtils.mapScoreToRiskLevel(vibrancyScore);
  const { toast } = useToast();
  
  // Wagmi hooks
  const { address, isConnected } = useWallet();
  
  // Contract interaction hooks
  const { data: poolData, isLoading: poolLoading, refetch: refetchPool } = usePoolInfo(tokenAddress, impliedRiskLevel);
  const { data: userPredictionIds, isLoading: predictionsLoading, refetch: refetchPredictions } = useUserPredictions(address);
  const { execute: placePrediction, isLoading: isPlacing } = usePlacePrediction();
  
  // Format pool data
  const formattedPoolData = useMemo(() => {
    if (!poolData) return null;
    return contractUtils.formatPoolData(poolData);
  }, [poolData]);

  // Handle prediction placement
  const handlePlacePrediction = useCallback(async (predictedHigher: boolean) => {
    if (!isConnected) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet to place a prediction"
      });
      return;
    }

    try {
      await placePrediction([tokenAddress, impliedRiskLevel, predictedHigher], parseUnits('0.1', 18));
      
      // Refresh data after successful transaction
      refetchPool();
      refetchPredictions();
    } catch (error) {
      // Error handling is done in the useContractWrite hook
    }
  }, [isConnected, placePrediction, tokenAddress, impliedRiskLevel, toast, refetchPool, refetchPredictions]);

  const {
    prediction: aiPrediction,
    isLoading: predictionLoading,
    error: predictionError,
    refreshPrediction
  } = useVolatilityPrediction({ tokenSymbol, enabled: isVisible });

  if (!isVisible) {
    return null;
  }

  return (
    <Card className="mt-8 border-border/50 bg-card/80 backdrop-blur-sm">
      <div className="p-6 border-b border-border/50">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 gradient-fusion rounded-lg shadow-glow">
            <Target className="h-5 w-5 text-primary-foreground" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Volatility Vanguard</h2>
        </div>
        <p className="text-muted-foreground text-sm">
          Predict {tokenSymbol}'s 7-day volatility with AI-powered insights
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* AI Volatility Analysis */}
        <AIVolatilityAnalysis
          prediction={aiPrediction}
          isLoading={predictionLoading}
          error={predictionError}
          onRefresh={refreshPrediction}
        />

        {/* Risk Assessment */}
        <RiskAssessment
          vibrancyScore={vibrancyScore}
          impliedRiskLevel={impliedRiskLevel}
          tokenSymbol={tokenSymbol}
        />

        {/* Pool Statistics */}
        {poolData && (
          <div>
            <h3 className="font-semibold text-foreground mb-3">Current Betting Pool</h3>
            <PoolStatistics poolData={poolData} />
          </div>
        )}

        {/* Prediction Input */}
        <PredictionInput
          vibrancyScore={vibrancyScore}
          impliedRiskLevel={impliedRiskLevel}
          isLoading={contractLoading}
          onPlacePrediction={placePrediction}
        />

        {/* Active Prediction Countdown */}
        {activePrediction && (
          <Card className="p-4 bg-celo/10 border-celo/30">
            <div className="flex items-center gap-2 mb-2">
              <Timer className="h-4 w-4 text-celo animate-pulse" />
              <span className="font-semibold text-foreground">Active Prediction</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Your {activePrediction.predictedHigher ? 'Higher' : 'Lower'} prediction resolves in 7 days
            </p>
          </Card>
        )}

        {/* User Predictions History */}
        <div>
          <h3 className="font-semibold text-foreground mb-3">Your Predictions</h3>
          <PredictionList
            predictions={userPredictions}
            isLoading={contractLoading}
            tokenSymbol={tokenSymbol}
            onResolvePrediction={resolvePrediction}
          />
        </div>

        {/* How It Works */}
        <Card className="p-4 bg-muted/20 border-border/50">
          <h4 className="font-medium text-foreground mb-2">How It Works</h4>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>• AI analyzes {tokenSymbol} and sets volatility thresholds</p>
            <p>• Predict if 7-day volatility will be Higher or Lower</p>
            <p>• Stake 0.1 cUSD per prediction via MiniPay</p>
            <p>• Winners share the pool after 7 days</p>
          </div>
        </Card>
      </div>
    </Card>
  );
};

export default VolatilityVanguard;

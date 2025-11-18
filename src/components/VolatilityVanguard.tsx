import React from 'react';
import { Target } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mapScoreToImpliedRisk } from '@/lib/volatilityVanguardService';
import { useVolatilityVanguard } from '@/hooks/useVolatilityVanguard';

// Modular Components
import PredictionInput from '@/components/volatility/PredictionInput';
import PoolStatistics from '@/components/volatility/PoolStatistics';
import PredictionList from '@/components/volatility/PredictionList';
import RiskAssessment from '@/components/volatility/RiskAssessment';

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
  const {
    poolData,
    userPredictions,
    isLoading,
    placePrediction,
    resolvePrediction
  } = useVolatilityVanguard({
    tokenAddress,
    vibrancyScore
  });

  const impliedRiskLevel = mapScoreToImpliedRisk(vibrancyScore);

  if (!isVisible) return null;

  return (
    <Card className="p-6 bg-card/80 border-border/50 backdrop-blur-sm">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Target className="h-6 w-6 text-celo" />
            <h2 className="text-2xl font-bold text-foreground">Volatility Vanguard</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Predict {tokenSymbol}'s 7-day volatility • Win cUSD • Powered by AI Risk Assessment
          </p>
        </div>

        {/* Risk Assessment */}
        <RiskAssessment 
          vibrancyScore={vibrancyScore}
          impliedRiskLevel={impliedRiskLevel}
          tokenSymbol={tokenSymbol}
        />

        <Tabs defaultValue="predict" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-muted/30">
            <TabsTrigger value="predict">Make Prediction</TabsTrigger>
            <TabsTrigger value="manage">My Predictions</TabsTrigger>
          </TabsList>

          <TabsContent value="predict" className="space-y-4 mt-4">
            {/* Pool Statistics */}
            <PoolStatistics poolData={poolData} />

            {/* Prediction Input */}
            <PredictionInput
              vibrancyScore={vibrancyScore}
              impliedRiskLevel={impliedRiskLevel}
              isLoading={isLoading}
              onPlacePrediction={placePrediction}
            />
          </TabsContent>

          <TabsContent value="manage" className="space-y-4 mt-4">
            <PredictionList
              predictions={userPredictions}
              isLoading={isLoading}
              tokenSymbol={tokenSymbol}
              onResolvePrediction={resolvePrediction}
            />
          </TabsContent>
        </Tabs>
      </div>
    </Card>
  );
};

export default VolatilityVanguard;

import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getRiskLabel, getRiskThreshold } from '@/lib/volatilityVanguardService';

interface PredictionInputProps {
  vibrancyScore: number;
  impliedRiskLevel: number;
  isLoading: boolean;
  onPlacePrediction: (predictedHigher: boolean) => Promise<void>;
}

const PredictionInput: React.FC<PredictionInputProps> = ({
  vibrancyScore,
  impliedRiskLevel,
  isLoading,
  onPlacePrediction
}) => {
  const riskThreshold = getRiskThreshold(impliedRiskLevel);

  return (
    <div className="space-y-4">
      {/* Risk Assessment Display */}
      <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
        <div className="text-center">
          <div className="text-sm font-medium text-foreground mb-1">
            AI Risk Assessment: {getRiskLabel(impliedRiskLevel)}
          </div>
          <div className="text-xs text-muted-foreground">
            Vibrancy Score: <span className="font-bold text-celo">{vibrancyScore}</span> • 
            Volatility Threshold: <span className="font-medium">{riskThreshold}%</span>
          </div>
        </div>
      </div>

      {/* Prediction Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <Button
          onClick={() => onPlacePrediction(true)}
          disabled={isLoading}
          className="h-24 flex-col gap-2 gradient-danger hover:opacity-90"
        >
          <TrendingUp className="h-6 w-6" />
          <div className="text-center">
            <div className="font-bold">Higher Volatility</div>
            <div className="text-xs opacity-90">>{riskThreshold}% change</div>
            <div className="text-sm font-medium">0.1 cUSD</div>
          </div>
        </Button>

        <Button
          onClick={() => onPlacePrediction(false)}
          disabled={isLoading}
          className="h-24 flex-col gap-2 gradient-success hover:opacity-90"
        >
          <TrendingDown className="h-6 w-6" />
          <div className="text-center">
            <div className="font-bold">Lower Volatility</div>
            <div className="text-xs opacity-90">≤{riskThreshold}% change</div>
            <div className="text-sm font-medium">0.1 cUSD</div>
          </div>
        </Button>
      </div>

      <div className="text-center text-xs text-muted-foreground">
        Predictions resolve automatically after 7 days • Winners share the pool
      </div>
    </div>
  );
};

export default PredictionInput;

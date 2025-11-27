import React from 'react';
import { TrendingUp, TrendingDown, Clock, Award, Target } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { type PredictionData } from '@/lib/volatilityVanguardService';

interface PredictionListProps {
  predictions: PredictionData[];
  isLoading: boolean;
  tokenSymbol: string;
  onResolvePrediction: (predictionId: number) => void;
}

const PredictionList: React.FC<PredictionListProps> = ({
  predictions,
  isLoading,
  tokenSymbol,
  onResolvePrediction
}) => {
  const canResolvePrediction = (prediction: PredictionData): boolean => {
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const predictionTime = prediction.startTime * 1000;
    
    return !prediction.resolved && (now >= predictionTime + sevenDaysInMs);
  };

  const getTimeRemaining = (prediction: PredictionData): string => {
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const predictionTime = prediction.startTime * 1000;
    const endTime = predictionTime + sevenDaysInMs;
    
    if (now >= endTime) return "Ready to resolve";
    
    const remaining = endTime - now;
    const days = Math.floor(remaining / (24 * 60 * 60 * 1000));
    const hours = Math.floor((remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    
    if (days > 0) return `${days}d ${hours}h remaining`;
    return `${hours}h remaining`;
  };

  if (predictions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Target className="h-8 w-8 mx-auto mb-2" />
        <p>No predictions for {tokenSymbol} yet</p>
        <p className="text-sm mt-1">Make your first prediction to start earning!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {predictions.map((prediction) => (
        <Card key={prediction.id} className="p-4 bg-muted/20 border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${
                prediction.predictedHigher ? 'bg-accent-red/20' : 'bg-minipay/20'
              }`}>
                {prediction.predictedHigher ? (
                  <TrendingUp className="h-4 w-4 text-accent-red" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-minipay" />
                )}
              </div>
              <div>
                <div className="font-semibold text-foreground">
                  Prediction #{prediction.id}
                </div>
                <div className="text-sm text-muted-foreground">
                  {prediction.predictedHigher ? 'Higher' : 'Lower'} Volatility
                </div>
                <div className="text-xs text-muted-foreground">
                  Start Price: ${parseFloat(prediction.startPrice).toFixed(4)}
                </div>
              </div>
            </div>
            
            <div className="text-right">
              {prediction.resolved ? (
                <div className="flex items-center gap-2">
                  {prediction.won ? (
                    <Award className="h-4 w-4 text-celo" />
                  ) : null}
                  <Badge variant={prediction.won ? "default" : "secondary"}>
                    {prediction.won ? 'Won' : 'Lost'}
                  </Badge>
                </div>
              ) : canResolvePrediction(prediction) ? (
                <Button
                  onClick={() => onResolvePrediction(prediction.id)}
                  disabled={isLoading}
                  size="sm"
                  className="gradient-celo"
                >
                  Resolve
                </Button>
              ) : (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span className="text-xs">{getTimeRemaining(prediction)}</span>
                </div>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default PredictionList;

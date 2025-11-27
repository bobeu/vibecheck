import React from 'react';
import { Brain, TrendingUp, TrendingDown, Minus, RefreshCw, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { type VolatilityPrediction } from '@/lib/volatilityPredictionService';

interface AIVolatilityAnalysisProps {
  prediction: VolatilityPrediction | null;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
}

const AIVolatilityAnalysis: React.FC<AIVolatilityAnalysisProps> = ({
  prediction,
  isLoading,
  error,
  onRefresh
}) => {
  const getDirectionIcon = (direction: string) => {
    switch (direction) {
      case 'Bullish': return <TrendingUp className="h-4 w-4 text-minipay" />;
      case 'Bearish': return <TrendingDown className="h-4 w-4 text-accent-red" />;
      default: return <Minus className="h-4 w-4 text-celo" />;
    }
  };

  const getDirectionColor = (direction: string) => {
    switch (direction) {
      case 'Bullish': return 'border-minipay/30 text-minipay';
      case 'Bearish': return 'border-accent-red/30 text-accent-red';
      default: return 'border-celo/30 text-celo';
    }
  };

  if (error) {
    return (
      <Card className="p-6 border-accent-red/30 bg-accent-red/5">
        <div className="text-center">
          <div className="text-accent-red mb-4">
            <Brain className="h-8 w-8 mx-auto" />
          </div>
          <h3 className="font-semibold text-foreground mb-2">AI Prediction Error</h3>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <Button onClick={onRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry Analysis
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-card/80 border-border/50 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-celo" />
          <h3 className="font-semibold text-foreground">AI Volatility Analysis</h3>
        </div>
        <div className="flex items-center gap-2">
          {prediction && (
            <Badge variant="outline" className={getDirectionColor(prediction.direction)}>
              {getDirectionIcon(prediction.direction)}
              <span className="ml-1">{prediction.direction}</span>
            </Badge>
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="h-4 bg-muted rounded animate-pulse" />
          <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
          <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
        </div>
      ) : prediction ? (
        <div className="space-y-6">
          {/* AI Threshold & Confidence */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <div className="text-2xl font-bold text-celo glow-text">
                {prediction.aiThreshold}%
              </div>
              <div className="text-xs text-muted-foreground">AI Threshold</div>
            </div>
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <div className="text-2xl font-bold text-foreground">
                {prediction.confidence}%
              </div>
              <div className="text-xs text-muted-foreground">Confidence</div>
              <Progress value={prediction.confidence} className="mt-2 h-2" />
            </div>
          </div>

          {/* Analysis Sections */}
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-foreground mb-2">Summary</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {prediction.summary}
              </p>
            </div>

            <div>
              <h4 className="font-medium text-foreground mb-2">Volatility Assessment</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {prediction.volatilityAssessment}
              </p>
            </div>

            <div>
              <h4 className="font-medium text-foreground mb-2">72-Hour Prediction</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {prediction.prediction72h}
              </p>
            </div>
          </div>

          {/* Sources */}
          {prediction.sources && prediction.sources.length > 0 && (
            <div>
              <h4 className="font-medium text-foreground mb-2">Data Sources</h4>
              <div className="space-y-1">
                {prediction.sources.slice(0, 3).map((source, index) => (
                  <a
                    key={index}
                    href={source.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-celo hover:text-celo-bright underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    <span className="truncate">{source.title}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Timestamp */}
          <div className="text-xs text-muted-foreground text-center pt-2 border-t border-border/50">
            Analysis generated: {new Date(prediction.timestamp).toLocaleString()}
          </div>
        </div>
      ) : (
        <div className="text-center text-muted-foreground py-8">
          <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No AI analysis available</p>
        </div>
      )}
    </Card>
  );
};

export default AIVolatilityAnalysis;

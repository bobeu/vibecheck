import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { getRiskLabel, getRiskThreshold } from '@/lib/volatilityVanguardService';

interface RiskAssessmentProps {
  vibrancyScore: number;
  impliedRiskLevel: number;
  tokenSymbol: string;
}

const RiskAssessment: React.FC<RiskAssessmentProps> = ({
  vibrancyScore,
  impliedRiskLevel,
  tokenSymbol
}) => {
  const riskLabel = getRiskLabel(impliedRiskLevel);
  const riskThreshold = getRiskThreshold(impliedRiskLevel);

  const getRiskColor = (level: number): string => {
    switch (level) {
      case 0: return 'border-minipay/30 text-minipay';
      case 1: return 'border-celo/30 text-celo';
      case 2: return 'border-accent-red/30 text-accent-red';
      default: return 'border-muted-foreground/30 text-muted-foreground';
    }
  };

  return (
    <Card className="p-4 bg-muted/30 border-border/50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-celo" />
          <span className="font-semibold text-foreground">AI Risk Assessment</span>
        </div>
        <Badge 
          variant="outline" 
          className={getRiskColor(impliedRiskLevel)}
        >
          {riskLabel}
        </Badge>
      </div>
      
      <div className="space-y-2 text-sm">
        <p className="text-muted-foreground">
          Based on {tokenSymbol} VibeCheck Score: <span className="font-bold text-celo">{vibrancyScore}</span>
        </p>
        <p className="text-muted-foreground">
          Expected volatility threshold: <span className="font-medium">{riskThreshold}%</span> over 7 days
        </p>
        <p className="text-xs text-muted-foreground opacity-75">
          Predict whether actual price movement will be higher or lower than this threshold
        </p>
      </div>
    </Card>
  );
};

export default RiskAssessment;

import React from 'react';
import { Progress } from '@/components/ui/progress';
import { type PoolData } from '@/lib/volatilityVanguardService';

interface PoolStatisticsProps {
  poolData: PoolData | null;
}

const PoolStatistics: React.FC<PoolStatisticsProps> = ({ poolData }) => {
  if (!poolData || poolData.poolId === 0 || poolData.totalAmount === '0') {
    return (
      <div className="text-center text-muted-foreground py-4">
        <p className="text-sm">Contract not deployed - Pool data unavailable</p>
        <p className="text-xs">Be the first to make a prediction!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="text-3xl font-bold text-celo glow-text">
          {parseFloat(poolData.totalAmount).toFixed(2)}
        </div>
        <div className="text-sm text-muted-foreground">Total Pool (cUSD)</div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-foreground">Higher Volatility Bets</span>
          <span className="text-accent-red font-medium">{poolData.higherPercentage.toFixed(1)}%</span>
        </div>
        <Progress 
          value={poolData.higherPercentage} 
          className="h-3"
        />
        
        <div className="flex justify-between text-sm">
          <span className="text-foreground">Lower Volatility Bets</span>
          <span className="text-minipay font-medium">{poolData.lowerPercentage.toFixed(1)}%</span>
        </div>
        <Progress 
          value={poolData.lowerPercentage} 
          className="h-3"
        />
      </div>

      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Higher: {poolData.higherAmount} cUSD</span>
        <span>Lower: {poolData.lowerAmount} cUSD</span>
      </div>
    </div>
  );
};

export default PoolStatistics;

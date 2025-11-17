import React from 'react';
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle, Activity, Users, DollarSign, Whale } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import VibrancyScore from './VibrancyScore';
import { type DetailedReport as ReportType, getScoreColor } from '@/lib/vibeService';

interface DetailedReportProps {
  report: ReportType;
}

const DetailedReport: React.FC<DetailedReportProps> = ({ report }) => {
  const { tokenInfo, vibrancyData, insights, metrics } = report;

  const MetricCard = ({ 
    icon: Icon, 
    title, 
    value, 
    trend 
  }: { 
    icon: any, 
    title: string, 
    value: number, 
    trend?: 'up' | 'down' | 'neutral' 
  }) => (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">{title}</span>
        </div>
        {trend && (
          <div className={`flex items-center gap-1 ${
            trend === 'up' ? 'text-accent-green' : trend === 'down' ? 'text-destructive' : 'text-muted-foreground'
          }`}>
            {trend === 'up' ? <TrendingUp className="h-3 w-3" /> : 
             trend === 'down' ? <TrendingDown className="h-3 w-3" /> : null}
          </div>
        )}
      </div>
      <div className="space-y-2">
        <div className={`text-2xl font-bold ${getScoreColor(value)}`}>
          {value}%
        </div>
        <Progress value={value} className="h-2" />
      </div>
    </Card>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center">
            <span className="text-white font-bold">{tokenInfo.symbol.charAt(0)}</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold">{tokenInfo.symbol}</h1>
            <p className="text-muted-foreground">{tokenInfo.name}</p>
          </div>
        </div>
        
        <div className="flex justify-center">
          <VibrancyScore 
            score={vibrancyData.overallScore} 
            size="lg" 
            animated 
          />
        </div>
      </div>

      {/* Score Breakdown */}
      <Card className="p-6 space-y-4">
        <h2 className="text-lg font-semibold">Score Breakdown</h2>
        
        <div className="grid gap-4">
          <div className="flex items-center justify-between">
            <span className="font-medium">Code Health</span>
            <div className="flex items-center gap-2">
              <Progress value={vibrancyData.codeHealth} className="w-24 h-2" />
              <span className={`font-bold ${getScoreColor(vibrancyData.codeHealth)}`}>
                {vibrancyData.codeHealth}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="font-medium">Community Sentiment</span>
            <div className="flex items-center gap-2">
              <Progress value={100 - vibrancyData.communityFud} className="w-24 h-2" />
              <span className={`font-bold ${getScoreColor(100 - vibrancyData.communityFud)}`}>
                {100 - vibrancyData.communityFud}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="font-medium">Tokenomics</span>
            <div className="flex items-center gap-2">
              <Progress value={vibrancyData.tokenomics} className="w-24 h-2" />
              <span className={`font-bold ${getScoreColor(vibrancyData.tokenomics)}`}>
                {vibrancyData.tokenomics}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <MetricCard 
          icon={Activity}
          title="Development"
          value={metrics.developmentActivity}
          trend="up"
        />
        <MetricCard 
          icon={Users}
          title="Community"
          value={metrics.communityGrowth}
          trend="up"
        />
        <MetricCard 
          icon={DollarSign}
          title="Liquidity"
          value={metrics.liquidityHealth}
          trend="neutral"
        />
        <MetricCard 
          icon={Whale}
          title="Whale Risk"
          value={100 - metrics.whaleConcentration}
          trend="neutral"
        />
      </div>

      {/* AI Insights */}
      <Card className="p-6 space-y-4">
        <h2 className="text-lg font-semibold">AI Analysis</h2>
        
        {/* Strengths */}
        {insights.strengths.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-accent-green font-medium">
              <CheckCircle className="h-4 w-4" />
              <span>Strengths</span>
            </div>
            <div className="space-y-1">
              {insights.strengths.map((strength, index) => (
                <div key={index} className="flex items-start gap-2 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent-green mt-2 flex-shrink-0" />
                  <span>{strength}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Concerns */}
        {insights.concerns.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-accent-orange font-medium">
              <AlertCircle className="h-4 w-4" />
              <span>Areas of Concern</span>
            </div>
            <div className="space-y-1">
              {insights.concerns.map((concern, index) => (
                <div key={index} className="flex items-start gap-2 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent-orange mt-2 flex-shrink-0" />
                  <span>{concern}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Prediction */}
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="font-medium mb-2">Long-term Prediction</div>
          <p className="text-sm text-muted-foreground">{insights.prediction}</p>
        </div>
      </Card>

      {/* Footer */}
      <div className="text-center text-xs text-muted-foreground">
        <p>Report generated by VibeCheck AI • Last updated: {new Date(vibrancyData.lastUpdated).toLocaleDateString()}</p>
        <p className="mt-1">This analysis is for informational purposes only and should not be considered as financial advice.</p>
      </div>
    </div>
  );
};

export default DetailedReport;

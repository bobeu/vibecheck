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
    <Card className="p-4 bg-card/80 border-border/50 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-celo" />
          <span className="text-sm font-medium text-foreground">{title}</span>
        </div>
        {trend && (
          <div className={`flex items-center gap-1 ${
            trend === 'up' ? 'text-minipay' : trend === 'down' ? 'text-destructive' : 'text-muted-foreground'
          }`}>
            {trend === 'up' ? <TrendingUp className="h-3 w-3" /> : 
             trend === 'down' ? <TrendingDown className="h-3 w-3" /> : null}
          </div>
        )}
      </div>
      <div className="space-y-2">
        <div className={`text-2xl font-bold ${value >= 70 ? 'text-celo glow-text' : getScoreColor(value)}`}>
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
          <div className="w-12 h-12 rounded-full gradient-celo flex items-center justify-center shadow-celo">
            <span className="text-primary-foreground font-bold">{tokenInfo.symbol.charAt(0)}</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{tokenInfo.symbol}</h1>
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

      {/* Real-time Analysis Section (if available from Gemini) */}
      {(report.vibrancyData as any).analysisText && (
        <Card className="p-6 space-y-4 bg-card/80 border-border/50 backdrop-blur-sm">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Activity className="h-5 w-5 text-celo" />
            Real-Time Market Analysis
          </h2>
          <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
            <p className="text-sm text-foreground leading-relaxed">{(report.vibrancyData as any).analysisText}</p>
          </div>
        </Card>
      )}

      {/* Score Breakdown */}
      <Card className="p-6 space-y-4 bg-card/80 border-border/50 backdrop-blur-sm">
        <h2 className="text-lg font-semibold text-foreground">AI Analysis Breakdown</h2>
        
        <div className="grid gap-4">
          <div className="flex items-center justify-between">
            <span className="font-medium text-foreground">Code Health (LSTM)</span>
            <div className="flex items-center gap-2">
              <Progress value={vibrancyData.codeHealth} className="w-24 h-2" />
              <span className={`font-bold ${vibrancyData.codeHealth >= 70 ? 'text-celo' : getScoreColor(vibrancyData.codeHealth)}`}>
                {vibrancyData.codeHealth}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="font-medium text-foreground">Community Sentiment (NLP)</span>
            <div className="flex items-center gap-2">
              <Progress value={100 - vibrancyData.communityFud} className="w-24 h-2" />
              <span className={`font-bold ${(100 - vibrancyData.communityFud) >= 70 ? 'text-celo' : getScoreColor(100 - vibrancyData.communityFud)}`}>
                {100 - vibrancyData.communityFud}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="font-medium text-foreground">Tokenomics Structure</span>
            <div className="flex items-center gap-2">
              <Progress value={vibrancyData.tokenomics} className="w-24 h-2" />
              <span className={`font-bold ${vibrancyData.tokenomics >= 70 ? 'text-celo' : getScoreColor(vibrancyData.tokenomics)}`}>
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
          title="Distribution"
          value={100 - metrics.whaleConcentration}
          trend="neutral"
        />
      </div>

      {/* AI Insights */}
      <Card className="p-6 space-y-4 bg-card/80 border-border/50 backdrop-blur-sm">
        <h2 className="text-lg font-semibold text-foreground">AI-Generated Insights</h2>
        
        {/* Strengths */}
        {insights.strengths.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-minipay font-medium">
              <CheckCircle className="h-4 w-4" />
              <span>Key Strengths</span>
            </div>
            <div className="space-y-1">
              {insights.strengths.map((strength, index) => (
                <div key={index} className="flex items-start gap-2 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-minipay mt-2 flex-shrink-0" />
                  <span className="text-foreground">{strength}</span>
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
                  <span className="text-foreground">{concern}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Prediction */}
        <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
          <div className="font-medium mb-2 text-foreground">AI Prediction</div>
          <p className="text-sm text-muted-foreground">{insights.prediction}</p>
        </div>
      </Card>

      {/* Sources Section (if available from Gemini) */}
      {(report.vibrancyData as any).sources && (report.vibrancyData as any).sources.length > 0 && (
        <Card className="p-6 space-y-4 bg-card/80 border-border/50 backdrop-blur-sm">
          <h2 className="text-lg font-semibold text-foreground">Data Sources</h2>
          <div className="space-y-2">
            {(report.vibrancyData as any).sources.slice(0, 3).map((source: any, index: number) => (
              <a 
                key={index}
                href={source.uri}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm text-celo hover:text-celo-bright underline"
              >
                {source.title}
              </a>
            ))}
          </div>
        </Card>
      )}

      {/* Footer */}
      <div className="text-center text-xs text-muted-foreground space-y-1">
        <p>Report powered by VibeCheck AI • Last updated: {new Date(vibrancyData.lastUpdated).toLocaleDateString()}</p>
        <p>Analysis includes LSTM code modeling, Gemini AI with Google Search grounding, and NLP sentiment analysis</p>
        <p className="mt-1">This report is for informational purposes only and should not be considered financial advice.</p>
      </div>
    </div>
  );
};

export default DetailedReport;

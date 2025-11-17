import React from 'react';

// Mock token data for demonstration
export interface TokenInfo {
  symbol: string;
  name: string;
  logo?: string;
  marketCap?: string;
  price?: string;
}

export interface VibrancyData {
  overallScore: number;
  codeHealth: number;
  communityFud: number;
  tokenomics: number;
  lastUpdated: string;
}

export interface DetailedReport {
  tokenInfo: TokenInfo;
  vibrancyData: VibrancyData;
  insights: {
    strengths: string[];
    concerns: string[];
    prediction: string;
  };
  metrics: {
    developmentActivity: number;
    communityGrowth: number;
    liquidityHealth: number;
    whaleConcentration: number;
  };
}

// Mock popular tokens
export const POPULAR_TOKENS: TokenInfo[] = [
  {
    symbol: 'CELO',
    name: 'Celo',
    marketCap: '$1.2B',
    price: '$0.85'
  },
  {
    symbol: 'cUSD',
    name: 'Celo Dollar',
    marketCap: '$180M',
    price: '$1.00'
  },
  {
    symbol: 'cEUR',
    name: 'Celo Euro',
    marketCap: '$45M',
    price: '€0.99'
  },
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    marketCap: '$1.8T',
    price: '$92,150'
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    marketCap: '$420B',
    price: '$3,485'
  }
];

// Mock AI analysis service
class VibeService {
  private mockDelay = (ms: number = 2000) => 
    new Promise(resolve => setTimeout(resolve, ms));

  // Simulate LSTM model for code health
  private async getCodeHealthScore(symbol: string): Promise<number> {
    await this.mockDelay(1500);
    const baseScore = Math.random() * 40 + 50; // 50-90 range
    const symbolBoost = symbol === 'CELO' ? 15 : 
                       symbol === 'BTC' ? 20 : 
                       symbol === 'ETH' ? 18 : 0;
    return Math.min(95, Math.round(baseScore + symbolBoost));
  }

  // Simulate NLP model for community sentiment
  private async getCommunityFudIndex(symbol: string): Promise<number> {
    await this.mockDelay(1800);
    const baseFud = Math.random() * 30 + 15; // 15-45 range (lower is better)
    const symbolFactor = symbol === 'CELO' ? -10 : 
                        symbol === 'BTC' ? -15 : 
                        symbol === 'ETH' ? -12 : 5;
    return Math.max(5, Math.round(baseFud + symbolFactor));
  }

  // Simulate tokenomics analysis
  private async getTokenomicsScore(symbol: string): Promise<number> {
    await this.mockDelay(1200);
    const baseScore = Math.random() * 35 + 55; // 55-90 range
    const symbolBoost = symbol === 'CELO' ? 10 : 
                       symbol === 'cUSD' ? 25 : 
                       symbol === 'BTC' ? 15 : 0;
    return Math.min(95, Math.round(baseScore + symbolBoost));
  }

  async getVibrancyScore(symbol: string): Promise<VibrancyData> {
    const [codeHealth, communityFud, tokenomics] = await Promise.all([
      this.getCodeHealthScore(symbol),
      this.getCommunityFudIndex(symbol),
      this.getTokenomicsScore(symbol)
    ]);

    // Calculate overall score (community fud is inverted)
    const communityScore = 100 - communityFud;
    const overallScore = Math.round(
      (codeHealth * 0.4) + (communityScore * 0.35) + (tokenomics * 0.25)
    );

    return {
      overallScore,
      codeHealth,
      communityFud,
      tokenomics,
      lastUpdated: new Date().toISOString()
    };
  }

  async getDetailedReport(symbol: string): Promise<DetailedReport> {
    const vibrancyData = await this.getVibrancyScore(symbol);
    const tokenInfo = POPULAR_TOKENS.find(t => t.symbol === symbol) || {
      symbol,
      name: symbol,
      marketCap: 'Unknown',
      price: 'Unknown'
    };

    // Generate insights based on scores
    const strengths: string[] = [];
    const concerns: string[] = [];

    if (vibrancyData.codeHealth > 80) {
      strengths.push('Strong development activity and code quality');
    } else if (vibrancyData.codeHealth < 60) {
      concerns.push('Limited development activity detected');
    }

    if (vibrancyData.communityFud < 20) {
      strengths.push('Positive community sentiment and engagement');
    } else if (vibrancyData.communityFud > 40) {
      concerns.push('Elevated community concerns and FUD levels');
    }

    if (vibrancyData.tokenomics > 80) {
      strengths.push('Healthy tokenomics and distribution');
    } else if (vibrancyData.tokenomics < 60) {
      concerns.push('Tokenomics structure may pose risks');
    }

    let prediction = '';
    if (vibrancyData.overallScore > 80) {
      prediction = 'Strong long-term viability with positive growth prospects';
    } else if (vibrancyData.overallScore > 60) {
      prediction = 'Moderate viability with some areas for improvement';
    } else {
      prediction = 'Significant risks identified requiring careful monitoring';
    }

    return {
      tokenInfo,
      vibrancyData,
      insights: { strengths, concerns, prediction },
      metrics: {
        developmentActivity: Math.round(Math.random() * 40 + 60),
        communityGrowth: Math.round(Math.random() * 50 + 40),
        liquidityHealth: Math.round(Math.random() * 30 + 65),
        whaleConcentration: Math.round(Math.random() * 60 + 20)
      }
    };
  }
}

export const vibeService = new VibeService();

// Score utility functions
export const getScoreColor = (score: number): string => {
  if (score >= 85) return 'text-score-excellent';
  if (score >= 70) return 'text-score-good';
  if (score >= 55) return 'text-score-fair';
  if (score >= 40) return 'text-score-poor';
  return 'text-score-critical';
};

export const getScoreLabel = (score: number): string => {
  if (score >= 85) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 55) return 'Fair';
  if (score >= 40) return 'Poor';
  return 'Critical';
};

export const getScoreGradient = (score: number): string => {
  if (score >= 85) return 'gradient-success';
  if (score >= 70) return 'gradient-primary';
  if (score >= 55) return 'gradient-warning';
  return 'gradient-danger';
};

import { vibeService } from './vibeService';

export interface VolatilityPrediction {
  tokenSymbol: string;
  aiThreshold: number;
  summary: string;
  volatilityAssessment: string;
  prediction72h: string;
  direction: 'Bullish' | 'Bearish' | 'Neutral';
  confidence: number;
  sources: { uri: string; title: string; }[];
  timestamp: number;
}

export interface PredictionResult {
  success: boolean;
  data?: VolatilityPrediction;
  error?: string;
}

class VolatilityPredictionService {
  private baseUrl: string = process.env.REACT_APP_API_URL || 'https://api.vibecheck.app/v1';

  /**
   * Fetches real-time volatility prediction using Gemini API with Google Search grounding
   */
  async fetchVolatilityPrediction(tokenSymbol: string): Promise<PredictionResult> {
    try {
      // Check if user has access via existing vibeService
      const hasAccess = await vibeService.fetchVibrancyReport(tokenSymbol);
      if (!hasAccess) {
        throw new Error('Volatility prediction access requires VibeCheck report purchase');
      }

      return await this.fetchPredictionWithGemini(tokenSymbol);
    } catch (error) {
      console.error('Failed to fetch volatility prediction:', error);
      
      if (error.message.includes('access')) {
        throw error;
      }
      
      // Fallback to mock prediction
      console.warn('Falling back to mock volatility prediction due to API error');
      return await this.mockVolatilityPrediction(tokenSymbol);
    }
  }

  /**
   * Real Gemini API integration with structured volatility analysis
   */
  private async fetchPredictionWithGemini(tokenSymbol: string): Promise<PredictionResult> {
    const systemPrompt = "You are a senior quantitative risk analyst, specializing in short-term market volatility and price movement prediction. Your analysis must be data-driven, concise, and based on the absolute latest market data, economic news, and technical indicators available via Google Search. Do not speculate; state facts and justified predictions. Your response must be strictly formatted into three distinct, labeled sections: SUMMARY, VOLATILITY ASSESSMENT, and 72-HOUR PREDICTION.";

    const userQuery = `Provide a volatility assessment and a 72-hour price movement prediction for ${tokenSymbol}. Analyze its recent daily volume, short-term moving average trends, and any significant news events impacting the token today. Focus on factors that would cause volatility above or below 15% in the next 7 days. Conclude with a clear directional forecast (Bullish, Bearish, or Neutral) and the primary reason why.`;

    const apiKey = process.env.REACT_APP_GEMINI_API_KEY || "";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

    const payload = {
      contents: [{ parts: [{ text: userQuery }] }],
      tools: [{ "google_search": {} }],
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
    };

    const MAX_RETRIES = 5;
    let attempt = 0;
    let delay = 1000;

    while (attempt < MAX_RETRIES) {
      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          if (response.status === 429 && attempt < MAX_RETRIES - 1) {
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2;
            attempt++;
            continue;
          }
          throw new Error(`Gemini API call failed with status: ${response.status}`);
        }

        const result = await response.json();
        const candidate = result.candidates?.[0];

        if (candidate && candidate.content?.parts?.[0]?.text) {
          const analysisText = candidate.content.parts[0].text;
          let sources: { uri: string; title: string; }[] = [];
          
          const groundingMetadata = candidate.groundingMetadata;
          if (groundingMetadata && groundingMetadata.groundingAttributions) {
            sources = groundingMetadata.groundingAttributions
              .map((attribution: any) => ({
                uri: attribution.web?.uri,
                title: attribution.web?.title,
              }))
              .filter((source: any) => source.uri && source.title);
          }

          // Parse the structured response
          const parsedPrediction = this.parseGeminiResponse(tokenSymbol, analysisText, sources);
          
          return {
            success: true,
            data: parsedPrediction
          };
        } else {
          throw new Error("Invalid response structure from Gemini API");
        }
      } catch (error) {
        attempt++;
        if (attempt === MAX_RETRIES) {
          console.error("All Gemini API retries failed:", error);
          throw new Error("Failed to fetch volatility prediction after multiple retries");
        }
        if (delay === 1000) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw new Error("Unexpected error in Gemini API execution");
  }

  /**
   * Parse structured Gemini response into prediction object
   */
  private parseGeminiResponse(
    tokenSymbol: string, 
    text: string, 
    sources: { uri: string; title: string; }[]
  ): VolatilityPrediction {
    const sections = this.extractSections(text);
    const direction = this.extractDirection(text);
    const confidence = this.calculateConfidence(text);
    const aiThreshold = this.calculateThreshold(tokenSymbol, direction, confidence);

    return {
      tokenSymbol,
      aiThreshold,
      summary: sections.summary || 'AI analysis summary unavailable',
      volatilityAssessment: sections.volatilityAssessment || 'Volatility assessment unavailable',
      prediction72h: sections.prediction72h || '72-hour prediction unavailable',
      direction,
      confidence,
      sources,
      timestamp: Date.now()
    };
  }

  /**
   * Extract structured sections from Gemini response
   */
  private extractSections(text: string): {
    summary: string;
    volatilityAssessment: string;
    prediction72h: string;
  } {
    const summaryMatch = text.match(/SUMMARY[:\s]*(.*?)(?=VOLATILITY ASSESSMENT|$)/s);
    const volatilityMatch = text.match(/VOLATILITY ASSESSMENT[:\s]*(.*?)(?=72-HOUR PREDICTION|$)/s);
    const predictionMatch = text.match(/72-HOUR PREDICTION[:\s]*(.*?)$/s);

    return {
      summary: summaryMatch?.[1]?.trim() || '',
      volatilityAssessment: volatilityMatch?.[1]?.trim() || '',
      prediction72h: predictionMatch?.[1]?.trim() || ''
    };
  }

  /**
   * Extract directional forecast from text
   */
  private extractDirection(text: string): 'Bullish' | 'Bearish' | 'Neutral' {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('bullish')) return 'Bullish';
    if (lowerText.includes('bearish')) return 'Bearish';
    
    // Analyze sentiment words
    const bullishWords = ['positive', 'upward', 'rising', 'increase', 'growth', 'strong'];
    const bearishWords = ['negative', 'downward', 'falling', 'decrease', 'decline', 'weak'];
    
    const bullishCount = bullishWords.reduce((count, word) => 
      count + (lowerText.match(new RegExp(word, 'g'))?.length || 0), 0);
    const bearishCount = bearishWords.reduce((count, word) => 
      count + (lowerText.match(new RegExp(word, 'g'))?.length || 0), 0);
    
    if (bullishCount > bearishCount) return 'Bullish';
    if (bearishCount > bullishCount) return 'Bearish';
    
    return 'Neutral';
  }

  /**
   * Calculate confidence score based on text analysis
   */
  private calculateConfidence(text: string): number {
    const confidenceWords = ['certain', 'confident', 'strong', 'clear', 'definite'];
    const uncertainWords = ['uncertain', 'unclear', 'mixed', 'volatile', 'unpredictable'];
    
    const lowerText = text.toLowerCase();
    const confidenceCount = confidenceWords.reduce((count, word) => 
      count + (lowerText.match(new RegExp(word, 'g'))?.length || 0), 0);
    const uncertainCount = uncertainWords.reduce((count, word) => 
      count + (lowerText.match(new RegExp(word, 'g'))?.length || 0), 0);
    
    const baseConfidence = 60;
    const adjustment = (confidenceCount - uncertainCount) * 10;
    
    return Math.max(30, Math.min(95, baseConfidence + adjustment));
  }

  /**
   * Calculate volatility threshold based on AI analysis
   */
  private calculateThreshold(tokenSymbol: string, direction: string, confidence: number): number {
    // Base threshold varies by token type
    let baseThreshold = 15; // Default 15% for most tokens
    
    if (tokenSymbol.includes('USD') || tokenSymbol.includes('USDC') || tokenSymbol.includes('USDT')) {
      baseThreshold = 5; // Stablecoins have lower volatility
    } else if (['BTC', 'ETH', 'CELO'].includes(tokenSymbol)) {
      baseThreshold = 12; // Major tokens
    } else {
      baseThreshold = 18; // Altcoins typically more volatile
    }
    
    // Adjust based on confidence
    const confidenceAdjustment = (confidence - 60) * 0.1;
    
    return Math.round((baseThreshold + confidenceAdjustment) * 10) / 10;
  }

  /**
   * Mock volatility prediction for development/fallback
   */
  private async mockVolatilityPrediction(tokenSymbol: string): Promise<PredictionResult> {
    await new Promise(resolve => setTimeout(resolve, 2000));

    const mockDirections: ('Bullish' | 'Bearish' | 'Neutral')[] = ['Bullish', 'Bearish', 'Neutral'];
    const direction = mockDirections[Math.floor(Math.random() * mockDirections.length)];
    const confidence = Math.floor(Math.random() * 40) + 55; // 55-95%
    
    const mockPrediction: VolatilityPrediction = {
      tokenSymbol,
      aiThreshold: this.calculateThreshold(tokenSymbol, direction, confidence),
      summary: `Recent analysis of ${tokenSymbol} shows ${direction.toLowerCase()} momentum with moderate trading volume and stable technical indicators.`,
      volatilityAssessment: `Based on 7-day moving averages and recent market activity, ${tokenSymbol} exhibits ${direction.toLowerCase()} sentiment with expected volatility around ${this.calculateThreshold(tokenSymbol, direction, confidence)}%.`,
      prediction72h: `72-hour forecast indicates ${direction.toLowerCase()} pressure with ${confidence}% confidence based on current market conditions and technical analysis.`,
      direction,
      confidence,
      sources: [
        { uri: 'https://mock-source.com', title: `${tokenSymbol} Market Analysis` }
      ],
      timestamp: Date.now()
    };

    return {
      success: true,
      data: mockPrediction
    };
  }
}

export const volatilityPredictionService = new VolatilityPredictionService();

import React from 'react';

// Mock payment service for cUSD transactions in MiniPay
export interface PaymentResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
}

export interface WatchlistItem {
  symbol: string;
  name: string;
  addedAt: string;
}

class PaymentService {
  private mockDelay = (ms: number = 3000) => 
    new Promise(resolve => setTimeout(resolve, ms));

  // Mock cUSD payment for reports (1 cUSD)
  async purchaseReport(tokenSymbol: string): Promise<PaymentResult> {
    try {
      await this.mockDelay(2500);
      
      // Simulate 90% success rate
      if (Math.random() > 0.1) {
        const txHash = `0x${Math.random().toString(16).substr(2, 40)}`;
        
        // Store purchased report
        const purchased = JSON.parse(localStorage.getItem('purchasedReports') || '[]');
        purchased.push({
          symbol: tokenSymbol,
          purchasedAt: new Date().toISOString(),
          transactionHash: txHash
        });
        localStorage.setItem('purchasedReports', JSON.stringify(purchased));

        return {
          success: true,
          transactionHash: txHash
        };
      } else {
        return {
          success: false,
          error: 'Transaction failed. Please try again.'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: 'Payment service unavailable. Please try again later.'
      };
    }
  }

  // Mock premium watchlist purchase (3 cUSD)
  async purchasePremiumWatchlist(): Promise<PaymentResult> {
    try {
      await this.mockDelay(3000);
      
      if (Math.random() > 0.1) {
        const txHash = `0x${Math.random().toString(16).substr(2, 40)}`;
        
        // Enable premium watchlist
        localStorage.setItem('premiumWatchlist', JSON.stringify({
          active: true,
          purchasedAt: new Date().toISOString(),
          transactionHash: txHash,
          maxTokens: 5
        }));

        return {
          success: true,
          transactionHash: txHash
        };
      } else {
        return {
          success: false,
          error: 'Transaction failed. Please try again.'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: 'Payment service unavailable. Please try again later.'
      };
    }
  }

  // Check if user has purchased a specific report
  hasAccessToReport(tokenSymbol: string): boolean {
    const purchased = JSON.parse(localStorage.getItem('purchasedReports') || '[]');
    return purchased.some((report: any) => report.symbol === tokenSymbol);
  }

  // Check if user has premium watchlist access
  hasPremiumWatchlist(): boolean {
    const premium = JSON.parse(localStorage.getItem('premiumWatchlist') || 'null');
    return premium && premium.active;
  }

  // Watchlist management
  getWatchlist(): WatchlistItem[] {
    return JSON.parse(localStorage.getItem('watchlist') || '[]');
  }

  addToWatchlist(tokenSymbol: string, tokenName: string): boolean {
    const watchlist = this.getWatchlist();
    const isPremium = this.hasPremiumWatchlist();
    
    if (!isPremium && watchlist.length >= 2) {
      return false; // Free users limited to 2 tokens
    }
    
    if (isPremium && watchlist.length >= 5) {
      return false; // Premium users limited to 5 tokens
    }

    if (watchlist.some(item => item.symbol === tokenSymbol)) {
      return false; // Already in watchlist
    }

    watchlist.push({
      symbol: tokenSymbol,
      name: tokenName,
      addedAt: new Date().toISOString()
    });

    localStorage.setItem('watchlist', JSON.stringify(watchlist));
    return true;
  }

  removeFromWatchlist(tokenSymbol: string): void {
    const watchlist = this.getWatchlist();
    const filtered = watchlist.filter(item => item.symbol !== tokenSymbol);
    localStorage.setItem('watchlist', JSON.stringify(filtered));
  }
}

export const paymentService = new PaymentService();

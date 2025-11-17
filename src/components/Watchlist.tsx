import React, { useState, useEffect } from 'react';
import { Star, Plus, Trash2, Crown, Zap } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import VibrancyScore from './VibrancyScore';
import PaymentModal from './PaymentModal';
import { paymentService, type WatchlistItem } from '@/lib/paymentService';
import { vibeService, type VibrancyData, type TokenInfo } from '@/lib/vibeService';

interface WatchlistProps {
  onTokenSelect: (token: TokenInfo) => void;
}

const Watchlist: React.FC<WatchlistProps> = ({ onTokenSelect }) => {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [scores, setScores] = useState<Record<string, VibrancyData>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [isPremium, setIsPremium] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
    loadWatchlist();
    checkPremiumStatus();
  }, []);

  const loadWatchlist = () => {
    const items = paymentService.getWatchlist();
    setWatchlist(items);
    
    // Load scores for each token
    items.forEach(item => loadScore(item.symbol));
  };

  const checkPremiumStatus = () => {
    setIsPremium(paymentService.hasPremiumWatchlist());
  };

  const loadScore = async (symbol: string) => {
    if (scores[symbol]) return; // Already loaded

    setLoading(prev => ({ ...prev, [symbol]: true }));
    try {
      const score = await vibeService.getVibrancyScore(symbol);
      setScores(prev => ({ ...prev, [symbol]: score }));
    } catch (error) {
      console.error(`Failed to load score for ${symbol}:`, error);
    } finally {
      setLoading(prev => ({ ...prev, [symbol]: false }));
    }
  };

  const removeFromWatchlist = (symbol: string) => {
    paymentService.removeFromWatchlist(symbol);
    loadWatchlist();
    setScores(prev => {
      const newScores = { ...prev };
      delete newScores[symbol];
      return newScores;
    });
  };

  const handleUpgradeSuccess = () => {
    checkPremiumStatus();
    setShowUpgradeModal(false);
  };

  const maxTokens = isPremium ? 5 : 2;
  const remainingSlots = maxTokens - watchlist.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold">Watchlist</h2>
          {isPremium && <Crown className="h-4 w-4 text-accent" />}
        </div>
        <Badge variant={isPremium ? "default" : "secondary"}>
          {watchlist.length}/{maxTokens}
        </Badge>
      </div>

      {/* Upgrade Banner */}
      {!isPremium && (
        <Card className="p-4 gradient-secondary border-secondary/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Crown className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="font-semibold text-white">Upgrade to Premium</div>
                <div className="text-sm text-white/80">Track up to 5 tokens with real-time updates</div>
              </div>
            </div>
            <Button
              onClick={() => setShowUpgradeModal(true)}
              size="sm"
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              <Zap className="h-4 w-4 mr-1" />
              3 cUSD
            </Button>
          </div>
        </Card>
      )}

      {/* Watchlist Items */}
      {watchlist.length > 0 ? (
        <div className="grid gap-4">
          {watchlist.map((item) => {
            const score = scores[item.symbol];
            const isLoading = loading[item.symbol];

            return (
              <Card 
                key={item.symbol} 
                className="p-4 hover:shadow-soft transition-smooth cursor-pointer border-border/50 hover:border-primary/30"
                onClick={() => onTokenSelect({ 
                  symbol: item.symbol, 
                  name: item.name 
                })}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        {item.symbol.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <div className="font-semibold">{item.symbol}</div>
                      <div className="text-sm text-muted-foreground">{item.name}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {isLoading ? (
                      <div className="w-16 h-16 rounded-full bg-muted animate-pulse" />
                    ) : score ? (
                      <VibrancyScore score={score.overallScore} size="sm" showLabel={false} />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
                        <span className="text-xs text-muted-foreground">N/A</span>
                      </div>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromWatchlist(item.symbol);
                      }}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <Star className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold mb-2">Your watchlist is empty</h3>
          <p className="text-sm text-muted-foreground">
            Add tokens to track their Vibrancy Scores
          </p>
        </Card>
      )}

      {/* Available Slots */}
      {remainingSlots > 0 && (
        <div className="text-center text-sm text-muted-foreground">
          {remainingSlots} slot{remainingSlots !== 1 ? 's' : ''} remaining
        </div>
      )}

      {/* Upgrade Modal */}
      <PaymentModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onSuccess={handleUpgradeSuccess}
        type="watchlist"
      />
    </div>
  );
};

export default Watchlist;

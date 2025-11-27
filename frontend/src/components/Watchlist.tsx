import React, { useState, useEffect } from 'react';
import { Star, Plus, Trash2, Crown, Zap, User } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import VibrancyScore from './VibrancyScore';
import PaymentModal from './PaymentModal';
import { paymentService, type WatchlistItem } from '@/lib/paymentService';
import { vibeService, type VibrancyData, type TokenInfo } from '@/lib/vibeService';
import { firebaseService } from '@/lib/firebaseService';

interface WatchlistProps {
  onTokenSelect: (token: TokenInfo) => void;
}

const Watchlist: React.FC<WatchlistProps> = ({ onTokenSelect }) => {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [scores, setScores] = useState<Record<string, VibrancyData>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [isPremium, setIsPremium] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [unsubscribe, setUnsubscribe] = useState<(() => void) | null>(null);

  useEffect(() => {
    // Load watchlist immediately (works with localStorage fallback)
    loadWatchlist();
    checkPremiumStatus();
    
    // Set up Firebase auth listener
    firebaseService.onAuthChange((newUserId) => {
      setUserId(newUserId);
      // Reload watchlist when auth state changes
      loadWatchlist();
      checkPremiumStatus();
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const loadWatchlist = () => {
    if (unsubscribe) {
      unsubscribe();
    }

    // Set up real-time subscription
    const unsub = paymentService.subscribeToWatchlist((items) => {
      setWatchlist(items);
      
      // Load scores for new tokens
      items.forEach(item => {
        if (!scores[item.tokenId]) {
          loadScore(item.tokenId);
        }
      });
    });
    
    setUnsubscribe(() => unsub);
  };

  const checkPremiumStatus = async () => {
    const premium = await paymentService.hasPremiumWatchlist();
    setIsPremium(premium);
  };

  const loadScore = async (tokenId: string) => {
    if (scores[tokenId] || loading[tokenId]) return;

    setLoading(prev => ({ ...prev, [tokenId]: true }));
    try {
      const score = await vibeService.getVibrancyScore(tokenId);
      setScores(prev => ({ ...prev, [tokenId]: score }));
    } catch (error) {
      console.error(`Failed to load score for ${tokenId}:`, error);
    } finally {
      setLoading(prev => ({ ...prev, [tokenId]: false }));
    }
  };

  const removeFromWatchlist = async (tokenId: string) => {
    await paymentService.removeFromWatchlist(tokenId);
    setScores(prev => {
      const newScores = { ...prev };
      delete newScores[tokenId];
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
      {/* Header with User ID */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-celo" />
            <h2 className="text-xl font-bold text-foreground">Watchlist</h2>
            {isPremium && <Crown className="h-4 w-4 text-celo animate-glow" />}
          </div>
          <Badge variant="outline" className="border-celo/30 text-celo">
            {watchlist.length}/{maxTokens}
          </Badge>
        </div>

        {/* User ID Display */}
        {userId && (
          <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 rounded-lg border border-border/50">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">User:</span>
            <code className="text-xs text-celo font-mono">
              {userId.substring(0, 8)}...{userId.substring(-4)}
            </code>
          </div>
        )}
      </div>

      {/* Upgrade Banner */}
      {!isPremium && (
        <Card className="p-4 gradient-fusion border-celo/30 shadow-celo">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-black/20 rounded-lg">
                <Crown className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <div className="font-semibold text-primary-foreground">Upgrade to Premium</div>
                <div className="text-sm text-primary-foreground/80">Track up to 5 tokens with real-time updates</div>
              </div>
            </div>
            <Button
              onClick={() => setShowUpgradeModal(true)}
              size="sm"
              className="bg-black/20 hover:bg-black/30 text-primary-foreground border border-primary-foreground/30 shadow-none"
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
            const score = scores[item.tokenId];
            const isLoading = loading[item.tokenId];

            return (
              <Card 
                key={item.tokenId} 
                className="p-4 hover:shadow-celo transition-all duration-300 cursor-pointer border-border/50 hover:border-celo/30 bg-card/80 backdrop-blur-sm"
                onClick={() => onTokenSelect({ 
                  symbol: item.tokenId, 
                  name: item.name 
                })}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full gradient-celo flex items-center justify-center shadow-celo">
                      <span className="text-primary-foreground font-bold text-sm">
                        {item.tokenId.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">{item.tokenId}</div>
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
                        removeFromWatchlist(item.tokenId);
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
        <Card className="p-8 text-center bg-card/50">
          <Star className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold mb-2 text-foreground">Your watchlist is empty</h3>
          <p className="text-sm text-muted-foreground">
            Add tokens to track their Vibrancy Scores in real-time
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

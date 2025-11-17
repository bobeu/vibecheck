import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Zap, Star, Search, ArrowLeft, Eye, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';

import TokenSearch from '@/components/TokenSearch';
import VibrancyScore from '@/components/VibrancyScore';
import PaymentModal from '@/components/PaymentModal';
import DetailedReport from '@/components/DetailedReport';
import Watchlist from '@/components/Watchlist';

import { vibeService, type TokenInfo, type VibrancyData, type DetailedReport as ReportType } from '@/lib/vibeService';
import { paymentService } from '@/lib/paymentService';

const Home = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('search');
  const [selectedToken, setSelectedToken] = useState<TokenInfo | null>(null);
  const [quickScore, setQuickScore] = useState<VibrancyData | null>(null);
  const [detailedReport, setDetailedReport] = useState<ReportType | null>(null);
  const [isLoadingScore, setIsLoadingScore] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [watchlist, setWatchlist] = useState<string[]>([]);

  useEffect(() => {
    loadWatchlist();
  }, []);

  const loadWatchlist = () => {
    const items = paymentService.getWatchlist();
    setWatchlist(items.map(item => item.symbol));
  };

  const handleTokenSelect = async (token: TokenInfo) => {
    setSelectedToken(token);
    setQuickScore(null);
    setDetailedReport(null);
    setIsLoadingScore(true);

    try {
      // Load quick score first
      const score = await vibeService.getVibrancyScore(token.symbol);
      setQuickScore(score);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load Vibrancy Score. Please try again."
      });
    } finally {
      setIsLoadingScore(false);
    }
  };

  const handleUnlockReport = () => {
    if (!selectedToken) return;
    
    // Check if user already has access
    if (paymentService.hasAccessToReport(selectedToken.symbol)) {
      loadDetailedReport();
    } else {
      setShowPaymentModal(true);
    }
  };

  const handlePaymentSuccess = (txHash: string) => {
    toast({
      title: "Payment Successful!",
      description: `Transaction: ${txHash.substring(0, 16)}...`
    });
    loadDetailedReport();
  };

  const loadDetailedReport = async () => {
    if (!selectedToken) return;

    setIsLoadingScore(true);
    try {
      const report = await vibeService.getDetailedReport(selectedToken.symbol);
      setDetailedReport(report);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load detailed report. Please try again."
      });
    } finally {
      setIsLoadingScore(false);
    }
  };

  const handleAddToWatchlist = () => {
    if (!selectedToken) return;

    const success = paymentService.addToWatchlist(selectedToken.symbol, selectedToken.name);
    
    if (success) {
      loadWatchlist();
      toast({
        title: "Added to Watchlist",
        description: `${selectedToken.symbol} has been added to your watchlist`
      });
    } else {
      const isPremium = paymentService.hasPremiumWatchlist();
      const maxTokens = isPremium ? 5 : 2;
      
      if (watchlist.includes(selectedToken.symbol)) {
        toast({
          title: "Already in Watchlist",
          description: `${selectedToken.symbol} is already in your watchlist`
        });
      } else {
        toast({
          title: "Watchlist Full",
          description: `You can track up to ${maxTokens} tokens. ${isPremium ? 'Remove a token to add this one.' : 'Upgrade to Premium to track more tokens.'}`
        });
      }
    }
  };

  const resetView = () => {
    setSelectedToken(null);
    setQuickScore(null);
    setDetailedReport(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-secondary/10">
      <div className="container max-w-md mx-auto px-4 py-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="p-2 gradient-primary rounded-xl">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold">VibeCheck</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            AI-Powered Crypto Project Viability
          </p>
        </div>

        {/* Main Content */}
        {!selectedToken ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="search">
                <Search className="h-4 w-4 mr-2" />
                Search
              </TabsTrigger>
              <TabsTrigger value="watchlist">
                <Star className="h-4 w-4 mr-2" />
                Watchlist
              </TabsTrigger>
            </TabsList>

            <TabsContent value="search" className="space-y-6 mt-6">
              <TokenSearch onTokenSelect={handleTokenSelect} watchlist={watchlist} />
            </TabsContent>

            <TabsContent value="watchlist" className="space-y-6 mt-6">
              <Watchlist onTokenSelect={handleTokenSelect} />
            </TabsContent>
          </Tabs>
        ) : (
          <div className="space-y-6">
            {/* Back Button */}
            <Button 
              variant="ghost" 
              onClick={resetView}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Search
            </Button>

            {/* Show Detailed Report or Quick Analysis */}
            {detailedReport ? (
              <DetailedReport report={detailedReport} />
            ) : (
              <div className="space-y-6">
                {/* Token Header */}
                <Card className="p-6 text-center">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center">
                      <span className="text-white font-bold">{selectedToken.symbol.charAt(0)}</span>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">{selectedToken.symbol}</h2>
                      <p className="text-muted-foreground">{selectedToken.name}</p>
                    </div>
                  </div>

                  {/* Quick Score */}
                  {isLoadingScore ? (
                    <div className="flex justify-center">
                      <div className="w-24 h-24 rounded-full bg-muted animate-pulse" />
                    </div>
                  ) : quickScore ? (
                    <div className="flex justify-center">
                      <VibrancyScore 
                        score={quickScore.overallScore} 
                        size="lg" 
                        animated 
                      />
                    </div>
                  ) : null}
                </Card>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Button
                    onClick={handleUnlockReport}
                    disabled={isLoadingScore || !quickScore}
                    className="w-full h-12 text-base font-semibold gradient-primary hover:opacity-90"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    {paymentService.hasAccessToReport(selectedToken.symbol) 
                      ? 'View Full Report' 
                      : 'Unlock Full Report (1 cUSD)'}
                  </Button>

                  <Button
                    onClick={handleAddToWatchlist}
                    variant="outline"
                    className="w-full"
                    disabled={watchlist.includes(selectedToken.symbol)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {watchlist.includes(selectedToken.symbol) 
                      ? 'Already in Watchlist' 
                      : 'Add to Watchlist'}
                  </Button>
                </div>

                {/* Quick Insights Preview */}
                {quickScore && (
                  <Card className="p-4">
                    <div className="text-center text-sm text-muted-foreground">
                      <p>Unlock the full report to see:</p>
                      <div className="flex flex-wrap justify-center gap-2 mt-2">
                        <Badge variant="secondary">Detailed Analysis</Badge>
                        <Badge variant="secondary">AI Insights</Badge>
                        <Badge variant="secondary">Risk Assessment</Badge>
                        <Badge variant="secondary">Predictions</Badge>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            )}
          </div>
        )}

        {/* Payment Modal */}
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={handlePaymentSuccess}
          type="report"
          tokenSymbol={selectedToken?.symbol}
        />
      </div>
    </div>
  );
};

const App = () => {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
      <Toaster />
    </>
  );
};

export default App;

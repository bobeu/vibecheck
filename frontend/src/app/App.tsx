import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Star, Search, ArrowLeft, Eye, Plus, Settings, HelpCircle } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';
import WalletConnect from '@/components/WalletConnect';
import TokenSearch from '@/components/TokenSearch';
import VibrancyScore from '@/components/VibrancyScore';
import VolatilityVanguard from '@/components/VolatilityVanguard';
import PaymentModal from '@/components/PaymentModal';
import DetailedReport from '@/components/DetailedReport';
import Watchlist from '@/components/Watchlist';
import AdminPanel from '@/components/AdminPanel';
import Onboarding from '@/components/Onboarding';
import { vibeService, type TokenInfo, type VibrancyData, type DetailedReport as ReportType } from '@/lib/vibeService';
import { paymentService } from '@/lib/paymentService';
import { isMiniPay, isFarcaster, isExternalWallet } from '@/lib/wagmi';

const Home = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('search');
  const [selectedToken, setSelectedToken] = useState<TokenInfo | null>(null);
  const [quickScore, setQuickScore] = useState<VibrancyData | null>(null);
  const [detailedReport, setDetailedReport] = useState<ReportType | null>(null);
  const [isLoadingScore, setIsLoadingScore] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [hasReportAccess, setHasReportAccess] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Check if user has seen onboarding before
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('vibecheck-onboarding-seen');
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
    }
  }, []);

  const handleContinueFromOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem('vibecheck-onboarding-seen', 'true');
  };

  useEffect(() => {
    loadWatchlist();
  }, []);

  useEffect(() => {
    if (selectedToken) {
      checkReportAccess();
    }
  }, [selectedToken]);

  const loadWatchlist = async () => {
    const items = await paymentService.getWatchlist();
    setWatchlist(items.map(item => item.tokenId));
  };

  const checkReportAccess = async () => {
    if (!selectedToken) return;
    const access = await paymentService.hasAccessToReport(selectedToken.symbol);
    setHasReportAccess(access);
  };

  const handleTokenSelect = async (token: TokenInfo) => {
    setSelectedToken(token);
    setQuickScore(null);
    setDetailedReport(null);
    setIsLoadingScore(true);

    try {
      // Load quick score first using production-ready function
      const score = await vibeService.fetchVibrancyReport(token.symbol);
      setQuickScore(score);
    } catch (error:any) {
      // Handle access denied errors differently
      if (error.message?.includes('access denied')) {
        toast({
          title: "Report Locked",
          description: "Purchase required to access this token's analysis"
        });
        return;
      }
      
      toast({
        title: "Analysis Failed",
        description: "Unable to analyze token. Please try again."
      });
    } finally {
      setIsLoadingScore(false);
    }
  };

  const handleUnlockReport = async () => {
    if (!selectedToken) return;
    
    if (hasReportAccess) {
      await loadDetailedReport();
    } else {
      setShowPaymentModal(true);
    }
  };

  const handlePaymentSuccess = async (txHash: string) => {
    toast({
      title: "Payment Successful!",
      description: `TX: ${txHash.substring(0, 16)}...`
    });
    setHasReportAccess(true);
    await loadDetailedReport();
  };

  const loadDetailedReport = async () => {
    if (!selectedToken) return;

    setIsLoadingScore(true);
    try {
      const report = await vibeService.getDetailedReport(selectedToken.symbol);
      setDetailedReport(report);
    } catch (error) {
      toast({
        title: "Report Failed",
        description: "Unable to generate detailed report. Please try again."
      });
    } finally {
      setIsLoadingScore(false);
    }
  };

  const handleAddToWatchlist = async () => {
    if (!selectedToken) return;

    const success = await paymentService.addToWatchlist(selectedToken.symbol, selectedToken.name);
    
    if (success) {
      await loadWatchlist();
      toast({
        title: "Added to Watchlist",
        description: `${selectedToken.symbol} is now being tracked`
      });
    } else {
      const isPremium = await paymentService.hasPremiumWatchlist();
      const maxTokens = isPremium ? 5 : 2;
      
      if (watchlist.includes(selectedToken.symbol)) {
        toast({
          title: "Already Tracked",
          description: `${selectedToken.symbol} is already in your watchlist`
        });
      } else {
        toast({
          title: "Watchlist Full",
          description: `Maximum ${maxTokens} tokens. ${isPremium ? 'Remove a token first.' : 'Upgrade to Premium for 5 slots.'}`
        });
      }
    }
  };

  const resetView = () => {
    setSelectedToken(null);
    setQuickScore(null);
    setDetailedReport(null);
    setHasReportAccess(false);
  };

  // Show onboarding if enabled
  if (showOnboarding) {
    return <Onboarding onContinue={handleContinueFromOnboarding} />;
  }

  return (
    <div className="min-h-screen gradient-bg">
      {/* Floating Help Button */}
      <Button
        onClick={() => setShowOnboarding(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full shadow-lg bg-celo hover:bg-celo/90 text-primary-foreground animate-bounce"
        size="icon"
        aria-label="Show onboarding"
      >
        <HelpCircle className="w-6 h-6" />
      </Button>

      <div className="container max-w-md mx-auto px-4 py-6">
        {/* Header */}
        <div className="text-start mb-8">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="VibeCheck Logo"
                width={60}
                height={60}
                className="rounded-full"
                priority
              />
            </div>
            <div className="flex items-center">
              <WalletConnect />
            </div>
          </div>
          <div className="mt-3 px-2">
            <p className="text-center text-xs sm:text-sm font-medium leading-relaxed">
              <span className="text-foreground/90">AI-Powered Crypto Project Viability</span>
              <span className="mx-2 text-celo/60">•</span>
              <span className="text-celo font-semibold">
                {isMiniPay() ? 'Celo MiniPay' : isFarcaster() ? 'Celo Farcaster' : isExternalWallet() ? 'Celo MetaMask' : 'Celo MiniPay'}
              </span>
            </p>
          </div>
        </div>

        {/* Main Content */}
        {showAdminPanel ? (
          <div className="w-full space-y-4">
            <AdminPanel onBack={() => setShowAdminPanel(false)} />
          </div>
        ) : !selectedToken ? (
          <div className="w-full space-y-4">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => setShowAdminPanel(true)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Admin Panel
            </Button>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-muted/30">
              <TabsTrigger value="search" className="data-[state=active]:bg-celo data-[state=active]:text-primary-foreground">
                <Search className="h-4 w-4 mr-2" />
                Search
              </TabsTrigger>
              <TabsTrigger value="watchlist" className="data-[state=active]:bg-celo data-[state=active]:text-primary-foreground">
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
          </div>
        ) : (
          <div className="space-y-6">
            {/* Back Button */}
            <Button 
              {...({ variant: "ghost" } as any)}
              onClick={resetView}
              className="mb-4 text-muted-foreground hover:text-celo"
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
                <Card className="p-6 text-center bg-card/80 border-border/50 backdrop-blur-sm">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full gradient-celo flex items-center justify-center shadow-celo">
                      <span className="text-primary-foreground font-bold">{selectedToken.symbol.charAt(0)}</span>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-foreground">{selectedToken.symbol}</h2>
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
                    disabled={isLoadingScore}
                    className="w-full h-12 text-base font-semibold gradient-celo hover:opacity-90 shadow-celo transition-all duration-300"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    {hasReportAccess 
                      ? 'View Full Analysis' 
                      : 'Unlock AI Report (1 cUSD)'}
                  </Button>

                  <Button
                    onClick={handleAddToWatchlist}
                    {...({ variant: "outline" } as any)}
                    className="w-full border-celo/30 text-celo hover:bg-celo/10"
                    disabled={watchlist.includes(selectedToken.symbol)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {watchlist.includes(selectedToken.symbol) 
                      ? 'Already Tracked' 
                      : 'Add to Watchlist'}
                  </Button>
                </div>

                {/* Volatility Vanguard Game */}
                <VolatilityVanguard
                  tokenSymbol={selectedToken.symbol}
                  tokenAddress={selectedToken.symbol === 'CELO' ? '0x471EcE3750Da237f93B8E339c536989b8978a438' : '0x0000000000000000000000000000000000000000'}
                  vibrancyScore={quickScore?.overallScore || 0}
                  isVisible={!!quickScore}
                />

                {/* Quick Insights Preview */}
                {quickScore && (
                  <Card className="p-4 bg-muted/20 border-border/50">
                    <div className="text-center text-sm text-muted-foreground">
                      <p>Unlock complete AI analysis to see:</p>
                      <div className="flex flex-wrap justify-center gap-2 mt-2">
                        <Badge {...({ variant: "outline" } as any)} className="border-celo/30 text-celo">LSTM Code Analysis</Badge>
                        <Badge {...({ variant: "outline" } as any)} className="border-minipay/30 text-minipay">NLP Sentiment</Badge>
                        <Badge {...({ variant: "outline" } as any)} className="border-accent-orange/30 text-accent-orange">Risk Assessment</Badge>
                        <Badge {...({ variant: "outline" } as any)} className="border-muted-foreground/30">AI Predictions</Badge>
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
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
      <Toaster />
    </>
  );
};

export default App;
export { Home };

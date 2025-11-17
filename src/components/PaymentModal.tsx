import React, { useState } from 'react';
import { CreditCard, Loader2, CheckCircle, AlertCircle, X, Zap } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { paymentService, type PaymentResult } from '@/lib/paymentService';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (txHash: string) => void;
  type: 'report' | 'watchlist';
  tokenSymbol?: string;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  type,
  tokenSymbol = ''
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<PaymentResult | null>(null);

  const amount = type === 'report' ? '1' : '3';
  const title = type === 'report' 
    ? `Unlock ${tokenSymbol} Analysis` 
    : 'Upgrade to Premium';
  
  const description = type === 'report'
    ? 'Get complete AI analysis with predictions and insights'
    : 'Track up to 5 tokens with real-time Vibrancy updates';

  const handlePayment = async () => {
    setIsProcessing(true);
    setResult(null);

    try {
      let paymentResult: PaymentResult;
      
      if (type === 'report') {
        paymentResult = await paymentService.purchaseReport(tokenSymbol);
      } else {
        paymentResult = await paymentService.purchasePremiumWatchlist();
      }

      setResult(paymentResult);
      
      if (paymentResult.success && paymentResult.transactionHash) {
        setTimeout(() => {
          onSuccess(paymentResult.transactionHash!);
          onClose();
        }, 2000);
      }
    } catch (error) {
      setResult({
        success: false,
        error: 'Payment failed. Please try again.'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const resetAndClose = () => {
    setResult(null);
    setIsProcessing(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={resetAndClose}>
      <DialogContent className="sm:max-w-md border-border/50 bg-card">
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={resetAndClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-6 pb-4">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-16 h-16 mx-auto gradient-celo rounded-full flex items-center justify-center mb-4 shadow-celo">
              {type === 'report' ? (
                <CreditCard className="h-8 w-8 text-primary-foreground" />
              ) : (
                <Zap className="h-8 w-8 text-primary-foreground" />
              )}
            </div>
            <h2 className="text-xl font-bold text-foreground">{title}</h2>
            <p className="text-muted-foreground">{description}</p>
          </div>

          {/* Pricing */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3 border border-border/50">
            <div className="flex justify-between items-center">
              <span className="font-medium text-foreground">Price</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-celo glow-text">{amount}</span>
                <span className="text-minipay font-semibold">cUSD</span>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              Payment processed through MiniPay • Secure cUSD transaction
            </div>
          </div>

          {/* Payment Status */}
          {result && (
            <div className={`p-4 rounded-lg flex items-center gap-3 border ${
              result.success 
                ? 'bg-minipay/10 border-minipay/30' 
                : 'bg-destructive/10 border-destructive/20'
            }`}>
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-minipay flex-shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
              )}
              <div className="flex-1">
                <div className={`font-medium ${
                  result.success ? 'text-minipay' : 'text-destructive'
                }`}>
                  {result.success ? 'Payment Successful!' : 'Payment Failed'}
                </div>
                {result.success && result.transactionHash && (
                  <div className="text-xs text-muted-foreground mt-1 font-mono">
                    TX: {result.transactionHash.substring(0, 16)}...
                  </div>
                )}
                {result.error && (
                  <div className="text-sm text-destructive mt-1">
                    {result.error}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Button */}
          {!result?.success && (
            <Button
              onClick={handlePayment}
              disabled={isProcessing}
              className="w-full h-12 text-base font-semibold gradient-celo hover:opacity-90 shadow-celo transition-all duration-300"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing Payment...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Pay {amount} cUSD
                </>
              )}
            </Button>
          )}

          {result?.error && (
            <Button
              onClick={handlePayment}
              variant="outline"
              className="w-full border-celo/30 text-celo hover:bg-celo/10"
            >
              Try Again
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;

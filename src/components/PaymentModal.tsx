import React, { useState } from 'react';
import { CreditCard, Loader2, CheckCircle, AlertCircle, X } from 'lucide-react';
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
    ? `Unlock Full ${tokenSymbol} Report` 
    : 'Upgrade to Premium Watchlist';
  
  const description = type === 'report'
    ? 'Get detailed AI analysis, insights, and predictions'
    : 'Track up to 5 tokens with real-time updates';

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
      <DialogContent className="sm:max-w-md">
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={resetAndClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-6 pb-4">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-16 h-16 mx-auto gradient-primary rounded-full flex items-center justify-center mb-4">
              <CreditCard className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-xl font-bold">{title}</h2>
            <p className="text-muted-foreground">{description}</p>
          </div>

          {/* Pricing */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-medium">Price</span>
              <span className="text-xl font-bold text-primary">{amount} cUSD</span>
            </div>
            <div className="text-xs text-muted-foreground">
              Payment will be processed through MiniPay using your connected wallet
            </div>
          </div>

          {/* Payment Status */}
          {result && (
            <div className={`p-4 rounded-lg flex items-center gap-3 ${
              result.success ? 'bg-accent-green/10 border border-accent-green/20' : 'bg-destructive/10 border border-destructive/20'
            }`}>
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-accent-green flex-shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
              )}
              <div className="flex-1">
                <div className={`font-medium ${result.success ? 'text-accent-green' : 'text-destructive'}`}>
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
              className="w-full h-12 text-base font-semibold gradient-primary hover:opacity-90"
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
              className="w-full"
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

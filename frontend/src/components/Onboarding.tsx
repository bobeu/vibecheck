'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  TrendingUp, 
  Gamepad2, 
  Users, 
  Trophy, 
  Wallet, 
  ArrowRight,
  Sparkles,
  Target,
  Coins,
  CheckCircle2
} from 'lucide-react';
import Image from 'next/image';

interface OnboardingProps {
  onContinue: () => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onContinue }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [logoRotation, setLogoRotation] = useState(0);

  // Rotate logo every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setLogoRotation(prev => prev + 360);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const steps = [
    {
      title: "Welcome to VibeCheck",
      icon: <Sparkles className="w-8 h-8" />,
      content: (
        <div className="space-y-4">
          <p className="text-lg text-muted-foreground">
            VibeCheck is an AI-powered crypto project viability predictor that helps you make informed decisions about cryptocurrency investments.
          </p>
          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-celo mt-0.5 flex-shrink-0" />
              <p className="text-sm text-muted-foreground">
                Analyze token vibrancy scores using advanced AI algorithms
              </p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-celo mt-0.5 flex-shrink-0" />
              <p className="text-sm text-muted-foreground">
                Get detailed reports on token health and potential
              </p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-celo mt-0.5 flex-shrink-0" />
              <p className="text-sm text-muted-foreground">
                Participate in prediction markets and earn rewards
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "How VibeCheck Works",
      icon: <TrendingUp className="w-8 h-8" />,
      content: (
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
              <div className="w-8 h-8 rounded-full bg-celo/20 flex items-center justify-center flex-shrink-0">
                <span className="text-celo font-bold">1</span>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Search & Analyze</h4>
                <p className="text-sm text-muted-foreground">
                  Search for any cryptocurrency token and get instant vibrancy analysis
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
              <div className="w-8 h-8 rounded-full bg-celo/20 flex items-center justify-center flex-shrink-0">
                <span className="text-celo font-bold">2</span>
              </div>
              <div>
                <h4 className="font-semibold mb-1">View Reports</h4>
                <p className="text-sm text-muted-foreground">
                  Unlock detailed AI-powered reports with comprehensive token insights
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
              <div className="w-8 h-8 rounded-full bg-celo/20 flex items-center justify-center flex-shrink-0">
                <span className="text-celo font-bold">3</span>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Predict & Win</h4>
                <p className="text-sm text-muted-foreground">
                  Join VolatilityVanguard prediction games and earn rewards
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "VolatilityVanguard Game",
      icon: <Gamepad2 className="w-8 h-8" />,
      content: (
        <div className="space-y-4">
          <p className="text-lg text-muted-foreground">
            VolatilityVanguard is a prediction market game where you predict token price volatility and compete for rewards.
          </p>
          <div className="space-y-3">
            <div className="p-4 rounded-lg border border-celo/20 bg-celo/5">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-celo" />
                <h4 className="font-semibold">How It Works</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Each round focuses on a specific token. You predict whether the token's volatility will be higher or lower than a threshold within a lock period.
              </p>
            </div>
            <div className="p-4 rounded-lg border border-celo/20 bg-celo/5">
              <div className="flex items-center gap-2 mb-2">
                <Coins className="w-5 h-5 text-celo" />
                <h4 className="font-semibold">Stake cUSD</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Stake cUSD tokens to place your prediction. The more you stake, the higher your potential rewards.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Joining the Game",
      icon: <Users className="w-8 h-8" />,
      content: (
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
              <Wallet className="w-5 h-5 text-celo mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold mb-1">Connect Wallet</h4>
                <p className="text-sm text-muted-foreground">
                  Connect your MiniPay, Farcaster, or MetaMask wallet
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
              <Coins className="w-5 h-5 text-celo mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold mb-1">Approve cUSD</h4>
                <p className="text-sm text-muted-foreground">
                  Approve the contract to spend your cUSD tokens
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
              <Target className="w-5 h-5 text-celo mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold mb-1">Place Prediction</h4>
                <p className="text-sm text-muted-foreground">
                  Choose "Higher" or "Lower" and stake your cUSD amount
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
              <CheckCircle2 className="w-5 h-5 text-celo mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold mb-1">Wait for Settlement</h4>
                <p className="text-sm text-muted-foreground">
                  The round locks after the lock period, then the oracle settles the round
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Winners & Rewards",
      icon: <Trophy className="w-8 h-8" />,
      content: (
        <div className="space-y-4">
          <p className="text-lg text-muted-foreground">
            Winners are determined based on the actual token volatility compared to the risk threshold.
          </p>
          <div className="space-y-3">
            <div className="p-4 rounded-lg border border-green-500/20 bg-green-500/5">
              <h4 className="font-semibold mb-2 text-green-600 dark:text-green-400">Winning Condition</h4>
              <p className="text-sm text-muted-foreground">
                If you predicted correctly (higher/lower matches actual volatility), you win a share of the losing pool!
              </p>
            </div>
            <div className="p-4 rounded-lg border border-celo/20 bg-celo/5">
              <h4 className="font-semibold mb-2">Payout System</h4>
              <p className="text-sm text-muted-foreground mb-2">
                The payout uses an inverse liquidity pool model:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                <li>Fees are taken from the losing pool</li>
                <li>Winners share the remaining losing pool proportionally</li>
                <li>Your stake amount determines your share</li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Withdrawing Winnings",
      icon: <Wallet className="w-8 h-8" />,
      content: (
        <div className="space-y-4">
          <p className="text-lg text-muted-foreground">
            Claim your winnings anytime after a round has been settled.
          </p>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
              <div className="w-8 h-8 rounded-full bg-celo/20 flex items-center justify-center flex-shrink-0">
                <span className="text-celo font-bold">1</span>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Check Your Rounds</h4>
                <p className="text-sm text-muted-foreground">
                  View your prediction history and settled rounds
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
              <div className="w-8 h-8 rounded-full bg-celo/20 flex items-center justify-center flex-shrink-0">
                <span className="text-celo font-bold">2</span>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Claim Winnings</h4>
                <p className="text-sm text-muted-foreground">
                  Click "Claim Winnings" for any settled rounds where you won
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
              <div className="w-8 h-8 rounded-full bg-celo/20 flex items-center justify-center flex-shrink-0">
                <span className="text-celo font-bold">3</span>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Receive cUSD</h4>
                <p className="text-sm text-muted-foreground">
                  Your winnings are automatically transferred to your wallet
                </p>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-lg border border-celo/20 bg-celo/5 mt-4">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Note:</strong> You can claim winnings from multiple rounds at once for gas efficiency.
            </p>
          </div>
        </div>
      )
    }
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onContinue();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
      <div className="container max-w-md mx-auto px-4 py-6">
        {/* Logo at top center with rotation animation */}
        <div className="flex justify-center pt-8 pb-4">
          <div className="relative">
            <div 
              className="relative w-32 h-32"
              style={{
                transform: `perspective(1000px) rotateY(${logoRotation}deg)`,
                transition: 'transform 3s ease-in-out',
                transformStyle: 'preserve-3d',
              }}
            >
              <div className="relative w-full h-full animate-pulse">
                <Image
                  src="/logo.png"
                  alt="VibeCheck Logo"
                  width={128}
                  height={128}
                  className="object-contain drop-shadow-lg rounded-full"
                  priority
                />
                {/* Glow effect */}
                <div className="absolute inset-0 bg-celo/20 rounded-full blur-xl animate-pulse" style={{ animationDelay: '0.5s' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="mb-6">
          <div className="flex gap-2 justify-center">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === currentStep
                    ? 'bg-celo w-8'
                    : index < currentStep
                    ? 'bg-celo/50 w-4'
                    : 'bg-muted w-2'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content Card */}
        <div className="pb-20">
          <Card className="w-full p-6 bg-card/80 backdrop-blur-sm border-border/50 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-celo/10 text-celo">
              {steps[currentStep].icon}
            </div>
            <h2 className="text-2xl font-bold text-foreground">
              {steps[currentStep].title}
            </h2>
          </div>

          <div className="min-h-[300px]">
            {steps[currentStep].content}
          </div>

          {/* Navigation buttons */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-border/50">
            <Button
              variant="ghost"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="text-muted-foreground hover:text-celo"
            >
              Previous
            </Button>

            <div className="text-sm text-muted-foreground">
              {currentStep + 1} of {steps.length}
            </div>

            <Button
              onClick={nextStep}
              className="bg-celo hover:bg-celo/90 text-primary-foreground"
            >
              {currentStep === steps.length - 1 ? (
                <>
                  Continue to App
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
          </Card>
        </div>
      </div>

      {/* Background decorative elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-celo/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-celo/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>
    </div>
  );
};

export default Onboarding;


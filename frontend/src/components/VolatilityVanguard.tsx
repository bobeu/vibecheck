import React, { useEffect, useCallback, useMemo, useState } from 'react';
import { Target, TrendingUp, TrendingDown, CheckCircle, Zap } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useWallet } from '@/hooks/useWallet';
import { useVolatilityVanguard } from '@/hooks/useVolatilityVanguard';
import { useReadContract, useWriteContract, useSimulateContract, useWaitForTransactionReceipt, useBalance } from 'wagmi';
import VolatilityVanguardABI from '@/abis/VolatilityVanguardABI.json';
import { VOLATILITY_VANGUARD_ADDRESS } from '@/contracts/volatilityVanguardAddress';
import { parseEther, formatEther, zeroAddress } from 'viem';
import { useToast } from '@/hooks/use-toast';
import { useVolatilityPrediction } from '@/hooks/useVolatilityPrediction';
import { Input } from '@/components/ui/input';

interface VolatilityVanguardProps {
  tokenSymbol: string;
  tokenAddress: string;
  vibrancyScore: number;
  isVisible: boolean;
}

const VolatilityVanguard: React.FC<VolatilityVanguardProps> = ({
  tokenSymbol,
  tokenAddress,
  vibrancyScore,
  isVisible
}) => {
  const { toast } = useToast();
  const { address, isConnected } = useWallet();
  const [stakeAmount, setStakeAmount] = useState('0.1'); // Default stake in CELO
  
  // Get CELO balance
  const { data: celoBalance } = useBalance({
    address: address as `0x${string}` | undefined,
    query: {
      enabled: !!address,
      refetchInterval: 10000,
    },
  });
  
  // Use the new hook
  const {
    currentRound,
    currentRoundId,
    userPrediction,
    userRounds,
    isLoading: contractLoading,
    contractConfig,
    placePrediction,
    claimWinnings,
    refreshData
  } = useVolatilityVanguard();
  
  // Read current round info using Wagmi
  const { data: roundInfo } = useReadContract({
    address: VOLATILITY_VANGUARD_ADDRESS as `0x${string}`,
    abi: VolatilityVanguardABI,
    functionName: 'getRoundInfo',
    args: currentRoundId > 0 ? [BigInt(currentRoundId)] : undefined,
    query: {
      enabled: currentRoundId > 0 && VOLATILITY_VANGUARD_ADDRESS !== zeroAddress,
      refetchInterval: 10000, // Poll every 10 seconds
    },
  });
  
  // Write: place prediction (payable with CELO)
  const { writeContract: writePlacePrediction, isPending: isPlacing, data: placePredictionHash } = useWriteContract();
  
  // Simulate place prediction (Higher)
  const { data: placePredictionSimulationHigher } = useSimulateContract({
    address: VOLATILITY_VANGUARD_ADDRESS as `0x${string}`,
    abi: VolatilityVanguardABI,
    functionName: 'placePrediction',
    args: currentRoundId > 0 && stakeAmount
      ? [BigInt(currentRoundId), true]
      : undefined,
    value: stakeAmount && parseFloat(stakeAmount) > 0 ? parseEther(stakeAmount) : undefined,
    query: {
      enabled: currentRoundId > 0 && !!stakeAmount && parseFloat(stakeAmount) > 0 && VOLATILITY_VANGUARD_ADDRESS !== zeroAddress,
    },
  });
  
  // Simulate place prediction (Lower)
  const { data: placePredictionSimulationLower } = useSimulateContract({
    address: VOLATILITY_VANGUARD_ADDRESS as `0x${string}`,
    abi: VolatilityVanguardABI,
    functionName: 'placePrediction',
    args: currentRoundId > 0 && stakeAmount
      ? [BigInt(currentRoundId), false]
      : undefined,
    value: stakeAmount && parseFloat(stakeAmount) > 0 ? parseEther(stakeAmount) : undefined,
    query: {
      enabled: currentRoundId > 0 && !!stakeAmount && parseFloat(stakeAmount) > 0 && VOLATILITY_VANGUARD_ADDRESS !== zeroAddress,
    },
  });
  
  // Wait for place prediction transaction
  const { isLoading: isConfirmingPlacement, isSuccess: isPlacementSuccess } = useWaitForTransactionReceipt({
    hash: placePredictionHash,
  });
  
  // Write: claim winnings
  const { writeContract: writeClaimWinnings, isPending: isClaiming, data: claimHash } = useWriteContract();
  
  // Simulate claim winnings
  const [claimableRounds, setClaimableRounds] = useState<number[]>([]);
  
  const { data: claimSimulation } = useSimulateContract({
    address: VOLATILITY_VANGUARD_ADDRESS as `0x${string}`,
    abi: VolatilityVanguardABI,
    functionName: 'claimWinnings',
    args: claimableRounds.length > 0 ? [claimableRounds.map(id => BigInt(id))] : undefined,
    query: {
      enabled: claimableRounds.length > 0 && VOLATILITY_VANGUARD_ADDRESS !== zeroAddress,
    },
  });
  
  // Wait for claim transaction
  const { isLoading: isConfirmingClaim, isSuccess: isClaimSuccess } = useWaitForTransactionReceipt({
    hash: claimHash,
  });
  
  // AI prediction for display
  const { prediction: aiPrediction, isLoading: predictionLoading } = useVolatilityPrediction({ 
    tokenSymbol, 
    enabled: isVisible 
  });
  
  // Handle placement success
  useEffect(() => {
    if (isPlacementSuccess) {
      toast({ 
        title: 'Prediction Placed!', 
        description: `Staked ${stakeAmount} CELO on Round ${currentRoundId}` 
      });
      refreshData();
    }
  }, [isPlacementSuccess, toast, refreshData, stakeAmount, currentRoundId]);
  
  // Handle claim success
  useEffect(() => {
    if (isClaimSuccess) {
      toast({ 
        title: 'Winnings Claimed!', 
        description: 'Successfully claimed your winnings' 
      });
      refreshData();
    }
  }, [isClaimSuccess, toast, refreshData]);
  
  const handlePlacePrediction = useCallback((predictedHigher: boolean) => {
    if (!isConnected) {
      toast({ 
        title: 'Wallet Required', 
        description: 'Please connect your wallet to place a prediction' 
      });
      return;
    }
    
    if (!currentRoundId || currentRoundId === 0) {
      toast({ 
        title: 'No Active Round', 
        description: 'Please wait for a new round to start' 
      });
      return;
    }
    
    if (!stakeAmount || parseFloat(stakeAmount) <= 0) {
      toast({ 
        title: 'Invalid Amount', 
        description: 'Please enter a valid stake amount' 
      });
      return;
    }
    
    const stakeAmountWei = parseEther(stakeAmount);
    
    // Check balance
    if (celoBalance && celoBalance.value < stakeAmountWei) {
      toast({ 
        title: 'Insufficient Balance', 
        description: `You need at least ${stakeAmount} CELO` 
      });
      return;
    }
    
    // Use the appropriate simulation based on direction
    const simulation = predictedHigher ? placePredictionSimulationHigher : placePredictionSimulationLower;
    
    if (simulation?.request) {
      writePlacePrediction(simulation.request);
    } else {
      toast({
        title: 'Transaction Preparation Failed',
        description: 'Unable to prepare transaction. Please try again.',
      });
    }
  }, [isConnected, currentRoundId, stakeAmount, celoBalance, toast, writePlacePrediction, placePredictionSimulationHigher, placePredictionSimulationLower]);
  
  const handleClaimWinnings = useCallback((roundIds: number[]) => {
    if (!isConnected) {
      toast({ 
        title: 'Wallet Required', 
        description: 'Please connect your wallet to claim winnings' 
      });
      return;
    }
    
    setClaimableRounds(roundIds);
    
    // The simulation will update automatically, then we can write
  }, [isConnected, toast]);
  
  // Write claim when simulation is ready
  useEffect(() => {
    if (claimSimulation?.request && claimableRounds.length > 0) {
      writeClaimWinnings(claimSimulation.request);
      setClaimableRounds([]); // Reset after writing
    }
  }, [claimSimulation, claimableRounds, writeClaimWinnings]);
  
  // Calculate time remaining
  const timeRemaining = useMemo(() => {
    if (!currentRound || !roundInfo) return null;
    
    const lockTime = roundInfo[2] as bigint; // lockTime
    const startTime = roundInfo[1] as bigint; // startTime
    const endTime = startTime + lockTime;
    const now = BigInt(Math.floor(Date.now() / 1000));
    
    if (now >= endTime) return { expired: true, seconds: 0 };
    
    return {
      expired: false,
      seconds: Number(endTime - now)
    };
  }, [currentRound, roundInfo]);
  
  // Format time remaining
  const formatTimeRemaining = (seconds: number): string => {
    if (seconds <= 0) return 'Round Locked';
    
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };
  
  if (!isVisible) {
    return null;
  }
  
  // Parse round info from Wagmi read
  const roundData = roundInfo ? {
    id: roundInfo[0] as bigint,
    startTime: roundInfo[1] as bigint,
    lockTime: roundInfo[2] as bigint,
    closeTime: roundInfo[3] as bigint,
    isSettled: roundInfo[4] as boolean,
    totalPool: roundInfo[5] as bigint,
    totalHigherStaked: roundInfo[6] as bigint,
    totalLowerStaked: roundInfo[7] as bigint,
    result: roundInfo[8] as number,
  } : null;
  
  const totalPool = roundData ? formatEther(roundData.totalPool) : '0';
  const higherStaked = roundData ? formatEther(roundData.totalHigherStaked) : '0';
  const lowerStaked = roundData ? formatEther(roundData.totalLowerStaked) : '0';
  const totalPoolNum = parseFloat(totalPool);
  const higherPercentage = totalPoolNum > 0 ? (parseFloat(higherStaked) / totalPoolNum) * 100 : 0;
  const lowerPercentage = totalPoolNum > 0 ? (parseFloat(lowerStaked) / totalPoolNum) * 100 : 0;
  
  return (
    <Card className="mt-8 border-border/50 bg-card/80 backdrop-blur-sm">
      <div className="p-6 border-b border-border/50">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 gradient-fusion rounded-lg shadow-glow">
            <Target className="h-5 w-5 text-primary-foreground" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Volatility Vanguard</h2>
        </div>
        <p className="text-muted-foreground text-sm">
          Predict volatility in round-based prediction market using CELO
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Current Round Info */}
        {currentRoundId > 0 && roundData ? (
          <Card className="p-4 bg-muted/20 border-border/50">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-foreground">Round #{currentRoundId}</h3>
                <p className="text-sm text-muted-foreground">
                  {roundData.isSettled 
                    ? `Settled: ${roundData.result === 1 ? 'Higher' : roundData.result === 2 ? 'Lower' : 'Pending'}`
                    : timeRemaining && !timeRemaining.expired
                      ? `Time Remaining: ${formatTimeRemaining(timeRemaining.seconds)}`
                      : 'Round Locked'}
                </p>
              </div>
              <Badge {...({ variant: roundData.isSettled ? "secondary" : "default" } as any)}>
                {roundData.isSettled ? 'Settled' : 'Active'}
              </Badge>
            </div>
            
            {/* Pool Statistics */}
            <div className="space-y-2 mt-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Pool:</span>
                <span className="font-semibold text-foreground">{parseFloat(totalPool).toFixed(4)} CELO</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-minipay" />
                    Higher:
                  </span>
                  <span className="font-medium text-minipay">
                    {parseFloat(higherStaked).toFixed(4)} CELO ({higherPercentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <TrendingDown className="h-3 w-3 text-celo" />
                    Lower:
                  </span>
                  <span className="font-medium text-celo">
                    {parseFloat(lowerStaked).toFixed(4)} CELO ({lowerPercentage.toFixed(1)}%)
                  </span>
                </div>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="p-4 bg-muted/20 border-border/50">
            <p className="text-sm text-muted-foreground text-center">
              No active round. Waiting for round to start...
            </p>
          </Card>
        )}
        
        {/* User's Current Round Prediction */}
        {userPrediction && userPrediction.hasPredictedInRound && roundData && (
          <Card className="p-4 bg-celo/10 border-celo/30">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-celo" />
                <span className="font-semibold text-foreground">Your Prediction</span>
              </div>
              <Badge {...({ variant: "default" } as any)} className="gradient-celo">
                {userPrediction.predictsHigher ? 'Higher' : 'Lower'}
              </Badge>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Staked:</span>
                <span className="font-medium text-foreground">{formatEther(userPrediction.amount)} CELO</span>
              </div>
              {roundData.isSettled && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span className={`font-medium ${
                    (roundData.result === 1 && userPrediction.predictsHigher) ||
                    (roundData.result === 2 && !userPrediction.predictsHigher)
                      ? 'text-minipay' : 'text-muted-foreground'
                  }`}>
                    {(roundData.result === 1 && userPrediction.predictsHigher) ||
                     (roundData.result === 2 && !userPrediction.predictsHigher)
                      ? 'Won' : 'Lost'}
                  </span>
                </div>
              )}
              {roundData.isSettled && 
               !userPrediction.hasClaimedReward &&
               ((roundData.result === 1 && userPrediction.predictsHigher) ||
                (roundData.result === 2 && !userPrediction.predictsHigher)) && (
                <Button
                  onClick={() => handleClaimWinnings([currentRoundId])}
                  disabled={isClaiming || isConfirmingClaim}
                  className="w-full mt-3 gradient-celo hover:opacity-90"
                  size="sm"
                >
                  {isClaiming || isConfirmingClaim ? 'Claiming...' : 'Claim Winnings'}
                </Button>
              )}
            </div>
          </Card>
        )}
        
        {/* Place Prediction */}
        {roundData && !roundData.isSettled && timeRemaining && !timeRemaining.expired && (
          <Card className="p-4 bg-muted/20 border-border/50">
            <h4 className="font-medium text-foreground mb-3">Place Prediction</h4>
            
            {!userPrediction?.hasPredictedInRound ? (
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Stake Amount (CELO)</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                    placeholder="0.1"
                    className="bg-input border-border"
                  />
                  {celoBalance && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Balance: {formatEther(celoBalance.value)} CELO
                    </p>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() => handlePlacePrediction(true)}
                    disabled={isPlacing || isConfirmingPlacement || !isConnected}
                    className="gradient-minipay hover:opacity-90"
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Higher
                  </Button>
                  <Button
                    onClick={() => handlePlacePrediction(false)}
                    disabled={isPlacing || isConfirmingPlacement || !isConnected}
                    className="gradient-celo hover:opacity-90"
                  >
                    <TrendingDown className="h-4 w-4 mr-2" />
                    Lower
                  </Button>
                </div>
                
                {isPlacing || isConfirmingPlacement ? (
                  <p className="text-sm text-muted-foreground text-center">
                    Processing transaction...
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center">
                You have already placed a prediction in this round
              </p>
            )}
          </Card>
        )}
        
        {/* AI Prediction Suggestion */}
        {aiPrediction && !userPrediction?.hasPredictedInRound && (
          <Card className="p-4 bg-muted/20 border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-celo" />
              <h4 className="font-medium text-foreground">AI Suggestion</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              Based on AI analysis: <span className="font-medium text-foreground">
                {aiPrediction.direction}
              </span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Confidence: {aiPrediction.confidence}%
            </p>
          </Card>
        )}
        
        {/* User's Past Rounds */}
        {userRounds.length > 0 && (
          <div>
            <h3 className="font-semibold text-foreground mb-3">Your Rounds</h3>
            <div className="space-y-2">
              {userRounds.slice(0, 5).map((roundId) => (
                <Card key={roundId} className="p-3 bg-muted/10 border-border/50">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Round #{roundId}</span>
                    <Button
                      onClick={() => handleClaimWinnings([roundId])}
                      disabled={isClaiming}
                      size="sm"
                      variant="ghost"
                      className="h-7"
                    >
                      View
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
        
        {/* How It Works */}
        <Card className="p-4 bg-muted/20 border-border/50">
          <h4 className="font-medium text-foreground mb-2">How It Works</h4>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>• Predict if volatility will be Higher or Lower in the current round</p>
            <p>• Stake CELO (native token) on your prediction</p>
            <p>• Winners share the pool after round settlement</p>
            <p>• Fee is taken from the losing pool</p>
            <p>• Claim your winnings after settlement</p>
          </div>
        </Card>
      </div>
    </Card>
  );
};

export default VolatilityVanguard;

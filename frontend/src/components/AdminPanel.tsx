import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAccount, useConfig, useReadContract, useWriteContract, useSimulateContract, useWaitForTransactionReceipt, useBalance } from 'wagmi';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { VolatilityVanguardService } from '@/lib/volatilityVanguardService';
import VolatilityVanguardABI from '@/abis/VolatilityVanguardABI.json';
import { getVolatilityVanguardAddress, getVolatilityVanguardABI } from '@/contracts/volatilityVanguardAddress';
import { formatEther, parseEther, isAddress, zeroAddress, type Address } from 'viem';
import { Settings, AlertTriangle, Clock, DollarSign, Users, TrendingUp, TrendingDown, Zap, Wallet, ArrowLeft } from 'lucide-react';
import { useChainId } from 'wagmi';

interface AdminPanelProps {
  onBack?: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onBack }) => {
  const { toast } = useToast();
  const { address } = useAccount();
  const config = useConfig();
  const chainId = useChainId();
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [isCheckingOwner, setIsCheckingOwner] = useState(true);
  const [contractOwner, setContractOwner] = useState<string | null>(null);
  const [contractConfig, setContractConfig] = useState<any>(null);
  const [currentRound, setCurrentRound] = useState<any>(null);
  const [currentRoundId, setCurrentRoundId] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isMounted, setIsMounted] = useState(false);
  
  // Get contract address and ABI based on current chainId
  const VOLATILITY_VANGUARD_ADDRESS = getVolatilityVanguardAddress(chainId);
  const VOLATILITY_VANGUARD_ABI = getVolatilityVanguardABI(chainId);
  
  // Form states for admin actions
  const [oracleAddress, setOracleAddress] = useState('');
  const [feeReceiver, setFeeReceiver] = useState('');
  const [feeRate, setFeeRate] = useState('');
  const [riskThreshold, setRiskThreshold] = useState('');
  const [lockTime, setLockTime] = useState('');

  const volatilityVanguardService = useMemo(
    () => new VolatilityVanguardService(config),
    [config]
  );

  // Get contract balance
  const { data: contractBalance } = useBalance({
    address: VOLATILITY_VANGUARD_ADDRESS as Address,
    query: {
      enabled: !!VOLATILITY_VANGUARD_ADDRESS && VOLATILITY_VANGUARD_ADDRESS !== zeroAddress,
      refetchInterval: 10000,
    },
  });

  // Check if user is owner
  const checkOwner = useCallback(async () => {
    if (!address) {
      setIsOwner(false);
      setIsCheckingOwner(false);
      return;
    }

    try {
      const owner = await volatilityVanguardService.getOwner();
      setContractOwner(owner);
      setIsOwner(owner?.toLowerCase() === address.toLowerCase());
    } catch (error) {
      console.error('Error checking owner:', error);
      setIsOwner(false);
    } finally {
      setIsCheckingOwner(false);
    }
  }, [address, volatilityVanguardService]);

  // Load contract data
  const loadContractData = useCallback(async () => {
    try {
      const roundId = await volatilityVanguardService.getCurrentRoundId();
      setCurrentRoundId(roundId);

      if (roundId > 0) {
        const roundInfo = await volatilityVanguardService.getRoundInfo(roundId);
        setCurrentRound(roundInfo);
      }

      const config = await volatilityVanguardService.getContractConfig();
      if (config) {
        setContractConfig(config);
        setFeeRate((Number(config.feeRate) / 100).toFixed(2));
        setRiskThreshold((Number(config.riskThreshold) / 100).toFixed(2));
        setLockTime(Number(config.lockTime).toString());
      }
    } catch (error) {
      console.error('Error loading contract data:', error);
    }
  }, [volatilityVanguardService]);

  // Set mounted state to prevent hydration issues
  useEffect(() => {
    setIsMounted(true);
    setCurrentTime(Math.floor(Date.now() / 1000));
  }, []);

  useEffect(() => {
    if (isMounted) {
      checkOwner();
      loadContractData();
    }
  }, [isMounted, checkOwner, loadContractData]);

  // Refresh data periodically and update current time
  useEffect(() => {
    if (!isMounted) return;
    
    const interval = setInterval(() => {
      setCurrentTime(Math.floor(Date.now() / 1000));
      if (isOwner) {
        loadContractData();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [isMounted, isOwner, loadContractData]);

  // Format time remaining
  const formatTimeRemaining = (startTime: bigint, lockTime: bigint): string => {
    if (!isMounted || currentTime === 0) return 'Calculating...';
    const now = BigInt(currentTime);
    const endTime = startTime + lockTime;
    if (now >= endTime) return 'Lock time elapsed';
    const remaining = endTime - now;
    const days = Number(remaining) / (24 * 60 * 60);
    const hours = (Number(remaining) % (24 * 60 * 60)) / (60 * 60);
    const minutes = (Number(remaining) % (60 * 60)) / 60;
    if (days >= 1) return `${Math.floor(days)}d ${Math.floor(hours)}h remaining`;
    if (hours >= 1) return `${Math.floor(hours)}h ${Math.floor(minutes)}m remaining`;
    return `${Math.floor(minutes)}m remaining`;
  };

  // Format lock time
  const formatLockTime = (seconds: bigint): string => {
    const s = Number(seconds);
    const days = Math.floor(s / (24 * 60 * 60));
    const hours = Math.floor((s % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((s % (60 * 60)) / 60);
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  // Check if can start new round
  const canStartNewRound = useMemo(() => {
    if (!isMounted || currentTime === 0) return false;
    if (currentRoundId === 0) return true;
    if (!currentRound) return false;
    const now = BigInt(currentTime);
    return currentRound.isSettled || now >= currentRound.startTime + currentRound.lockTime;
  }, [isMounted, currentTime, currentRoundId, currentRound]);

  if (isCheckingOwner) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-celo mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking admin access...</p>
        </div>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="w-full flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-card/80 border-border/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-destructive" />
              Access Denied
            </CardTitle>
            <CardDescription>
              You must be the contract owner to access the admin panel.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Connected Address:
              </p>
              <p className="text-sm font-mono break-all">{address || 'Not connected'}</p>
              {contractOwner && (
                <>
                  <p className="text-sm text-muted-foreground mt-4">
                    Contract Owner:
                  </p>
                  <p className="text-sm font-mono break-all">{contractOwner}</p>
                </>
              )}
            </div>
          </CardContent>
          {onBack && (
            <CardFooter>
              <Button
                variant="outline"
                className="w-full"
                onClick={onBack}
              >
                Back to Home
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full">
      {onBack && (
        <Button
          variant="outline"
          className="mb-4"
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>
      )}
      <div className="container max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Settings className="h-8 w-8 text-celo" />
              Admin Panel
            </h1>
            <p className="text-muted-foreground mt-1">Manage VolatilityVanguard Contract</p>
          </div>
          <Badge variant="default" className="bg-celo/20 text-celo border-celo/50">
            Owner
          </Badge>
        </div>

        {/* Contract State */}
        <Card className="bg-card/80 border-border/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-celo" />
              Contract Configuration
            </CardTitle>
            <CardDescription>Current contract settings and state</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Current Round ID</p>
                <p className="text-lg font-semibold">{currentRoundId || 'None'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Contract Balance</p>
                <p className="text-lg font-semibold text-celo">
                  {contractBalance ? formatEther(contractBalance.value) : '0'} CELO
                </p>
              </div>
              {contractConfig && (
                <>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Fee Rate</p>
                    <p className="text-lg font-semibold">{Number(contractConfig.feeRate) / 100}%</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Risk Threshold</p>
                    <p className="text-lg font-semibold">{Number(contractConfig.riskThreshold) / 100}%</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Lock Time</p>
                    <p className="text-lg font-semibold">{formatLockTime(contractConfig.lockTime)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Oracle Address</p>
                    <p className="text-sm font-mono break-all">{contractConfig.oracleAddress}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Fee Receiver</p>
                    <p className="text-sm font-mono break-all">{contractConfig.feeReceiver}</p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Current Round Info */}
        {currentRound && (
          <Card className="bg-card/80 border-border/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-celo" />
                Current Round #{currentRoundId}
              </CardTitle>
              <CardDescription>Round status and statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={currentRound.isSettled ? 'default' : 'secondary'}>
                    {currentRound.isSettled ? 'Settled' : 'Active'}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Result</p>
                  <Badge variant="outline">
                    {currentRound.result === 0 ? 'Pending' : currentRound.result === 1 ? 'Higher' : 'Lower'}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Time Remaining</p>
                  <p className="text-sm font-semibold">
                    {formatTimeRemaining(currentRound.startTime, currentRound.lockTime)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total Pool</p>
                  <p className="text-lg font-semibold text-celo">
                    {formatEther(currentRound.totalPool)} CELO
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="h-4 w-4" /> Higher Staked
                  </p>
                  <p className="text-sm font-semibold text-accent-red">
                    {formatEther(currentRound.totalHigherStaked)} CELO
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <TrendingDown className="h-4 w-4" /> Lower Staked
                  </p>
                  <p className="text-sm font-semibold text-minipay">
                    {formatEther(currentRound.totalLowerStaked)} CELO
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Admin Actions */}
        <StartNewRoundAction 
          canStart={canStartNewRound}
          currentRound={currentRound}
          currentRoundId={currentRoundId}
          contractAddress={VOLATILITY_VANGUARD_ADDRESS as Address}
          contractABI={VOLATILITY_VANGUARD_ABI}
        />

        <SetOracleAddressAction 
          currentValue={contractConfig?.oracleAddress}
          contractAddress={VOLATILITY_VANGUARD_ADDRESS as Address}
          contractABI={VOLATILITY_VANGUARD_ABI}
        />

        <SetFeeReceiverAction 
          currentValue={contractConfig?.feeReceiver}
          contractAddress={VOLATILITY_VANGUARD_ADDRESS as Address}
          contractABI={VOLATILITY_VANGUARD_ABI}
        />

        <SetFeeRateAction 
          currentValue={contractConfig?.feeRate}
          contractAddress={VOLATILITY_VANGUARD_ADDRESS as Address}
          contractABI={VOLATILITY_VANGUARD_ABI}
        />

        <SetRiskThresholdAction 
          currentValue={contractConfig?.riskThreshold}
          contractAddress={VOLATILITY_VANGUARD_ADDRESS as Address}
          contractABI={VOLATILITY_VANGUARD_ABI}
        />

        <SetLockTimeAction 
          currentValue={contractConfig?.lockTime}
          contractAddress={VOLATILITY_VANGUARD_ADDRESS as Address}
          contractABI={VOLATILITY_VANGUARD_ABI}
        />

        <EmergencyWithdrawAction 
          contractBalance={contractBalance?.value}
          contractAddress={VOLATILITY_VANGUARD_ADDRESS as Address}
          contractABI={VOLATILITY_VANGUARD_ABI}
        />
      </div>
    </div>
  );
};

// Start New Round Action Component
const StartNewRoundAction: React.FC<{
  canStart: boolean;
  currentRound: any;
  currentRoundId: number;
  contractAddress: Address;
  contractABI: any[];
}> = ({ canStart, currentRound, currentRoundId, contractAddress, contractABI }) => {
  const { toast } = useToast();
  const { data: hash, writeContract, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const handleStartRound = () => {
    writeContract({
      address: contractAddress,
      abi: contractABI.length > 0 ? contractABI : VolatilityVanguardABI,
      functionName: 'startNewRound',
      args: [],
    });
  };

  useEffect(() => {
    if (isSuccess) {
      toast({
        title: 'Round Started!',
        description: 'New round has been started successfully.',
      });
    }
  }, [isSuccess, toast]);

  return (
    <Card className="bg-card/80 border-border/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-celo" />
          Start New Round
        </CardTitle>
        <CardDescription>
          Start a new prediction round. Can only be called when current round is settled or lockTime has elapsed.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {!canStart && currentRound && (
            <Alert className="bg-yellow-500/10 border-yellow-500/50">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <AlertDescription className="text-yellow-700 dark:text-yellow-400">
                Cannot start new round: Current round is still open for predictions. 
                {currentRound.isSettled 
                  ? ' Round is already settled.' 
                  : ' Wait for lockTime to elapse or settle the round first.'}
              </AlertDescription>
            </Alert>
          )}
          {canStart && (
            <Alert className="bg-green-500/10 border-green-500/50">
              <AlertDescription className="text-green-700 dark:text-green-400">
                ✓ Ready to start new round. Current round is {currentRoundId === 0 ? 'not started' : currentRound?.isSettled ? 'settled' : 'closed'}.
              </AlertDescription>
            </Alert>
          )}
          <Button
            onClick={handleStartRound}
            disabled={!canStart || isPending || isConfirming}
            className="w-full gradient-celo"
          >
            {isPending || isConfirming ? 'Processing...' : 'Start New Round'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Set Oracle Address Action Component
const SetOracleAddressAction: React.FC<{
  currentValue?: string;
  contractAddress: Address;
  contractABI: any[];
}> = ({ currentValue, contractAddress, contractABI }) => {
  const { toast } = useToast();
  const [address, setAddress] = useState('');
  const { data: hash, writeContract, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const { data: simulation } = useSimulateContract({
    address: contractAddress,
    abi: contractABI.length > 0 ? contractABI : VolatilityVanguardABI,
    functionName: 'setOracleAddress',
    args: [address as Address],
    query: {
      enabled: isAddress(address) && address !== currentValue,
    },
  });

  const handleSubmit = () => {
    if (!isAddress(address)) {
      toast({
        title: 'Invalid Address',
        description: 'Please enter a valid Ethereum address.',
        variant: 'destructive',
      });
      return;
    }
    if (address.toLowerCase() === currentValue?.toLowerCase()) {
      toast({
        title: 'No Change',
        description: 'This is already the current oracle address.',
        variant: 'destructive',
      });
      return;
    }
    writeContract({
      address: contractAddress,
      abi: contractABI.length > 0 ? contractABI : VolatilityVanguardABI,
      functionName: 'setOracleAddress',
      args: [address as Address],
    });
  };

  useEffect(() => {
    if (isSuccess) {
      toast({
        title: 'Oracle Address Updated!',
        description: 'The oracle address has been updated successfully.',
      });
      setAddress('');
    }
  }, [isSuccess, toast]);

  return (
    <Card className="bg-card/80 border-border/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-celo" />
          Set Oracle Address
        </CardTitle>
        <CardDescription>
          Updates the oracle address that can settle rounds. This address has permission to call settleRound().
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {currentValue && (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Current Oracle Address:</p>
              <p className="text-sm font-mono break-all">{currentValue}</p>
            </div>
          )}
          <div className="space-y-2">
            <label className="text-sm font-medium">New Oracle Address</label>
            <Input
              type="text"
              placeholder="0x..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              Enter a valid Ethereum address. This address will be able to settle rounds.
            </p>
          </div>
          <Alert className="bg-yellow-500/10 border-yellow-500/50">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <AlertDescription className="text-yellow-700 dark:text-yellow-400 text-xs">
              ⚠️ Changing oracle address affects who can settle rounds. Use with caution.
            </AlertDescription>
          </Alert>
          <Button
            onClick={handleSubmit}
            disabled={!simulation || isPending || isConfirming || !isAddress(address)}
            className="w-full"
          >
            {isPending || isConfirming ? 'Updating...' : 'Update Oracle Address'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Set Fee Receiver Action Component
const SetFeeReceiverAction: React.FC<{
  currentValue?: string;
  contractAddress: Address;
  contractABI: any[];
}> = ({ currentValue, contractAddress, contractABI }) => {
  const { toast } = useToast();
  const [address, setAddress] = useState('');
  const { data: hash, writeContract, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const { data: simulation } = useSimulateContract({
    address: contractAddress,
    abi: contractABI.length > 0 ? contractABI : VolatilityVanguardABI,
    functionName: 'setFeeReceiver',
    args: [address as Address],
    query: {
      enabled: isAddress(address) && address !== currentValue,
    },
  });

  const handleSubmit = () => {
    if (!isAddress(address)) {
      toast({
        title: 'Invalid Address',
        description: 'Please enter a valid Ethereum address.',
        variant: 'destructive',
      });
      return;
    }
    if (address.toLowerCase() === currentValue?.toLowerCase()) {
      toast({
        title: 'No Change',
        description: 'This is already the current fee receiver address.',
        variant: 'destructive',
      });
      return;
    }
    writeContract({
      address: contractAddress,
      abi: contractABI.length > 0 ? contractABI : VolatilityVanguardABI,
      functionName: 'setFeeReceiver',
      args: [address as Address],
    });
  };

  useEffect(() => {
    if (isSuccess) {
      toast({
        title: 'Fee Receiver Updated!',
        description: 'The fee receiver address has been updated successfully.',
      });
      setAddress('');
    }
  }, [isSuccess, toast]);

  return (
    <Card className="bg-card/80 border-border/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-celo" />
          Set Fee Receiver
        </CardTitle>
        <CardDescription>
          Updates the address that receives fees from losing pools. Fees are collected when winners claim.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {currentValue && (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Current Fee Receiver:</p>
              <p className="text-sm font-mono break-all">{currentValue}</p>
            </div>
          )}
          <div className="space-y-2">
            <label className="text-sm font-medium">New Fee Receiver Address</label>
            <Input
              type="text"
              placeholder="0x..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              Enter a valid Ethereum address. This address will receive all future fees.
            </p>
          </div>
          <Alert className="bg-yellow-500/10 border-yellow-500/50">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <AlertDescription className="text-yellow-700 dark:text-yellow-400 text-xs">
              ⚠️ This address will receive all future fees. Verify address carefully.
            </AlertDescription>
          </Alert>
          <Button
            onClick={handleSubmit}
            disabled={!simulation || isPending || isConfirming || !isAddress(address)}
            className="w-full"
          >
            {isPending || isConfirming ? 'Updating...' : 'Update Fee Receiver'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Set Fee Rate Action Component
const SetFeeRateAction: React.FC<{
  currentValue?: bigint;
  contractAddress: Address;
  contractABI: any[];
}> = ({ currentValue, contractAddress, contractABI }) => {
  const { toast } = useToast();
  const [rate, setRate] = useState('');
  const { data: hash, writeContract, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const rateInBasisPoints = rate ? Math.floor(parseFloat(rate) * 100) : 0;
  const isValid: boolean = rate ? (!isNaN(parseFloat(rate)) && parseFloat(rate) >= 0 && parseFloat(rate) <= 100) : false;
  const isEnabled: boolean = Boolean(isValid && rateInBasisPoints !== Number(currentValue));

  const { data: simulation } = useSimulateContract({
    address: contractAddress,
    abi: contractABI.length > 0 ? contractABI : VolatilityVanguardABI,
    functionName: 'setFeeRate',
    args: [BigInt(rateInBasisPoints)],
    query: {
      enabled: isEnabled as true | false,
    },
  });

  const handleSubmit = () => {
    if (!isValid) {
      toast({
        title: 'Invalid Fee Rate',
        description: 'Fee rate must be between 0 and 100 (percentage).',
        variant: 'destructive',
      });
      return;
    }
    if (rateInBasisPoints === Number(currentValue)) {
      toast({
        title: 'No Change',
        description: 'This is already the current fee rate.',
        variant: 'destructive',
      });
      return;
    }
    writeContract({
      address: contractAddress,
      abi: contractABI.length > 0 ? contractABI : VolatilityVanguardABI,
      functionName: 'setFeeRate',
      args: [BigInt(rateInBasisPoints)],
    });
  };

  useEffect(() => {
    if (isSuccess) {
      toast({
        title: 'Fee Rate Updated!',
        description: 'The fee rate has been updated successfully.',
      });
      setRate('');
    }
  }, [isSuccess, toast]);

  return (
    <Card className="bg-card/80 border-border/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-celo" />
          Set Fee Rate
        </CardTitle>
        <CardDescription>
          Updates the fee rate taken from losing pools. Fee rate is in percentage (e.g., 2.50 = 2.50%). Maximum is 100%.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {currentValue && (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Current Fee Rate:</p>
              <p className="text-lg font-semibold">{Number(currentValue) / 100}%</p>
            </div>
          )}
          <div className="space-y-2">
            <label className="text-sm font-medium">New Fee Rate (%)</label>
            <Input
              type="number"
              step="0.01"
              min="0"
              max="100"
              placeholder="2.50"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Enter fee rate as percentage (0-100). Example: 2.50 = 2.50% = 250 basis points.
            </p>
          </div>
          {rate && isValid && (
            <div className="p-3 bg-muted/50 rounded-md">
              <p className="text-sm text-muted-foreground">Preview:</p>
              <p className="text-lg font-semibold">{parseFloat(rate)}% = {rateInBasisPoints} basis points</p>
            </div>
          )}
          <Button
            onClick={handleSubmit}
            disabled={!simulation || isPending || isConfirming || !isValid}
            className="w-full"
          >
            {isPending || isConfirming ? 'Updating...' : 'Update Fee Rate'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Set Risk Threshold Action Component
const SetRiskThresholdAction: React.FC<{
  currentValue?: bigint;
  contractAddress: Address;
  contractABI: any[];
}> = ({ currentValue, contractAddress, contractABI }) => {
  const { toast } = useToast();
  const [threshold, setThreshold] = useState('');
  const { data: hash, writeContract, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const thresholdInBasisPoints = threshold ? Math.floor(parseFloat(threshold) * 100) : 0;
  const isValid: boolean = Boolean(threshold && !isNaN(parseFloat(threshold)) && parseFloat(threshold) >= 0);
  const isEnabled: boolean = Boolean(isValid && thresholdInBasisPoints !== Number(currentValue));

  const { data: simulation } = useSimulateContract({
    address: contractAddress,
    abi: contractABI.length > 0 ? contractABI : VolatilityVanguardABI,
    functionName: 'setRiskThreshold',
    args: [BigInt(thresholdInBasisPoints)],
    query: {
      enabled: isEnabled as any,
    },
  });

  const handleSubmit = () => {
    if (!isValid) {
      toast({
        title: 'Invalid Risk Threshold',
        description: 'Risk threshold must be a valid positive number.',
        variant: 'destructive',
      });
      return;
    }
    if (thresholdInBasisPoints === Number(currentValue)) {
      toast({
        title: 'No Change',
        description: 'This is already the current risk threshold.',
        variant: 'destructive',
      });
      return;
    }
    writeContract({
      address: contractAddress,
      abi: contractABI.length > 0 ? contractABI : VolatilityVanguardABI,
      functionName: 'setRiskThreshold',
      args: [BigInt(thresholdInBasisPoints)],
    });
  };

  useEffect(() => {
    if (isSuccess) {
      toast({
        title: 'Risk Threshold Updated!',
        description: 'The risk threshold has been updated successfully.',
      });
      setThreshold('');
    }
  }, [isSuccess, toast]);

  return (
    <Card className="bg-card/80 border-border/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-celo" />
          Set Risk Threshold
        </CardTitle>
        <CardDescription>
          Updates the risk threshold used for volatility calculations. Threshold is in percentage (e.g., 1.5 = 1.5%).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {currentValue && (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Current Risk Threshold:</p>
              <p className="text-lg font-semibold">{Number(currentValue) / 100}%</p>
            </div>
          )}
          <div className="space-y-2">
            <label className="text-sm font-medium">New Risk Threshold (%)</label>
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="1.50"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Enter risk threshold as percentage. Example: 1.50 = 1.50% = 150 basis points.
            </p>
          </div>
          {threshold && isValid && (
            <div className="p-3 bg-muted/50 rounded-md">
              <p className="text-sm text-muted-foreground">Preview:</p>
              <p className="text-lg font-semibold">{parseFloat(threshold)}% = {thresholdInBasisPoints} basis points</p>
            </div>
          )}
          <Button
            onClick={handleSubmit}
            disabled={!simulation || isPending || isConfirming || !isValid}
            className="w-full"
          >
            {isPending || isConfirming ? 'Updating...' : 'Update Risk Threshold'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Set Lock Time Action Component
const SetLockTimeAction: React.FC<{
  currentValue?: bigint;
  contractAddress: Address;
  contractABI: any[];
}> = ({ currentValue, contractAddress, contractABI }) => {
  const { toast } = useToast();
  const [time, setTime] = useState('');
  const { data: hash, writeContract, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const timeInSeconds = time ? parseInt(time) : 0;
  const isValid: boolean = Boolean(time && !isNaN(timeInSeconds) && timeInSeconds > 0);
  const isEnabled: boolean = Boolean(isValid && timeInSeconds !== Number(currentValue));

  const { data: simulation } = useSimulateContract({
    address: contractAddress,
    abi: contractABI.length > 0 ? contractABI : VolatilityVanguardABI,
    functionName: 'setLockTime',
    args: [BigInt(timeInSeconds)],
    query: {
      enabled: isEnabled as any,
    },
  });

  const formatTime = (seconds: number): string => {
    const days = Math.floor(seconds / (24 * 60 * 60));
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((seconds % (60 * 60)) / 60);
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const handleSubmit = () => {
    if (!isValid) {
      toast({
        title: 'Invalid Lock Time',
        description: 'Lock time must be a positive number of seconds.',
        variant: 'destructive',
      });
      return;
    }
    if (timeInSeconds === Number(currentValue)) {
      toast({
        title: 'No Change',
        description: 'This is already the current lock time.',
        variant: 'destructive',
      });
      return;
    }
    writeContract({
      address: contractAddress,
      abi: contractABI.length > 0 ? contractABI : VolatilityVanguardABI,
      functionName: 'setLockTime',
      args: [BigInt(timeInSeconds)],
    });
  };

  useEffect(() => {
    if (isSuccess) {
      toast({
        title: 'Lock Time Updated!',
        description: 'The lock time has been updated successfully.',
      });
      setTime('');
    }
  }, [isSuccess, toast]);

  return (
    <Card className="bg-card/80 border-border/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-celo" />
          Set Lock Time
        </CardTitle>
        <CardDescription>
          Updates the duration (in seconds) that a round stays open for predictions. After this time, the round can be settled.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {currentValue && (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Current Lock Time:</p>
              <p className="text-lg font-semibold">{formatTime(Number(currentValue))} ({Number(currentValue)} seconds)</p>
            </div>
          )}
          <div className="space-y-2">
            <label className="text-sm font-medium">New Lock Time (seconds)</label>
            <Input
              type="number"
              min="1"
              placeholder="604800"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Enter lock time in seconds. Example: 604800 = 7 days.
            </p>
          </div>
          {time && isValid && (
            <div className="p-3 bg-muted/50 rounded-md">
              <p className="text-sm text-muted-foreground">Preview:</p>
              <p className="text-lg font-semibold">{formatTime(timeInSeconds)} ({timeInSeconds} seconds)</p>
            </div>
          )}
          <Alert className="bg-yellow-500/10 border-yellow-500/50">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <AlertDescription className="text-yellow-700 dark:text-yellow-400 text-xs">
              ⚠️ Changing lock time affects future rounds only, not current round.
            </AlertDescription>
          </Alert>
          <Button
            onClick={handleSubmit}
            disabled={!simulation || isPending || isConfirming || !isValid}
            className="w-full"
          >
            {isPending || isConfirming ? 'Updating...' : 'Update Lock Time'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Emergency Withdraw Action Component
const EmergencyWithdrawAction: React.FC<{
  contractBalance?: bigint;
  contractAddress: Address;
  contractABI: any[];
}> = ({ contractBalance, contractAddress, contractABI }) => {
  const { toast } = useToast();
  const [confirmText, setConfirmText] = useState('');
  const { data: hash, writeContract, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const isConfirmed = confirmText.toLowerCase() === 'withdraw';
  const isEnabled: boolean = !!(isConfirmed && contractBalance && contractBalance > 0n);

  const { data: simulation } = useSimulateContract({
    address: contractAddress,
    abi: contractABI.length > 0 ? contractABI : VolatilityVanguardABI,
    functionName: 'emergencyWithdraw',
    query: {
      enabled: isEnabled as any,
    },
  });

  const handleWithdraw = () => {
    if (!isConfirmed) {
      toast({
        title: 'Confirmation Required',
        description: 'Please type "withdraw" to confirm.',
        variant: 'destructive',
      });
      return;
    }
    writeContract({
      address: contractAddress,
      abi: contractABI.length > 0 ? contractABI : VolatilityVanguardABI,
      functionName: 'emergencyWithdraw',
      args: [],
    });
  };

  useEffect(() => {
    if (isSuccess) {
      toast({
        title: 'Funds Withdrawn!',
        description: 'All funds have been withdrawn from the contract.',
      });
      setConfirmText('');
    }
  }, [isSuccess, toast]);

  return (
    <Card className="bg-card/80 border-destructive/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          Emergency Withdraw
        </CardTitle>
        <CardDescription>
          Emergency function to withdraw all CELO from contract. Use only if funds are stuck.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Contract Balance:</p>
            <p className="text-lg font-semibold text-destructive">
              {contractBalance ? formatEther(contractBalance) : '0'} CELO
            </p>
          </div>
          <Alert className="bg-destructive/10 border-destructive/50">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-destructive text-xs">
              ⚠️ DANGER: This will withdraw ALL funds from the contract. Only use in emergency situations. 
              Ensure no active rounds with pending claims.
            </AlertDescription>
          </Alert>
          <div className="space-y-2">
            <label className="text-sm font-medium">Type "withdraw" to confirm</label>
            <Input
              type="text"
              placeholder="withdraw"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
            />
          </div>
          <Button
            onClick={handleWithdraw}
            disabled={!simulation || isPending || isConfirming || !isConfirmed || !contractBalance || contractBalance === 0n}
            variant="destructive"
            className="w-full"
          >
            {isPending || isConfirming ? 'Withdrawing...' : 'Emergency Withdraw'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminPanel;
export type { AdminPanelProps };


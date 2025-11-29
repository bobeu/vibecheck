import type { Config } from 'wagmi';
import { readContract, writeContract, waitForTransactionReceipt } from 'wagmi/actions';
import { getAccount, getChainId } from '@wagmi/core';
import { getVolatilityVanguardAddress, getVolatilityVanguardABI } from '@/contracts/volatilityVanguardAddress';
import { zeroAddress, parseEther, type Address, maxUint256 } from 'viem';

// Helper to get contract address based on current chainId
const getContractAddress = (config: Config): Address => {
  try {
    const chainId = getChainId(config);
    return getVolatilityVanguardAddress(chainId);
  } catch (error) {
    console.warn('Could not get chainId, using fallback');
    return zeroAddress;
  }
};

// Helper to get contract ABI based on current chainId
const getContractABI = (config: Config): any[] => {
  try {
    const chainId = getChainId(config);
    return getVolatilityVanguardABI(chainId);
  } catch (error) {
    console.warn('Could not get chainId for ABI, using fallback');
    return [];
  }
};

// ERC20 ABI for approve and balanceOf
const ERC20_ABI = [
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' }
    ],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  }
] as const;

export interface RoundData {
  id: bigint;
  startTime: bigint;
  lockTime: bigint;
  closeTime: bigint;
  isSettled: boolean;
  totalPool: bigint;
  totalHigherStaked: bigint;
  totalLowerStaked: bigint;
  result: number; // 0=Pending, 1=Higher, 2=Lower
}

export interface UserPrediction {
  hasPredictedInRound: boolean;
  amount: bigint;
  predictsHigher: boolean;
  hasClaimedReward: boolean;
}

export interface PoolData {
  poolId: number;
  totalAmount: number;
  higherAmount: number;
  lowerAmount: number;
  resolved: boolean;
  higherPercentage: number;
  lowerPercentage: number;
}

export interface PredictionData {
  id: number;
  predictedHigher: boolean;
  startPrice: string;
  startTime: number;
  resolved: boolean;
  won?: boolean;
}

export class VolatilityVanguardService {
  private config: Config;

  constructor(config: Config) {
    this.config = config;
  }

  /**
   * Get current round ID
   */
  async getCurrentRoundId(): Promise<number> {
    try {
      const contractAddress = getContractAddress(this.config);
      if (contractAddress === zeroAddress) {
        return 0;
      }

      const contractABI = getContractABI(this.config);
      if (contractABI.length === 0) {
        return 0;
      }

      const result = await readContract(this.config, {
        address: contractAddress,
        abi: contractABI,
        functionName: 'currentRoundId',
        args: [],
      });

      return Number(result);
    } catch (error) {
      console.error('Get current round ID error:', error);
      return 0;
    }
  }

  /**
   * Get round information
   */
  async getRoundInfo(roundId: number): Promise<RoundData | null> {
    try {
      const contractAddress = getContractAddress(this.config);
      if (contractAddress === zeroAddress) {
        return null;
      }

      const contractABI = getContractABI(this.config);
      if (contractABI.length === 0) {
        return null;
      }

      const result = await readContract(this.config, {
        address: contractAddress,
        abi: contractABI,
        functionName: 'getRoundInfo',
        args: [BigInt(roundId)],
      }) as any;

      return {
        id: result[0],
        startTime: result[1],
        lockTime: result[2],
        closeTime: result[3],
        isSettled: result[4],
        totalPool: result[5],
        totalHigherStaked: result[6],
        totalLowerStaked: result[7],
        result: Number(result[8])
      };
    } catch (error: any) {
      console.warn('Get round info error:', error);
      return null;
    }
  }

  /**
   * Get cUSD token address from contract
   */
  async getCUSDAddress(): Promise<Address | null> {
    try {
      const contractAddress = getContractAddress(this.config);
      if (contractAddress === zeroAddress) {
        return null;
      }

      const contractABI = getContractABI(this.config);
      if (contractABI.length === 0) {
        return null;
      }

      const cUSDAddress = (await readContract(this.config, {
        address: contractAddress,
        abi: contractABI,
        functionName: 'cUSD',
        args: [],
      })) as unknown as Address;

      return cUSDAddress;
    } catch (error) {
      console.error('Get cUSD address error:', error);
      return null;
    }
  }

  /**
   * Check and approve cUSD spending if needed
   * @param amount Amount to approve (in wei)
   */
  async approveCUSD(amount: bigint): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      const account = getAccount(this.config);
      if (!account.address) {
        return {
          success: false,
          error: 'Wallet not connected'
        };
      }

      const cUSDAddress = await this.getCUSDAddress();
      if (!cUSDAddress || cUSDAddress === zeroAddress) {
        return {
          success: false,
          error: 'cUSD address not found'
        };
      }

      const contractAddress = getContractAddress(this.config);
      if (contractAddress === zeroAddress) {
        return {
          success: false,
          error: 'Contract address not found for current network'
        };
      }

      // Check current allowance
      const currentAllowance = await readContract(this.config, {
        address: cUSDAddress,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [account.address, contractAddress],
      }) as bigint;

      // If allowance is sufficient, no need to approve
      if (currentAllowance >= amount) {
        return {
          success: true
        };
      }

      // Approve the contract to spend cUSD (approve max to avoid multiple approvals)
      const hash = await writeContract(this.config, {
        address: cUSDAddress,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [contractAddress, maxUint256],
      });

      // Wait for transaction receipt
      const receipt = await waitForTransactionReceipt(this.config, { hash });

      if (receipt.status === 'success') {
        return {
          success: true,
          txHash: hash
        };
      } else {
        return {
          success: false,
          error: 'Approval transaction failed or was reverted'
        };
      }
    } catch (error: any) {
      console.error('Approve cUSD error:', error);
      return {
        success: false,
        error: error.message || 'Failed to approve cUSD'
      };
    }
  }

  /**
   * Get cUSD balance for a user
   */
  async getCUSDBalance(userAddress: string): Promise<bigint> {
    try {
      const cUSDAddress = await this.getCUSDAddress();
      if (!cUSDAddress || cUSDAddress === zeroAddress) {
        return 0n;
      }

      const balance = await readContract(this.config, {
        address: cUSDAddress,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [userAddress as Address],
      }) as bigint;

      return balance;
    } catch (error) {
      console.error('Get cUSD balance error:', error);
      return 0n;
    }
  }

  /**
   * Place a prediction on a round (using cUSD)
   * @param roundId The round ID to predict on
   * @param predictsHigher True for Higher volatility, false for Lower
   * @param stakeAmount Amount in cUSD to stake (as string, will be converted to wei)
   */
  async placePrediction(
    roundId: number,
    predictsHigher: boolean,
    stakeAmount: string // Amount in cUSD (will be converted to wei)
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      const account = getAccount(this.config);
      if (!account.address) {
        return {
          success: false,
          error: 'Wallet not connected'
        };
      }

      const stakeAmountWei = parseEther(stakeAmount);

      // First, approve cUSD spending
      const approvalResult = await this.approveCUSD(stakeAmountWei);
      if (!approvalResult.success) {
        return approvalResult;
      }

      const contractAddress = getContractAddress(this.config);
      if (contractAddress === zeroAddress) {
        return {
          success: false,
          error: 'Contract address not found for current network'
        };
      }

      const contractABI = getContractABI(this.config);
      if (contractABI.length === 0) {
        return {
          success: false,
          error: 'Contract ABI not found for current network'
        };
      }

      // Place prediction with cUSD
      const hash = await writeContract(this.config, {
        address: contractAddress,
        abi: contractABI,
        functionName: 'placePrediction',
        args: [BigInt(roundId), predictsHigher, stakeAmountWei],
      });

      // Wait for transaction receipt
      const receipt = await waitForTransactionReceipt(this.config, { hash });

      if (receipt.status === 'success') {
        return {
          success: true,
          txHash: hash
        };
      } else {
        return {
          success: false,
          error: 'Transaction failed or was reverted'
        };
      }
    } catch (error: any) {
      console.error('Place prediction error:', error);
      return {
        success: false,
        error: error.message || 'Failed to place prediction'
      };
    }
  }

  /**
   * Claim winnings for settled rounds
   * @param roundIds Array of round IDs to claim
   */
  async claimWinnings(
    roundIds: number[]
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      const account = getAccount(this.config);
      if (!account.address) {
        return {
          success: false,
          error: 'Wallet not connected'
        };
      }

      const contractAddress = getContractAddress(this.config);
      if (contractAddress === zeroAddress) {
        return {
          success: false,
          error: 'Contract address not found for current network'
        };
      }

      const contractABI = getContractABI(this.config);
      if (contractABI.length === 0) {
        return {
          success: false,
          error: 'Contract ABI not found for current network'
        };
      }

      const hash = await writeContract(this.config, {
        address: contractAddress,
        abi: contractABI,
        functionName: 'claimWinnings',
        args: [roundIds.map(id => BigInt(id))],
      });

      // Wait for transaction receipt
      const receipt = await waitForTransactionReceipt(this.config, { hash });

      if (receipt.status === 'success') {
        return {
          success: true,
          txHash: hash
        };
      } else {
        return {
          success: false,
          error: 'Transaction failed or was reverted'
        };
      }
    } catch (error: any) {
      console.error('Claim winnings error:', error);
      return {
        success: false,
        error: error.message || 'Failed to claim winnings'
      };
    }
  }

  /**
   * Get user's prediction for a specific round
   */
  async getUserPrediction(roundId: number, userAddress: string): Promise<UserPrediction | null> {
    try {
      const contractAddress = getContractAddress(this.config);
      if (contractAddress === zeroAddress) {
        return null;
      }

      const contractABI = getContractABI(this.config);
      if (contractABI.length === 0) {
        return null;
      }

      const result = await readContract(this.config, {
        address: contractAddress,
        abi: contractABI,
        functionName: 'getUserPrediction',
        args: [BigInt(roundId), userAddress as Address],
      }) as any;

      return {
        hasPredictedInRound: result[0],
        amount: result[1],
        predictsHigher: result[2],
        hasClaimedReward: result[3]
      };
    } catch (error) {
      console.error('Get user prediction error:', error);
      return null;
    }
  }

  /**
   * Get user's rounds with predictions
   */
  async getUserRounds(userAddress: string, startRound: number, endRound: number): Promise<number[]> {
    try {
      const contractAddress = getContractAddress(this.config);
      if (contractAddress === zeroAddress) {
        return [];
      }

      const contractABI = getContractABI(this.config);
      if (contractABI.length === 0) {
        return [];
      }

      const roundIds = await readContract(this.config, {
        address: contractAddress,
        abi: contractABI,
        functionName: 'getUserRounds',
        args: [userAddress as Address, BigInt(startRound), BigInt(endRound)],
      }) as bigint[];

      return roundIds.map(id => Number(id));
    } catch (error) {
      console.error('Get user rounds error:', error);
      return [];
    }
  }

  /**
   * Get contract owner address
   */
  async getOwner(): Promise<string | null> {
    try {
      const contractAddress = getContractAddress(this.config);
      if (contractAddress === zeroAddress) {
        return null;
      }

      const contractABI = getContractABI(this.config);
      if (contractABI.length === 0) {
        return null;
      }

      const owner = await readContract(this.config, {
        address: contractAddress,
        abi: contractABI,
        functionName: 'owner',
        args: [],
      }) as unknown as Address;

      return owner as string;
    } catch (error) {
      console.error('Get owner error:', error);
      return null;
    }
  }

  /**
   * Get contract configuration
   */
  async getContractConfig(): Promise<{
    feeRate: bigint;
    riskThreshold: bigint;
    lockTime: bigint;
    oracleAddress: string;
    feeReceiver: string;
  } | null> {
    try {
      const contractAddress = getContractAddress(this.config);
      if (contractAddress === zeroAddress) {
        return null;
      }

      const contractABI = getContractABI(this.config);
      if (contractABI.length === 0) {
        return null;
      }

      const [feeRate, riskThreshold, lockTime, oracleAddress, feeReceiver] = await Promise.all([
        readContract(this.config, {
          address: contractAddress,
          abi: contractABI,
          functionName: 'feeRate',
          args: [],
        }) as unknown as Promise<bigint>,
        readContract(this.config, {
          address: contractAddress,
          abi: contractABI,
          functionName: 'riskThreshold',
          args: [],
        }) as unknown as Promise<bigint>,
        readContract(this.config, {
          address: contractAddress,
          abi: contractABI,
          functionName: 'lockTime',
          args: [],
        }) as unknown as Promise<bigint>,
        readContract(this.config, {
          address: contractAddress,
          abi: contractABI,
          functionName: 'oracleAddress',
          args: [],
        }) as unknown as Promise<Address>,
        readContract(this.config, {
          address: contractAddress,
          abi: contractABI,
          functionName: 'feeReceiver',
          args: [],
        }) as unknown as Promise<Address>,
      ]);

      return {
        feeRate,
        riskThreshold,
        lockTime,
        oracleAddress: oracleAddress as string,
        feeReceiver: feeReceiver as string
      };
    } catch (error) {
      console.error('Get contract config error:', error);
      return null;
    }
  }
}

/**
 * Get risk label based on risk level
 * @param riskLevel 0 = Low, 1 = Medium, 2 = High
 */
export const getRiskLabel = (riskLevel: number): string => {
  switch (riskLevel) {
    case 0:
      return 'Low Risk';
    case 1:
      return 'Medium Risk';
    case 2:
      return 'High Risk';
    default:
      return 'Unknown Risk';
  }
};

/**
 * Get risk threshold percentage based on risk level
 * @param riskLevel 0 = Low, 1 = Medium, 2 = High
 */
export const getRiskThreshold = (riskLevel: number): number => {
  switch (riskLevel) {
    case 0:
      return 5.0; // Low risk: 5% volatility threshold
    case 1:
      return 10.0; // Medium risk: 10% volatility threshold
    case 2:
      return 15.0; // High risk: 15% volatility threshold
    default:
      return 10.0; // Default to medium risk threshold
  }
};

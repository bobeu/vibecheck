// @ts-ignore - ethers types may not be fully recognized by TypeScript
import { ethers } from 'ethers';
import { getNetworkConfig } from './config';
import contractArtifacts from '@/constants/contract-artifacts.json';
import VolatilityVanguardABI from '../abis/VolatilityVanguardABI.json';
import { zeroAddress, parseEther, formatEther } from 'viem';

const VOLATILITY_VANGUARD_ADDRESS = contractArtifacts.contracts?.VolatilityVanguard?.address || zeroAddress;

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

class VolatilityVanguardService {
  private contract: ethers.Contract | null = null;
  private provider: ethers.providers.JsonRpcProvider | null = null;

  constructor() {
    // Only initialize provider on client side
    if (typeof window !== 'undefined') {
      const config = getNetworkConfig();
      this.provider = new ethers.providers.JsonRpcProvider(config.rpcUrl);
    }
  }

  private getContract(): ethers.Contract | null {
    if (!this.provider) {
      console.warn('Provider not initialized. This method should only be called on the client side.');
      return null;
    }
    if (!this.contract) {
      this.contract = new ethers.Contract(
        VOLATILITY_VANGUARD_ADDRESS,
        VolatilityVanguardABI,
        this.provider
      );
    }
    return this.contract;
  }

  private getContractWithSigner(signer: ethers.Signer): ethers.Contract {
    return new ethers.Contract(
      VOLATILITY_VANGUARD_ADDRESS,
      VolatilityVanguardABI,
      signer
    );
  }

  /**
   * Get current round ID
   */
  async getCurrentRoundId(): Promise<number> {
    try {
      const contract = this.getContract();
      if (!contract) {
        return 0;
      }
      const roundId = await contract.currentRoundId();
      return roundId.toNumber();
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
      if (VOLATILITY_VANGUARD_ADDRESS === zeroAddress) {
        return null;
      }
      
      const contract = this.getContract();
      if (!contract) {
        return null;
      }
      
      const result = await contract.getRoundInfo(roundId);
      
      return {
        id: result[0],
        startTime: result[1],
        lockTime: result[2],
        closeTime: result[3],
        isSettled: result[4],
        totalPool: result[5],
        totalHigherStaked: result[6],
        totalLowerStaked: result[7],
        result: result[8]
      };
    } catch (error: any) {
      console.warn('Get round info error:', error);
      return null;
    }
  }

  /**
   * Place a prediction on a round (payable with CELO)
   * @param roundId The round ID to predict on
   * @param predictsHigher True for Higher volatility, false for Lower
   * @param stakeAmount Amount in CELO to stake (in wei)
   * @param signer The signer for the transaction
   */
  async placePrediction(
    roundId: number,
    predictsHigher: boolean,
    stakeAmount: string, // Amount in CELO (will be converted to wei)
    signer: ethers.Signer
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      const contract = this.getContractWithSigner(signer);
      
      // Convert stake amount to wei
      const stakeAmountWei = parseEther(stakeAmount);
      
      // Place prediction with native CELO transfer
      const tx = await contract.placePrediction(roundId, predictsHigher, {
        value: stakeAmountWei.toString(),
        gasLimit: 300000
      });

      const receipt = await tx.wait();
      
      return {
        success: true,
        txHash: receipt.transactionHash
      };
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
   * @param signer The signer for the transaction
   */
  async claimWinnings(
    roundIds: number[],
    signer: ethers.Signer
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      const contract = this.getContractWithSigner(signer);
      
      const tx = await contract.claimWinnings(roundIds, {
        gasLimit: 500000
      });

      const receipt = await tx.wait();
      
      return {
        success: true,
        txHash: receipt.transactionHash
      };
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
      const contract = this.getContract();
      if (!contract) {
        return null;
      }
      
      const result = await contract.getUserPrediction(roundId, userAddress);
      
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
      const contract = this.getContract();
      if (!contract) {
        return [];
      }
      
      const roundIds = await contract.getUserRounds(userAddress, startRound, endRound);
      
      return roundIds.map((id: ethers.BigNumber) => id.toNumber());
    } catch (error) {
      console.error('Get user rounds error:', error);
      return [];
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
      const contract = this.getContract();
      if (!contract) {
        return null;
      }
      
      const [feeRate, riskThreshold, lockTime, oracleAddress, feeReceiver] = await Promise.all([
        contract.feeRate(),
        contract.riskThreshold(),
        contract.lockTime(),
        contract.oracleAddress(),
        contract.feeReceiver()
      ]);
      
      return {
        feeRate,
        riskThreshold,
        lockTime,
        oracleAddress,
        feeReceiver
      };
    } catch (error) {
      console.error('Get contract config error:', error);
      return null;
    }
  }
}

export const volatilityVanguardService = new VolatilityVanguardService();

import { ethers } from 'ethers';
import { getNetworkConfig } from './config';
import VolatilityVanguardABI from '../abis/VolatilityVanguardABI.json';
import { VOLATILITY_VANGUARD_ADDRESS } from '../contracts/volatilityVanguardAddress';

export interface PredictionData {
  id: number;
  user: string;
  token: string;
  impliedRiskLevel: number;
  predictedHigher: boolean;
  startPrice: string;
  startTime: number;
  poolId: number;
  resolved: boolean;
  won: boolean;
}

export interface PoolData {
  poolId: number;
  totalAmount: string;
  higherAmount: string;
  lowerAmount: string;
  resolved: boolean;
  higherPercentage: number;
  lowerPercentage: number;
}

/**
 * Maps the VibeCheck score to a simplified risk level for the contract.
 * @param score - The VibeCheck Vibrancy Score (0-100).
 * @returns 0 (Low), 1 (Medium), or 2 (High).
 */
export function mapScoreToImpliedRisk(score: number): number {
  if (score >= 80) return 0; // Low Risk (Max 5% expected change)
  if (score >= 50) return 1; // Medium Risk (Max 15% expected change)
  return 2; // High Risk (> 15% expected change)
}

export function getRiskLabel(riskLevel: number): string {
  switch (riskLevel) {
    case 0: return 'Low Risk (≤5% volatility)';
    case 1: return 'Medium Risk (≤15% volatility)';
    case 2: return 'High Risk (>15% volatility)';
    default: return 'Unknown Risk';
  }
}

export function getRiskThreshold(riskLevel: number): number {
  switch (riskLevel) {
    case 0: return 5;   // 5%
    case 1: return 15;  // 15%
    case 2: return 15;  // 15%
    default: return 15;
  }
}

class VolatilityVanguardService {
  private contract: ethers.Contract | null = null;
  private provider: ethers.providers.JsonRpcProvider;

  constructor() {
    const config = getNetworkConfig();
    this.provider = new ethers.providers.JsonRpcProvider(config.rpcUrl);
  }

  private getContract(): ethers.Contract {
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

  async placePrediction(
    tokenAddress: string,
    vibrancyScore: number,
    predictedHigher: boolean,
    signer: ethers.Signer
  ): Promise<{ success: boolean; txHash?: string; error?: string; predictionId?: number }> {
    try {
      const contract = this.getContractWithSigner(signer);
      const impliedRiskLevel = mapScoreToImpliedRisk(vibrancyScore);
      
      // First approve cUSD spending
      const cUSDAddress = await contract.cUSD();
      const cUSDContract = new ethers.Contract(
        cUSDAddress,
        [
          'function approve(address spender, uint256 amount) external returns (bool)',
          'function allowance(address owner, address spender) external view returns (uint256)'
        ],
        signer
      );

      const predictionCost = ethers.utils.parseUnits('0.1', 18);
      const userAddress = await signer.getAddress();
      const allowance = await cUSDContract.allowance(userAddress, VOLATILITY_VANGUARD_ADDRESS);

      if (allowance.lt(predictionCost)) {
        const approveTx = await cUSDContract.approve(VOLATILITY_VANGUARD_ADDRESS, predictionCost);
        await approveTx.wait();
      }

      // Place prediction
      const tx = await contract.placePrediction(
        tokenAddress,
        impliedRiskLevel,
        predictedHigher,
        {
          gasLimit: 300000
        }
      );

      const receipt = await tx.wait();
      
      // Extract prediction ID from events
      const event = receipt.events?.find((e: any) => e.event === 'PredictionPlaced');
      const predictionId = event?.args?.predictionId?.toNumber();

      return {
        success: true,
        txHash: receipt.transactionHash,
        predictionId
      };
    } catch (error: any) {
      console.error('Place prediction error:', error);
      return {
        success: false,
        error: error.message || 'Failed to place prediction'
      };
    }
  }

  async resolvePrediction(
    predictionId: number,
    signer: ethers.Signer
  ): Promise<{ success: boolean; txHash?: string; error?: string; payout?: string }> {
    try {
      const contract = this.getContractWithSigner(signer);
      
      const tx = await contract.resolvePrediction(predictionId, {
        gasLimit: 500000
      });

      const receipt = await tx.wait();
      
      // Extract payout from events
      const event = receipt.events?.find((e: any) => e.event === 'PredictionResolved');
      const payout = event?.args?.payout ? ethers.utils.formatUnits(event.args.payout, 18) : '0';

      return {
        success: true,
        txHash: receipt.transactionHash,
        payout
      };
    } catch (error: any) {
      console.error('Resolve prediction error:', error);
      return {
        success: false,
        error: error.message || 'Failed to resolve prediction'
      };
    }
  }

  async getPoolInfo(tokenAddress: string, vibrancyScore: number): Promise<PoolData | null> {
    try {
      const contract = this.getContract();
      const impliedRiskLevel = mapScoreToImpliedRisk(vibrancyScore);
      
      const result = await contract.getPoolInfo(tokenAddress, impliedRiskLevel);
      
      const totalAmount = ethers.utils.formatUnits(result.totalAmount, 18);
      const higherAmount = ethers.utils.formatUnits(result.higherAmount, 18);
      const lowerAmount = ethers.utils.formatUnits(result.lowerAmount, 18);
      
      const total = parseFloat(totalAmount);
      const higher = parseFloat(higherAmount);
      const lower = parseFloat(lowerAmount);
      
      return {
        poolId: result.poolId.toNumber(),
        totalAmount,
        higherAmount,
        lowerAmount,
        resolved: result.resolved,
        higherPercentage: total > 0 ? (higher / total) * 100 : 0,
        lowerPercentage: total > 0 ? (lower / total) * 100 : 0
      };
    } catch (error) {
      console.error('Get pool info error:', error);
      return null;
    }
  }

  async getUserPredictions(userAddress: string): Promise<PredictionData[]> {
    try {
      const contract = this.getContract();
      const predictionIds = await contract.getUserPredictions(userAddress);
      
      const predictions: PredictionData[] = [];
      
      for (const id of predictionIds) {
        const prediction = await contract.predictions(id);
        predictions.push({
          id: id.toNumber(),
          user: prediction.user,
          token: prediction.token,
          impliedRiskLevel: prediction.impliedRiskLevel,
          predictedHigher: prediction.predictedHigher,
          startPrice: ethers.utils.formatUnits(prediction.startPrice, 18),
          startTime: prediction.startTime.toNumber(),
          poolId: prediction.poolId.toNumber(),
          resolved: prediction.resolved,
          won: prediction.won
        });
      }
      
      return predictions;
    } catch (error) {
      console.error('Get user predictions error:', error);
      return [];
    }
  }

  async getPrediction(predictionId: number): Promise<PredictionData | null> {
    try {
      const contract = this.getContract();
      const prediction = await contract.predictions(predictionId);
      
      if (prediction.user === ethers.constants.AddressZero) {
        return null;
      }
      
      return {
        id: predictionId,
        user: prediction.user,
        token: prediction.token,
        impliedRiskLevel: prediction.impliedRiskLevel,
        predictedHigher: prediction.predictedHigher,
        startPrice: ethers.utils.formatUnits(prediction.startPrice, 18),
        startTime: prediction.startTime.toNumber(),
        poolId: prediction.poolId.toNumber(),
        resolved: prediction.resolved,
        won: prediction.won
      };
    } catch (error) {
      console.error('Get prediction error:', error);
      return null;
    }
  }
}

export const volatilityVanguardService = new VolatilityVanguardService();

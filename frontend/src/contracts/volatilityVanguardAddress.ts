import contractArtifacts from '@/constants/contract-artifacts.json';
import { zeroAddress, type Address } from 'viem';

export interface NetworkContracts {
  networkName: string;
  chainId: number;
  contracts: {
    VolatilityVanguard: {
      address: string;
      abi: any[];
    };
  };
}

export interface ContractArtifacts {
  networks: Record<number, NetworkContracts>;
}

/**
 * Get contract address for a specific chainId
 * @param chainId The chain ID (11142220 for Sepolia, 42220 for Mainnet)
 * @returns Contract address or zeroAddress if not found
 */
export function getVolatilityVanguardAddress(chainId: number): Address {
  const artifacts = contractArtifacts as ContractArtifacts;
  const network = artifacts.networks?.[chainId];
  
  if (!network || !network.contracts?.VolatilityVanguard?.address) {
    console.warn(`VolatilityVanguard not found for chainId: ${chainId}`);
    return zeroAddress;
  }
  
  return network.contracts.VolatilityVanguard.address as Address;
}

/**
 * Get contract ABI for VolatilityVanguard
 * @param chainId The chain ID (11142220 for Sepolia, 42220 for Mainnet)
 * @returns Contract ABI or empty array if not found
 */
export function getVolatilityVanguardABI(chainId: number): any[] {
  const artifacts = contractArtifacts as ContractArtifacts;
  const network = artifacts.networks?.[chainId];
  
  if (!network || !network.contracts?.VolatilityVanguard?.abi) {
    console.warn(`VolatilityVanguard ABI not found for chainId: ${chainId}`);
    return [];
  }
  
  return network.contracts.VolatilityVanguard.abi;
}

/**
 * Get all available network chainIds
 * @returns Array of chain IDs
 */
export function getAvailableChainIds(): number[] {
  const artifacts = contractArtifacts as ContractArtifacts;
  return Object.keys(artifacts.networks || {}).map(id => Number(id));
}

/**
 * Get network info for a specific chainId
 * @param chainId The chain ID
 * @returns Network info or null if not found
 */
export function getNetworkInfo(chainId: number): NetworkContracts | null {
  const artifacts = contractArtifacts as ContractArtifacts;
  return artifacts.networks?.[chainId] || null;
}

// Legacy export for backward compatibility (uses first available network)
const artifacts = contractArtifacts as ContractArtifacts;
const firstNetwork = Object.values(artifacts.networks || {})[0];
export const VOLATILITY_VANGUARD_ADDRESS = firstNetwork?.contracts?.VolatilityVanguard?.address || zeroAddress;
export const CHAIN_ID = firstNetwork?.chainId || 0;
export const NETWORK_NAME = firstNetwork?.networkName || '';

/**
 * Mock cUSD Contract Configuration
 * 
 * This file contains the deployed MockERC20 contract details for development/testing.
 * The contract is used when testing with external wallets (MetaMask, etc.) instead of MiniPay/Farcaster.
 */

export interface MockCUSDConfig {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  chainId: number;
}

/**
 * Mock cUSD contract configuration for Celo Sepolia Testnet
 */
export const MOCK_CUSD_SEPOLIA: MockCUSDConfig = {
  address: '0xb18c9d7d5c6cd917bb0aa96c588116051b41c41a',
  name: 'Mock cUSD',
  symbol: 'mcUSD',
  decimals: 18,
  chainId: 11142220, // Celo Sepolia
};

/**
 * Mock cUSD contract configuration for Celo Mainnet
 * (Should not be used in production, but available for testing)
 */
export const MOCK_CUSD_MAINNET: MockCUSDConfig = {
  address: '0x0000000000000000000000000000000000000000', // Not deployed yet
  name: 'Mock cUSD',
  symbol: 'mcUSD',
  decimals: 18,
  chainId: 42220, // Celo Mainnet
};

/**
 * Get Mock cUSD configuration for a given chain ID
 */
export const getMockCUSDConfig = (chainId: number): MockCUSDConfig | null => {
  switch (chainId) {
    case 11142220: // Celo Sepolia
      return MOCK_CUSD_SEPOLIA;
    case 42220: // Celo Mainnet
      return MOCK_CUSD_MAINNET;
    default:
      return null;
  }
};

/**
 * Get Mock cUSD address for a given chain ID
 */
export const getMockCUSDAddress = (chainId: number): string | null => {
  const config = getMockCUSDConfig(chainId);
  return config?.address && config.address !== '0x0000000000000000000000000000000000000000' 
    ? config.address 
    : null;
};


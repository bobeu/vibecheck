// @ts-ignore - ethers types may not be fully recognized by TypeScript
import { ethers } from 'ethers';

// Network configurations (using Wagmi for actual network interactions)
const CELO_MAINNET_CONFIG = {
  chainId: 42220,
  name: 'Celo',
  ticker: 'CELO',
  atomicUnit: 'wei',
  decimals: 18,
  rpcUrl: 'https://forno.celo.org',
  explorerUrl: 'https://explorer.celo.org'
};

const CELO_TESTNET_CONFIG = {
  chainId: 11142220,
  name: 'Celo Sepolia',
  ticker: 'CELO',
  atomicUnit: 'wei',
  decimals: 18,
  rpcUrl: 'https://forno.celo-sepolia.celo-testnet.org',
  explorerUrl: 'https://celo-sepolia.blockscout.com'
};

// Initialize providers only on client side
let providers: { [chainId: number]: ethers.providers.JsonRpcProvider } = {};

if (typeof window !== 'undefined') {
  providers[CELO_MAINNET_CONFIG.chainId] = new ethers.providers.JsonRpcProvider(CELO_MAINNET_CONFIG.rpcUrl);
  providers[CELO_TESTNET_CONFIG.chainId] = new ethers.providers.JsonRpcProvider(CELO_TESTNET_CONFIG.rpcUrl);
}

export { providers };

const getNetworkConfig = () => {
  return CELO_TESTNET_CONFIG;
};

export function formatTokenAmount(amount: string | number, precision: number = 18): string {
  if (
    typeof amount !== 'number' && typeof amount !== 'string'
  ) {
    return '0';
  }
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (Number.isNaN(num)) {
    return '0';
  }
  try {
    const amountStr = num.toString();
    if (amountStr.indexOf('.') === -1) {
      return amountStr;
    }
    const decimals = amountStr.split('.')?.[1]?.length || 0;
    if (decimals > precision) {
      if (precision === undefined || Number.isNaN(precision)) {
        return (Math.floor(num * Math.pow(10, 18)) / Math.pow(10, 18))
          .toFixed(18)
          .replace(/\.?0+$/, '');
      }
      return (
        Math.floor(num * Math.pow(10, precision)) / Math.pow(10, precision)
      ).toFixed(precision);
    }
    return amountStr;
  } catch (err) {
    return '0';
  }
}

export const scientificToDecimal = (num: string | number): string => {
  const numStr = typeof num === 'number' ? num.toString() : num;
  if (!/e/i.test(numStr)) {
    return numStr;
  }
  const [base, exponent] = numStr.split(/e/i);
  if (exponent) {
    const e = parseInt(exponent, 10);
    if (e < 0) {
      return '0.' + '0'.repeat(Math.abs(e) - 1) + base.replace('.', '');
    }
  }
  return numStr;
};

export const getCeloBalance = async (walletAddress: string, chainId?: number): Promise<string> => {
  try {
    const currentConfig = getNetworkConfig();
    const targetChainId = chainId || currentConfig.chainId;
    
    const provider = providers[targetChainId];
    if (!provider) {
      return '0';
    }

    if (!isValidAddress(walletAddress)) {
      return '0';
    }

    const balance = await provider.getBalance(walletAddress);
    return ethers.utils.formatEther(balance);
  } catch (error) {
    return '0';
  }
};

export const isValidAddress = (address: string): boolean => {
  try {
    return ethers.utils.isAddress(address);
  } catch {
    return false;
  }
};

export default {
  providers,
  isValidAddress,
  getCeloBalance,
  formatTokenAmount,
  scientificToDecimal,
};
import { getMockCUSDAddress } from '@/contracts/mockCUSD';
import { firebaseService } from './firebaseService';
import { isExternalWallet } from './wagmi';
import { getPublicClient } from '@wagmi/core';
import { readContract, writeContract, waitForTransactionReceipt, simulateContract } from '@wagmi/core';
import { erc20Abi, parseUnits, formatUnits, type Address, zeroAddress } from 'viem';
import { type Config } from "wagmi";

// Production-ready payment service for cUSD transactions
export interface PaymentResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
}

export interface WatchlistItem {
  tokenId: string;
  name: string;
  addedAt: string;
  isPremiumSlot?: boolean;
}

export interface NetworkProps {
  chainId: number;
  account: Address;
  config: Config;
}

export interface PurchaseReport extends NetworkProps {
  tokenSymbol: string;
}

class PaymentService {
  // private mockDelay = (ms: number = 3000) => 
    // new Promise(resolve => setTimeout(resolve, ms));

  // Check if we should use mock cUSD (for external wallets in development)
  private shouldUseMockCUSD(): boolean {
    return isExternalWallet();
  }

  // Production cUSD payment for reports (1 cUSD)
  async purchaseReport(
    {
      account,
      chainId,
      config,
      tokenSymbol
    }: PurchaseReport
  ): Promise<PaymentResult> {
    try {
      // Use mock cUSD if in external wallet context, otherwise use real cUSD
      // const paymentResult = await this.processCUSDPayment(1, 'report_purchase');
      const paymentResult = await this.processCUSDPayment(1, chainId, account, config);
      
      if (paymentResult.success && paymentResult.transactionHash) {
        // Store in Firebase
        await firebaseService.addPurchasedReport(tokenSymbol, paymentResult.transactionHash);
      }

      return paymentResult;
    } catch (error) {
      console.error('Payment service error:', error);
      return {
        success: false,
        error: 'Payment service temporarily unavailable. Please try again later.'
      };
    }
  }

  // Production premium watchlist purchase (3 cUSD)
  async purchasePremiumWatchlist({ chainId, account, config }: NetworkProps): Promise<PaymentResult> {
    try {
      // Use mock cUSD if in external wallet context, otherwise use real cUSD
      const paymentResult = await this.processCUSDPayment(3, chainId, account, config);
      
      if (paymentResult.success && paymentResult.transactionHash) {
        // Enable premium in Firebase
        await firebaseService.setPremiumStatus(true, paymentResult.transactionHash);
      }

      return paymentResult;
    } catch (error) {
      console.error('Premium upgrade error:', error);
      return {
        success: false,
        error: 'Upgrade service temporarily unavailable. Please try again later.'
      };
    }
  }

  // Mint mock cUSD for testing (only available in external wallet context)
  async mintMockCUSD(config: Config, account: Address, amount: number = 100): Promise<PaymentResult> {
    try {
      // Only work on client side
      if (typeof window === 'undefined') {
        return {
          success: false,
          error: 'Mint service is only available in the browser'
        };
      }

      // Only allow minting in external wallet context (development mode)
      if (!this.shouldUseMockCUSD()) {
        return {
          success: false,
          error: 'Mock cUSD minting is only available in external wallet context (development mode)'
        };
      }

      const publicClient = getPublicClient(config);
      if (!publicClient) {
        return {
          success: false,
          error: 'Unable to connect to blockchain. Please check your network connection.'
        };
      }

      const chainId = await publicClient.getChainId();
      const mockCUSDAddress = getMockCUSDAddress(chainId);

      if(!mockCUSDAddress) {
        return {
          success: false,
          error: `Mock cUSD contract not configured for this network (Chain ID: ${chainId}). Please deploy a MockERC20 contract or set NEXT_PUBLIC_MOCK_CUSD_ADDRESS_${chainId === 11142220 ? 'SEPOLIA' : 'MAINNET'} environment variable.`
        };
      }

      const amountInWei = parseUnits(amount.toString(), 18);

      // MockERC20 ABI - includes mint function
      const mockERC20Abi = [
        ...erc20Abi,
        {
          name: 'mint',
          type: 'function',
          stateMutability: 'nonpayable',
          inputs: [
            { name: 'to', type: 'address' },
            { name: 'amount', type: 'uint256' }
          ],
          outputs: []
        }
      ] as const;

      // Simulate the mint transaction
      try {
        await simulateContract(config, {
          address: mockCUSDAddress as Address,
          abi: mockERC20Abi,
          functionName: 'mint',
          args: [account, amountInWei],
          account: account,
        });
      } catch (simulateError: any) {
        console.error('Mint simulation failed:', simulateError);
        return {
          success: false,
          error: simulateError?.message || 'Failed to simulate mint transaction. Please check the mock cUSD contract.'
        };
      }

      // Execute the mint
      const hash = await writeContract(config, {
        address: mockCUSDAddress as Address,
        abi: mockERC20Abi,
        functionName: 'mint',
        args: [account, amountInWei],
        account: account,
      });

      // Wait for transaction receipt
      const receipt = await Promise.race([
        waitForTransactionReceipt(config, { hash }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Transaction timeout')), 120000)
        )
      ]) as any;

      if (receipt && receipt.status === 'success') {
        return {
          success: true,
          transactionHash: hash
        };
      } else {
        return {
          success: false,
          error: 'Mint transaction failed or was reverted'
        };
      }
    } catch (error: any) {
      console.error('Mock cUSD mint error:', error);
      
      if (error?.message?.includes('User rejected')) {
        return {
          success: false,
          error: 'Transaction was rejected by user'
        };
      }

      return {
        success: false,
        error: error?.message || 'Failed to mint mock cUSD. Please try again.'
      };
    }
  }

  // Production cUSD payment implementation
  private async processCUSDPayment(amount: number, chainId: number, account: Address, config: Config): Promise<PaymentResult> {
    try {
      // Only work on client side
      if (typeof window === 'undefined') {
        return {
          success: false,
          error: 'Payment service is only available in the browser'
        };
      }

      // 1. Validate user has sufficient cUSD balance
      if (account === zeroAddress) {
        return {
          success: false,
          error: 'Please connect your wallet to make a payment'
        };
      }
            
      // Determine if we should use mock cUSD (for external wallets in development)
      const useMockCUSD = this.shouldUseMockCUSD();
      
      // Get cUSD token address based on context and network
      let cUSDAddress: Address;
      if (useMockCUSD) {
        // Use mock cUSD for external wallets (development mode)
        const mockAddress = getMockCUSDAddress(chainId);
        if(!mockAddress) {
          return {
            success: false,
            error: `Mock cUSD contract not configured for this network (Chain ID: ${chainId}). Please deploy a MockERC20 contract or set the appropriate environment variable.`
          };
        }
        cUSDAddress = mockAddress as Address;
      } else {
        // Use real cUSD for MiniPay/Farcaster (production)
        // Celo Mainnet (42220): 0x765DE816845861e75A25fCA122bb6898B8B1282a
        // Celo Sepolia Testnet (11142220): 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1
        if (chainId === 42220) {
          // Celo Mainnet
          cUSDAddress = '0x765DE816845861e75A25fCA122bb6898B8B1282a' as Address;
        } else if (chainId === 11142220) {
          // Celo Sepolia Testnet
          // cUSDAddress = '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1' as Address;
          cUSDAddress = '0xb18c9d7d5c6cd917bb0aa96c588116051b41c41a' as Address;
        } else {
          return {
            success: false,
            error: `Unsupported network (Chain ID: ${chainId}). Please switch to Celo Mainnet or Celo Sepolia Testnet.`
          };
        }
      }

      const amountInWei = parseUnits(amount.toString(), 18);
      const amountFormatted = amount.toString();

      // Check cUSD balance with error handling
      let balance: bigint;
      try {
        balance = await readContract(config, {
          address: cUSDAddress,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [account],
        }) as bigint;
      } catch (error: any) {
        console.error('Failed to read cUSD balance:', error);
        // If the contract doesn't exist or the call fails, provide a helpful error
        if (error?.message?.includes('returned no data') || error?.message?.includes('not a contract')) {
          return {
            success: false,
            error: `cUSD token not found on this network (Chain ID: ${chainId}). Please switch to Celo Mainnet or Celo Testnet.`
          };
        }
        return {
          success: false,
          error: `Failed to check balance: ${error?.message || 'Unknown error'}. Please try again.`
        };
      }

      const balanceFormatted = formatUnits(balance, 18);

      if (balance < amountInWei) {
        return {
          success: false,
          error: `Insufficient cUSD balance. You have ${parseFloat(balanceFormatted).toFixed(4)} cUSD, but need ${amountFormatted} cUSD.`
        };
      }

      // Get public client for transaction
      const publicClient = await getPublicClient(config);
      if (!publicClient) {
        return {
          success: false,
          error: 'Public client not available. Please ensure your wallet is connected.'
        };
      }

      // Payment recipient address - using a payment contract or treasury address
      // For mock cUSD in development, we can use zero address or a test address
      // For real cUSD, use the configured payment recipient
      let paymentRecipient = process.env.NEXT_PUBLIC_PAYMENT_RECIPIENT_ADDRESS as Address;
      if (paymentRecipient === zeroAddress) {
        console.warn('Payment recipient address not configured. Using default address.');
        // In production, you should have a proper payment recipient address
        return {
          success: false,
          error: 'Payment recipient address not configured. Please contact support.'
        };
      }

      // Simulate the transaction first
      try {
        // console.log('paymentRecipient', paymentRecipient)
        await simulateContract(config, {
          address: cUSDAddress,
          abi: erc20Abi,
          functionName: 'transfer',
          args: [paymentRecipient, amountInWei],
          account: account,
        });
      } catch (simulateError: any) {
        console.error('Transaction simulation failed:', simulateError);
        
        // Provide more specific error messages
        if (simulateError?.message?.includes('returned no data') || simulateError?.message?.includes('not a contract')) {
          return {
            success: false,
            error: `cUSD token contract not found on this network (Chain ID: ${chainId}). Please switch to Celo Mainnet or Celo Testnet.`
          };
        }
        
        if (simulateError?.message?.includes('insufficient funds') || simulateError?.message?.includes('balance')) {
          return {
            success: false,
            error: `Insufficient cUSD balance. You have ${parseFloat(balanceFormatted).toFixed(4)} cUSD, but need ${amountFormatted} cUSD.`
          };
        }
        
        return {
          success: false,
          error: simulateError?.message || 'Transaction simulation failed. Please check your balance and try again.'
        };
      }

      // Execute the transfer
      const hash = await writeContract(config, {
        address: cUSDAddress,
        abi: erc20Abi,
        functionName: 'transfer',
        args: [paymentRecipient, amountInWei],
        account,
      });

      // 3. Monitor transaction confirmation
      // Reuse the publicClient we already have from earlier
      if (!publicClient) {
        return {
          success: false,
          error: 'Public client not available'
        };
      }

      // Wait for transaction receipt with timeout
      const receipt = await Promise.race([
        waitForTransactionReceipt(config, { hash }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Transaction timeout')), 120000) // 2 minute timeout
        )
      ]) as any;

      // 4. Return result with transaction hash
      if (receipt && receipt.status === 'success') {
        return {
          success: true,
          transactionHash: hash
        };
      } else {
        return {
          success: false,
          error: 'Transaction failed or was reverted'
        };
      }
    } catch (error: any) {
      console.error('cUSD payment error:', error);
      
      // Handle specific error cases
      if (error?.message?.includes('User rejected')) {
        return {
          success: false,
          error: 'Transaction was rejected by user'
        };
      }
      
      if (error?.message?.includes('insufficient funds')) {
        return {
          success: false,
          error: 'Insufficient funds for transaction. Please check your cUSD balance.'
        };
      }

      if (error?.message?.includes('timeout')) {
        return {
          success: false,
          error: 'Transaction is taking longer than expected. Please check the transaction status in your wallet.'
        };
      }

      return {
        success: false,
        error: error?.message || 'Payment transaction failed. Please try again.'
      };
    }
  }

  // Check access using Firebase
  async hasAccessToReport(tokenSymbol: string): Promise<boolean> {
    return await firebaseService.hasReportAccess(tokenSymbol);
  }

  // Check premium status using Firebase
  async hasPremiumWatchlist(): Promise<boolean> {
    return await firebaseService.getPremiumStatus();
  }

  // Watchlist operations via Firebase
  async getWatchlist(): Promise<WatchlistItem[]> {
    const items = await firebaseService.getWatchlist();
    return items.map(item => ({
      tokenId: item.tokenId,
      name: item.name,
      addedAt: item.addedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      isPremiumSlot: item.isPremiumSlot
    }));
  }

  async addToWatchlist(tokenId: string, tokenName: string): Promise<boolean> {
    const watchlist = await this.getWatchlist();
    const isPremium = await this.hasPremiumWatchlist();
    
    // Check limits
    if (!isPremium && watchlist.length >= 2) {
      return false; // Free users limited to 2 tokens
    }
    
    if (isPremium && watchlist.length >= 5) {
      return false; // Premium users limited to 5 tokens
    }

    // Check if already exists
    if (watchlist.some(item => item.tokenId === tokenId)) {
      return false;
    }

    return await firebaseService.addToWatchlist(tokenId, tokenName, isPremium);
  }

  async removeFromWatchlist(tokenId: string): Promise<boolean> {
    return await firebaseService.removeFromWatchlist(tokenId);
  }

  // Real-time watchlist subscription
  subscribeToWatchlist(callback: (watchlist: WatchlistItem[]) => void): () => void {
    return firebaseService.subscribeToWatchlist((items) => {
      const formattedItems = items.map(item => ({
        tokenId: item.tokenId,
        name: item.name,
        addedAt: item.addedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        isPremiumSlot: item.isPremiumSlot
      }));
      callback(formattedItems);
    });
  }
}

export const paymentService = new PaymentService();

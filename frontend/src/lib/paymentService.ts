import { firebaseService } from './firebaseService';
import { wagmiConfig } from './wagmi';
import { getAccount, getWalletClient, getPublicClient } from '@wagmi/core';
import { readContract, writeContract, waitForTransactionReceipt, simulateContract } from '@wagmi/core';
import { erc20Abi, parseUnits, formatUnits, type Address, zeroAddress } from 'viem';
import { getNetworkConfig } from './config';

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

class PaymentService {
  private mockDelay = (ms: number = 3000) => 
    new Promise(resolve => setTimeout(resolve, ms));

  // Production cUSD payment for reports (1 cUSD)
  async purchaseReport(tokenSymbol: string): Promise<PaymentResult> {
    try {
      // Use actual MiniPay/cUSD payment
      const paymentResult = await this.processCUSDPayment(1, 'report_purchase');
      
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
  async purchasePremiumWatchlist(): Promise<PaymentResult> {
    try {
      // Use actual MiniPay/cUSD payment
      const paymentResult = await this.processCUSDPayment(3, 'premium_watchlist');
      
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

  // Production cUSD payment implementation
  private async processCUSDPayment(amount: number, purpose: string): Promise<PaymentResult> {
    try {
      // Only work on client side
      if (typeof window === 'undefined') {
        return {
          success: false,
          error: 'Payment service is only available in the browser'
        };
      }

      // 1. Validate user has sufficient cUSD balance
      const account = getAccount(wagmiConfig);
      if (!account.address) {
        return {
          success: false,
          error: 'Please connect your wallet to make a payment'
        };
      }

      const userAddress = account.address as Address;
      
      // Get the actual chain ID from the connected account
      const publicClient = getPublicClient(wagmiConfig);
      if (!publicClient) {
        return {
          success: false,
          error: 'Unable to connect to blockchain. Please check your network connection.'
        };
      }
      
      const chainId = await publicClient.getChainId();
      
      // Get cUSD token address based on actual connected network
      // Celo Mainnet (42220): 0x765DE816845861e75A25fCA122bb6898B8B1282a
      // Celo Sepolia Testnet (11142220): 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1
      // Celo Alfajores Testnet (44787): 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1 (same as Sepolia)
      let cUSDAddress: Address;
      if (chainId === 42220) {
        // Celo Mainnet
        cUSDAddress = '0x765DE816845861e75A25fCA122bb6898B8B1282a' as Address;
      } else if (chainId === 11142220 || chainId === 44787) {
        // Celo Sepolia or Alfajores Testnet
        cUSDAddress = '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1' as Address;
      } else {
        return {
          success: false,
          error: `Unsupported network (Chain ID: ${chainId}). Please switch to Celo Mainnet or Celo Testnet.`
        };
      }

      const amountInWei = parseUnits(amount.toString(), 18);
      const amountFormatted = amount.toString();

      // Check cUSD balance with error handling
      let balance: bigint;
      try {
        balance = await readContract(wagmiConfig, {
          address: cUSDAddress,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [userAddress],
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

      // 2. Initiate transaction with feeCurrency: cUSD
      // Get wallet client for transaction
      const walletClient = await getWalletClient(wagmiConfig);
      if (!walletClient) {
        return {
          success: false,
          error: 'Wallet client not available. Please ensure your wallet is connected.'
        };
      }

      // Payment recipient address - using a payment contract or treasury address
      // For now, using a placeholder - in production, this should be your payment contract address
      const paymentRecipient = process.env.NEXT_PUBLIC_PAYMENT_RECIPIENT_ADDRESS as Address || zeroAddress;

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
        await simulateContract(wagmiConfig, {
          address: cUSDAddress,
          abi: erc20Abi,
          functionName: 'transfer',
          args: [paymentRecipient, amountInWei],
          account: userAddress,
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
      const hash = await writeContract(wagmiConfig, {
        address: cUSDAddress,
        abi: erc20Abi,
        functionName: 'transfer',
        args: [paymentRecipient, amountInWei],
        account: userAddress,
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
        waitForTransactionReceipt(wagmiConfig, { hash }),
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

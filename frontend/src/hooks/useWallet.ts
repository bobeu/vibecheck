import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { useEffect, useState, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { injected } from 'wagmi/connectors';

// Helper function to detect MiniPay
const isMiniPay = (): boolean => {
  if (typeof window === 'undefined') return false
  return !!(window as any).ethereum?.isMiniPay
}

export const useWallet = () => {
  const { toast } = useToast()
  const { address, isConnected, isConnecting, connector } = useAccount()
  const { connect, connectors, isPending, error } = useConnect()
  const { disconnect } = useDisconnect()
  const [isReady, setIsReady] = useState(false)

  // Detect MiniPay
  const miniPayDetected = useMemo(() => {
    if (typeof window === 'undefined') return false
    return isMiniPay()
  }, [])

  // Initialize ready state
  useEffect(() => {
    // Small delay to ensure wagmi is fully initialized
    const timer = setTimeout(() => setIsReady(true), 100)
    return () => clearTimeout(timer)
  }, [])

  // Handle connection errors
  useEffect(() => {
    if (error) {
      let errorMessage = 'Failed to connect wallet'
      
      if (error.message?.includes('User rejected')) {
        errorMessage = 'Connection was rejected by user'
      } else if (error.message?.includes('No connector available')) {
        errorMessage = 'Please use MiniPay or install a Celo-compatible wallet'
      } else if (error.message?.includes('Connector not found')) {
        errorMessage = 'Wallet not found. Please ensure it is installed and unlocked.'
      }
      
      toast({
        title: 'Connection Failed',
        description: errorMessage,
      })
    }
  }, [error, toast])

  // Auto-connect to MiniPay if available
  useEffect(() => {
    if (!isReady || isConnected || isConnecting || typeof window === 'undefined') {
      return
    }

    // Verify window.ethereum exists before connecting
    if (!window.ethereum) {
      return
    }

    // Auto-connect MiniPay when detected
    if (miniPayDetected) {
      // Use injected connector with metaMask target for MiniPay (as per user's example)
      const miniPayConnector = injected({ target: 'metaMask' })
      connect({ connector: miniPayConnector })
      return
    }

    // Don't auto-connect non-MiniPay wallets - let user click button
  }, [isReady, isConnected, isConnecting, connectors, connect, miniPayDetected])

  const connectWallet = async (connectorId?: string) => {
    try {
      const targetConnector = connectorId 
        ? connectors.find(c => c.id === connectorId)
        : connectors.find(c => c.id === 'injected') || connectors[0]

      if (!targetConnector) {
        throw new Error('No wallet connector available')
      }

      await connect({ connector: targetConnector })
      
      toast({
        title: 'Success',
        description: 'Wallet connected successfully!',
      })
    } catch (error: any) {
      console.error('Connect wallet error:', error)
      // Error handling is done in useEffect above
    }
  }

  const disconnectWallet = async () => {
    try {
      await disconnect()
      toast({
        title: 'Success',
        description: 'Wallet disconnected successfully!',
      })
    } catch (error: any) {
      console.error('Disconnect wallet error:', error)
      toast({
        title: 'Error',
        description: 'Failed to disconnect wallet',
      })
    }
  }

  const formatAddress = (address: string): string => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  return {
    // Connection state
    address,
    isConnected,
    isConnecting: isConnecting || isPending,
    isReady,
    connector,
    
    // Available connectors
    connectors,
    
    // Actions
    connectWallet,
    disconnectWallet,
    
    // Utilities
    formatAddress: address ? () => formatAddress(address) : () => '',
  }
}

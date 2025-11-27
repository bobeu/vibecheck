import React, { useMemo } from 'react';
import { Wallet, LogOut, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useWallet } from '@/hooks/useWallet'
import { useBalance } from 'wagmi'
import { isMiniPay } from '@/lib/wagmi'

// Helper function to detect Farcaster context
const isFarcaster = (): boolean => {
  if (typeof window === 'undefined') return false
  // Check for Farcaster user agent or query parameters
  const userAgent = window.navigator.userAgent.toLowerCase()
  const urlParams = new URLSearchParams(window.location.search)
  return (
    userAgent.includes('farcaster') ||
    urlParams.has('farcaster') ||
    urlParams.get('mode') === 'farcaster' ||
    (window as any).farcaster !== undefined
  )
}

const WalletConnect: React.FC = () => {
  const { 
    address, 
    isConnected, 
    isConnecting, 
    connectWallet, 
    disconnectWallet, 
    formatAddress,
    connector
  } = useWallet()
  
  const { data: balanceData, isLoading: balanceLoading } = useBalance({
    address: address as `0x${string}` | undefined,
    query: {
      enabled: !!address,
      refetchInterval: 10000, // Refetch every 10 seconds
    },
  })
  
  const balance = balanceData?.formatted || '0'
  const symbol = balanceData?.symbol || 'CELO'

  // Detect MiniPay - hide connect button if MiniPay is detected
  const hideConnectBtn = useMemo(() => {
    if (typeof window === 'undefined') return false
    // Hide button if MiniPay is detected (implicit connection)
    return isMiniPay()
  }, [])

  // Detect if we should hide connector name (MiniPay or Farcaster context)
  const shouldHideConnectorName = useMemo(() => {
    if (typeof window === 'undefined') return false
    return isMiniPay() || isFarcaster()
  }, [])

  // Don't show connect button if MiniPay is detected (implicit wallet connection)
  if (!isConnected) {
    // In MiniPay, don't show connect button - connection is implicit
    if (hideConnectBtn) {
      // Show loading state while connecting
      if (isConnecting) {
        return (
          <Badge {...({ variant: "outline" } as any)} className="border-minipay/30 text-minipay">
            <Loader2 className="mr-2 h-3 w-3 animate-spin inline" />
            Connecting...
          </Badge>
        )
      }
      // Show MiniPay detected badge while waiting for connection
      return (
        <Badge {...({ variant: "outline" } as any)} className="border-minipay/30 text-minipay">
          MiniPay
        </Badge>
      )
    }
    
    // Show connect button for non-MiniPay wallets
    return (
      <Button
        onClick={() => connectWallet()}
        disabled={isConnecting}
        className="gradient-celo hover:opacity-90 shadow-celo transition-all duration-300"
      >
        {isConnecting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Connecting...
          </>
        ) : (
          <>
            <Wallet className="mr-2 h-4 w-4" />
            Connect Wallet
          </>
        )}
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-3">
      {/* Balance Display */}
      <div className="hidden sm:flex items-center gap-2">
        {balanceLoading ? (
          <div className="h-4 w-16 bg-muted animate-pulse rounded" />
        ) : (
          <Badge {...({ variant: "outline" } as any)} className="border-celo/30 text-foreground">
            {parseFloat(balance).toFixed(4)} {symbol}
          </Badge>
        )}
      </div>

      {/* Wallet Info */}
      <div className="flex items-center gap-2">
        <div className="hidden sm:block">
          <div className="text-sm font-medium text-foreground">
            {formatAddress()}
          </div>
          {connector && !shouldHideConnectorName && (
            <div className="text-xs text-muted-foreground">
              {connector.name}
            </div>
          )}
        </div>
        
        <Button
          {...({ variant: "outline", size: "sm" } as any)}
          onClick={disconnectWallet}
          className="border-border/50 hover:bg-muted/50"
        >
          <LogOut className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Disconnect</span>
        </Button>
      </div>
    </div>
  )
}

export default WalletConnect

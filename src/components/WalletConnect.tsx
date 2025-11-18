import React from 'react'
import { Wallet, LogOut, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useWallet } from '@/hooks/useWallet'
import { useBalance } from '@/hooks/useBalance'

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
  
  const { formatted: balance, symbol, isLoading: balanceLoading } = useBalance(address)

  if (!isConnected) {
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
          <Badge variant="outline" className="border-celo/30 text-foreground">
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
          {connector && (
            <div className="text-xs text-muted-foreground">
              {connector.name}
            </div>
          )}
        </div>
        
        <Button
          variant="outline"
          size="sm"
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

import React, { useState } from 'react';
import { Search, TrendingUp, Star } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { POPULAR_TOKENS, type TokenInfo } from '@/lib/vibeService';

interface TokenSearchProps {
  onTokenSelect: (token: TokenInfo) => void;
  watchlist: string[];
}

const TokenSearch: React.FC<TokenSearchProps> = ({ onTokenSelect, watchlist }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredTokens, setFilteredTokens] = useState<TokenInfo[]>(POPULAR_TOKENS);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredTokens(POPULAR_TOKENS);
      return;
    }

    const filtered = POPULAR_TOKENS.filter(token =>
      token.symbol.toLowerCase().includes(query.toLowerCase()) ||
      token.name.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredTokens(filtered);
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search tokens (e.g., CELO, BTC, ETH...)"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10 h-12 bg-muted/50 border-none focus:bg-white transition-smooth"
        />
      </div>

      {/* Popular Tokens */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <TrendingUp className="h-4 w-4" />
          {searchQuery ? `Results for "${searchQuery}"` : 'Popular Tokens'}
        </div>

        <div className="grid gap-3">
          {filteredTokens.map((token) => (
            <Card
              key={token.symbol}
              className="p-4 hover:shadow-soft transition-smooth cursor-pointer border-border/50 hover:border-primary/30"
              onClick={() => onTokenSelect(token)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {token.symbol.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{token.symbol}</span>
                      {watchlist.includes(token.symbol) && (
                        <Star className="h-4 w-4 fill-accent text-accent" />
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">{token.name}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{token.price}</div>
                  <div className="text-sm text-muted-foreground">{token.marketCap}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredTokens.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Search className="h-8 w-8 mx-auto mb-2" />
            <p>No tokens found matching "{searchQuery}"</p>
            <p className="text-sm mt-1">Try searching for popular tokens like CELO, BTC, or ETH</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TokenSearch;

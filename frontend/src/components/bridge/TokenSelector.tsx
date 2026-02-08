import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, TrendingUp, TrendingDown, Star } from 'lucide-react';

interface Token {
  symbol: string;
  name: string;
  icon: string;
  balance: string;
  usdValue: string;
  priceChange24h: number;
  chains: string[];
  isFavorite: boolean;
  isWhitelisted: boolean;
}

const AVAILABLE_TOKENS: Token[] = [
  {
    symbol: 'USDC',
    name: 'USD Coin',
    icon: '💵',
    balance: '1,234.56',
    usdValue: '1,234.56',
    priceChange24h: 0.01,
    chains: ['Ethereum', 'Polygon', 'BSC', 'Avalanche', 'Stacks'],
    isFavorite: true,
    isWhitelisted: true,
  },
  {
    symbol: 'USDT',
    name: 'Tether USD',
    icon: '💰',
    balance: '567.89',
    usdValue: '567.89',
    priceChange24h: -0.02,
    chains: ['Ethereum', 'Polygon', 'BSC', 'Stacks'],
    isFavorite: true,
    isWhitelisted: true,
  },
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    icon: '₿',
    balance: '0.5432',
    usdValue: '24,567.80',
    priceChange24h: 3.42,
    chains: ['Bitcoin', 'Stacks'],
    isFavorite: false,
    isWhitelisted: true,
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    icon: '⟠',
    balance: '2.1234',
    usdValue: '5,678.90',
    priceChange24h: -1.23,
    chains: ['Ethereum', 'Stacks'],
    isFavorite: false,
    isWhitelisted: true,
  },
  {
    symbol: 'STX',
    name: 'Stacks',
    icon: '⬢',
    balance: '5000.00',
    usdValue: '3,500.00',
    priceChange24h: 5.67,
    chains: ['Stacks'],
    isFavorite: true,
    isWhitelisted: true,
  },
];

interface TokenSelectorProps {
  onSelectToken?: (token: Token) => void;
  selectedToken?: string;
  filterByChain?: string;
}

export default function TokenSelector({ onSelectToken, selectedToken, filterByChain }: TokenSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [tokens, setTokens] = useState<Token[]>(AVAILABLE_TOKENS);

  const filteredTokens = tokens.filter(token => {
    const matchesSearch =
      token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesChain = !filterByChain || token.chains.includes(filterByChain);
    const matchesFavorites = !showFavoritesOnly || token.isFavorite;
    const isWhitelisted = token.isWhitelisted;

    return matchesSearch && matchesChain && matchesFavorites && isWhitelisted;
  });

  const handleSelectToken = (token: Token) => {
    if (onSelectToken) {
      onSelectToken(token);
    }
    setIsOpen(false);
  };

  const toggleFavorite = (symbol: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTokens(prev =>
      prev.map(t => (t.symbol === symbol ? { ...t, isFavorite: !t.isFavorite } : t))
    );
  };

  const selectedTokenData = tokens.find(t => t.symbol === selectedToken);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-start">
          {selectedTokenData ? (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <span className="text-lg">{selectedTokenData.icon}</span>
                <div className="text-left">
                  <div className="font-medium">{selectedTokenData.symbol}</div>
                  <div className="text-xs text-muted-foreground">{selectedTokenData.name}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium">{selectedTokenData.balance}</div>
                <div className="text-xs text-muted-foreground">${selectedTokenData.usdValue}</div>
              </div>
            </div>
          ) : (
            <span className="text-muted-foreground">Select token</span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Select Token</DialogTitle>
          <DialogDescription>
            Choose from whitelisted tokens available for bridging
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or symbol..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <Button
              variant={showFavoritesOnly ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            >
              <Star className={`h-4 w-4 mr-2 ${showFavoritesOnly ? 'fill-current' : ''}`} />
              Favorites
            </Button>
            {filterByChain && (
              <Badge variant="outline">Chain: {filterByChain}</Badge>
            )}
          </div>

          {/* Token List */}
          <div className="max-h-[400px] overflow-y-auto space-y-1">
            {filteredTokens.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No tokens found
              </div>
            ) : (
              filteredTokens.map((token) => (
                <button
                  key={token.symbol}
                  onClick={() => handleSelectToken(token)}
                  className="w-full p-3 hover:bg-accent rounded-lg transition-colors text-left"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{token.icon}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{token.symbol}</span>
                          {token.isWhitelisted && (
                            <Badge variant="outline" className="text-xs">
                              Whitelisted
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">{token.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {token.chains.join(', ')}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{token.balance}</div>
                      <div className="text-sm text-muted-foreground">
                        ${token.usdValue}
                      </div>
                      <div
                        className={`text-xs flex items-center gap-1 justify-end ${
                          token.priceChange24h >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {token.priceChange24h >= 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {Math.abs(token.priceChange24h)}%
                      </div>
                    </div>
                    <button
                      onClick={(e) => toggleFavorite(token.symbol, e)}
                      className="ml-2"
                    >
                      <Star
                        className={`h-4 w-4 ${
                          token.isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
                        }`}
                      />
                    </button>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Total Portfolio Value */}
          <div className="p-4 bg-muted rounded-lg">
            <div className="text-sm text-muted-foreground">Total Portfolio Value</div>
            <div className="text-2xl font-bold">
              $
              {filteredTokens
                .reduce((sum, token) => sum + parseFloat(token.usdValue.replace(/,/g, '')), 0)
                .toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Across {filteredTokens.length} whitelisted token{filteredTokens.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

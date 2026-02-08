import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, Wallet, Lock, TrendingUp, Eye, EyeOff } from 'lucide-react';

interface ChainBalance {
  chain: string;
  chainId: number;
  icon: string;
  balances: TokenBalance[];
}

interface TokenBalance {
  symbol: string;
  name: string;
  balance: string;
  locked: string;
  available: string;
  usdValue: string;
  icon: string;
}

const mockBalances: ChainBalance[] = [
  {
    chain: 'Stacks',
    chainId: 0,
    icon: '⬢',
    balances: [
      {
        symbol: 'wUSDC',
        name: 'Wrapped USDC',
        balance: '1,234.56',
        locked: '100.00',
        available: '1,134.56',
        usdValue: '1,234.56',
        icon: '💵',
      },
      {
        symbol: 'wUSDT',
        name: 'Wrapped USDT',
        balance: '567.89',
        locked: '0.00',
        available: '567.89',
        usdValue: '567.89',
        icon: '💰',
      },
      {
        symbol: 'STX',
        name: 'Stacks',
        balance: '5,000.00',
        locked: '1,000.00',
        available: '4,000.00',
        usdValue: '3,500.00',
        icon: '⬢',
      },
    ],
  },
  {
    chain: 'Ethereum',
    chainId: 1,
    icon: '⟠',
    balances: [
      {
        symbol: 'USDC',
        name: 'USD Coin',
        balance: '500.00',
        locked: '0.00',
        available: '500.00',
        usdValue: '500.00',
        icon: '💵',
      },
      {
        symbol: 'ETH',
        name: 'Ethereum',
        balance: '1.2345',
        locked: '0.5000',
        available: '0.7345',
        usdValue: '2,800.00',
        icon: '⟠',
      },
    ],
  },
  {
    chain: 'Polygon',
    chainId: 137,
    icon: '⬡',
    balances: [
      {
        symbol: 'USDC',
        name: 'USD Coin',
        balance: '750.00',
        locked: '250.00',
        available: '500.00',
        usdValue: '750.00',
        icon: '💵',
      },
      {
        symbol: 'USDT',
        name: 'Tether USD',
        balance: '300.00',
        locked: '0.00',
        available: '300.00',
        usdValue: '300.00',
        icon: '💰',
      },
    ],
  },
];

export default function BalanceViewer() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hideBalances, setHideBalances] = useState(false);
  const [selectedChain, setSelectedChain] = useState<string>('all');

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsRefreshing(false);
  };

  const calculateTotalValue = (chainBalances?: ChainBalance[]) => {
    const balancesToUse = chainBalances || mockBalances;
    return balancesToUse.reduce(
      (total, chain) =>
        total +
        chain.balances.reduce(
          (sum, token) => sum + parseFloat(token.usdValue.replace(/,/g, '')),
          0
        ),
      0
    );
  };

  const calculateTotalLocked = (chainBalances?: ChainBalance[]) => {
    const balancesToUse = chainBalances || mockBalances;
    return balancesToUse.reduce(
      (total, chain) =>
        total +
        chain.balances.reduce(
          (sum, token) => sum + parseFloat(token.locked.replace(/,/g, '')),
          0
        ),
      0
    );
  };

  const formatBalance = (value: string) => {
    return hideBalances ? '•••••' : value;
  };

  const filteredChains =
    selectedChain === 'all'
      ? mockBalances
      : mockBalances.filter(chain => chain.chain === selectedChain);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Multi-Chain Balances</CardTitle>
            <CardDescription>View your token balances across all supported chains</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setHideBalances(!hideBalances)}
            >
              {hideBalances ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-lg">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-2">
              <Wallet className="h-4 w-4" />
              <span className="text-sm font-medium">Total Balance</span>
            </div>
            <div className="text-2xl font-bold">
              ${formatBalance(calculateTotalValue().toLocaleString())}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Across all chains</div>
          </div>

          <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 rounded-lg">
            <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 mb-2">
              <Lock className="h-4 w-4" />
              <span className="text-sm font-medium">Locked</span>
            </div>
            <div className="text-2xl font-bold">
              ${formatBalance(calculateTotalLocked().toLocaleString())}
            </div>
            <div className="text-xs text-muted-foreground mt-1">In bridge escrow</div>
          </div>

          <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 rounded-lg">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-2">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm font-medium">Available</span>
            </div>
            <div className="text-2xl font-bold">
              $
              {formatBalance(
                (calculateTotalValue() - calculateTotalLocked()).toLocaleString()
              )}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Ready to bridge</div>
          </div>
        </div>

        {/* Chain Tabs */}
        <Tabs value={selectedChain} onValueChange={setSelectedChain}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">All Chains</TabsTrigger>
            {mockBalances.map(chain => (
              <TabsTrigger key={chain.chainId} value={chain.chain}>
                <span className="mr-2">{chain.icon}</span>
                {chain.chain}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedChain} className="space-y-4">
            {filteredChains.map(chain => (
              <div key={chain.chainId} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{chain.icon}</span>
                    <h3 className="font-semibold">{chain.chain}</h3>
                    <Badge variant="outline">
                      {chain.balances.length} token{chain.balances.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total: ${formatBalance(calculateTotalValue([chain]).toLocaleString())}
                  </div>
                </div>

                <div className="border rounded-lg divide-y">
                  {chain.balances.map(token => (
                    <div key={token.symbol} className="p-4 hover:bg-accent/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{token.icon}</span>
                          <div>
                            <div className="font-medium">{token.symbol}</div>
                            <div className="text-sm text-muted-foreground">{token.name}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatBalance(token.balance)}</div>
                          <div className="text-sm text-muted-foreground">
                            ${formatBalance(token.usdValue)}
                          </div>
                        </div>
                      </div>

                      {/* Breakdown */}
                      <div className="mt-3 flex gap-4 text-xs">
                        <div className="flex-1 p-2 bg-muted rounded">
                          <div className="text-muted-foreground">Available</div>
                          <div className="font-medium">{formatBalance(token.available)}</div>
                        </div>
                        {parseFloat(token.locked.replace(/,/g, '')) > 0 && (
                          <div className="flex-1 p-2 bg-orange-50 dark:bg-orange-950 rounded">
                            <div className="text-orange-600 dark:text-orange-400">Locked</div>
                            <div className="font-medium text-orange-600 dark:text-orange-400">
                              {formatBalance(token.locked)}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>

        {/* Chain Distribution */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Balance Distribution</h3>
          <div className="space-y-2">
            {mockBalances.map(chain => {
              const chainValue = calculateTotalValue([chain]);
              const totalValue = calculateTotalValue();
              const percentage = ((chainValue / totalValue) * 100).toFixed(1);

              return (
                <div key={chain.chainId} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span>{chain.icon}</span>
                      <span>{chain.chain}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{percentage}%</span>
                      <span className="font-medium">
                        ${formatBalance(chainValue.toLocaleString())}
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary rounded-full h-2 transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

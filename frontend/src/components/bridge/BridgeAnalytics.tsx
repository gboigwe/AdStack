import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Activity,
  DollarSign,
  Users,
  Lock,
  Zap,
} from 'lucide-react';

interface ChainStats {
  chain: string;
  icon: string;
  volume24h: number;
  transactions24h: number;
  tvl: number;
  avgTime: string;
}

interface TokenStats {
  token: string;
  icon: string;
  volume24h: number;
  locked: number;
  minted: number;
  burned: number;
  holders: number;
}

const CHAIN_STATS: ChainStats[] = [
  {
    chain: 'Ethereum',
    icon: '⟠',
    volume24h: 1250000,
    transactions24h: 145,
    tvl: 5600000,
    avgTime: '8m 32s',
  },
  {
    chain: 'Polygon',
    icon: '⬡',
    volume24h: 875000,
    transactions24h: 312,
    tvl: 2340000,
    avgTime: '3m 15s',
  },
  {
    chain: 'BSC',
    icon: '◆',
    volume24h: 650000,
    transactions24h: 89,
    tvl: 1890000,
    avgTime: '5m 42s',
  },
  {
    chain: 'Avalanche',
    icon: '▲',
    volume24h: 420000,
    transactions24h: 67,
    tvl: 1120000,
    avgTime: '4m 28s',
  },
  {
    chain: 'Stacks',
    icon: '⬢',
    volume24h: 980000,
    transactions24h: 234,
    tvl: 3450000,
    avgTime: '6m 15s',
  },
];

const TOKEN_STATS: TokenStats[] = [
  {
    token: 'USDC',
    icon: '💵',
    volume24h: 1800000,
    locked: 4200000,
    minted: 3800000,
    burned: 150000,
    holders: 1245,
  },
  {
    token: 'USDT',
    icon: '💰',
    volume24h: 1200000,
    locked: 2900000,
    minted: 2600000,
    burned: 95000,
    holders: 892,
  },
  {
    token: 'BTC',
    icon: '₿',
    volume24h: 2100000,
    locked: 5800000,
    minted: 5200000,
    burned: 280000,
    holders: 567,
  },
  {
    token: 'ETH',
    icon: '⟠',
    volume24h: 1600000,
    locked: 3900000,
    minted: 3400000,
    burned: 180000,
    holders: 734,
  },
];

export default function BridgeAnalytics() {
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');

  const totalVolume = CHAIN_STATS.reduce((sum, stat) => sum + stat.volume24h, 0);
  const totalTransactions = CHAIN_STATS.reduce((sum, stat) => sum + stat.transactions24h, 0);
  const totalTVL = CHAIN_STATS.reduce((sum, stat) => sum + stat.tvl, 0);
  const totalLockedTokens = TOKEN_STATS.reduce((sum, stat) => sum + stat.locked, 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Volume (24h)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalVolume)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-green-600 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                +12.5% from yesterday
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totalTransactions)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-green-600 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                +8.2% from yesterday
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value Locked</CardTitle>
            <Lock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalTVL)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-green-600 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                +5.7% from yesterday
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Validators</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-muted-foreground">Min required: 3</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue="chains">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="chains">Chain Statistics</TabsTrigger>
          <TabsTrigger value="tokens">Token Statistics</TabsTrigger>
        </TabsList>

        {/* Chain Statistics */}
        <TabsContent value="chains" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cross-Chain Activity</CardTitle>
              <CardDescription>Bridge volume and transactions by chain</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {CHAIN_STATS.map((stat) => {
                  const volumePercentage = ((stat.volume24h / totalVolume) * 100).toFixed(1);
                  const txPercentage = ((stat.transactions24h / totalTransactions) * 100).toFixed(1);

                  return (
                    <div key={stat.chain} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{stat.icon}</span>
                          <div>
                            <div className="font-medium">{stat.chain}</div>
                            <div className="text-xs text-muted-foreground">
                              Avg. time: {stat.avgTime}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatCurrency(stat.volume24h)}</div>
                          <div className="text-xs text-muted-foreground">
                            {stat.transactions24h} txs
                          </div>
                        </div>
                      </div>

                      {/* Volume Bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Volume</span>
                          <span>{volumePercentage}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-blue-500 rounded-full h-2 transition-all"
                            style={{ width: `${volumePercentage}%` }}
                          />
                        </div>
                      </div>

                      {/* Transaction Bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Transactions</span>
                          <span>{txPercentage}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-green-500 rounded-full h-2 transition-all"
                            style={{ width: `${txPercentage}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex gap-2 text-xs">
                        <Badge variant="outline">TVL: {formatCurrency(stat.tvl)}</Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Token Statistics */}
        <TabsContent value="tokens" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Token Metrics</CardTitle>
              <CardDescription>Wrapped token supply and activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {TOKEN_STATS.map((stat) => {
                  const volumePercentage = (
                    (stat.volume24h / TOKEN_STATS.reduce((s, t) => s + t.volume24h, 0)) *
                    100
                  ).toFixed(1);
                  const circulatingSupply = stat.minted - stat.burned;

                  return (
                    <div key={stat.token} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{stat.icon}</span>
                          <div>
                            <div className="font-medium">{stat.token}</div>
                            <div className="text-xs text-muted-foreground">
                              {stat.holders} holders
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatCurrency(stat.volume24h)}</div>
                          <div className="text-xs text-muted-foreground">24h volume</div>
                        </div>
                      </div>

                      {/* Volume Progress */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Volume share</span>
                          <span>{volumePercentage}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-purple-500 rounded-full h-2 transition-all"
                            style={{ width: `${volumePercentage}%` }}
                          />
                        </div>
                      </div>

                      {/* Supply Metrics */}
                      <div className="grid grid-cols-4 gap-2">
                        <div className="p-2 bg-muted rounded text-center">
                          <div className="text-xs text-muted-foreground">Locked</div>
                          <div className="font-medium text-sm">
                            {formatCurrency(stat.locked)}
                          </div>
                        </div>
                        <div className="p-2 bg-green-50 dark:bg-green-950 rounded text-center">
                          <div className="text-xs text-green-600 dark:text-green-400">Minted</div>
                          <div className="font-medium text-sm text-green-600 dark:text-green-400">
                            {formatCurrency(stat.minted)}
                          </div>
                        </div>
                        <div className="p-2 bg-red-50 dark:bg-red-950 rounded text-center">
                          <div className="text-xs text-red-600 dark:text-red-400">Burned</div>
                          <div className="font-medium text-sm text-red-600 dark:text-red-400">
                            {formatCurrency(stat.burned)}
                          </div>
                        </div>
                        <div className="p-2 bg-blue-50 dark:bg-blue-950 rounded text-center">
                          <div className="text-xs text-blue-600 dark:text-blue-400">Supply</div>
                          <div className="font-medium text-sm text-blue-600 dark:text-blue-400">
                            {formatCurrency(circulatingSupply)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Total Locked Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Total Locked Value</CardTitle>
              <CardDescription>All tokens locked in bridge contracts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatCurrency(totalLockedTokens)}</div>
              <div className="mt-4 space-y-2">
                {TOKEN_STATS.map((stat) => {
                  const percentage = ((stat.locked / totalLockedTokens) * 100).toFixed(1);
                  return (
                    <div key={stat.token} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span>{stat.icon}</span>
                        <span>{stat.token}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">{percentage}%</span>
                        <span className="font-medium">{formatCurrency(stat.locked)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Avg. Bridge Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5m 42s</div>
            <p className="text-xs text-muted-foreground">Across all chains</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">99.8%</div>
            <p className="text-xs text-green-600">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +0.1% this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Fees Collected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalVolume * 0.003)}</div>
            <p className="text-xs text-muted-foreground">0.3% fee on volume</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

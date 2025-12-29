/**
 * Wallet Balance Display
 * Shows STX balance and all SIP-010 tokens
 */

'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { useWalletStore } from '@/store/wallet-store';
import { formatSTXWithSymbol, formatCompactNumber } from '@/lib/display-utils';
import { CURRENT_NETWORK } from '@/lib/stacks-config';

/**
 * Token Interface
 */
interface Token {
  symbol: string;
  name: string;
  balance: bigint;
  decimals: number;
  contractAddress: string;
  logo?: string;
  priceUsd?: number;
  change24h?: number;
}

interface WalletBalanceProps {
  showTokens?: boolean;
  className?: string;
}

export function WalletBalance({ showTokens = true, className = '' }: WalletBalanceProps) {
  const { address, isConnected } = useWalletStore();
  const [stxBalance, setStxBalance] = useState<bigint>(0n);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(false);
  const [hideBalance, setHideBalance] = useState(false);
  const [totalValueUsd, setTotalValueUsd] = useState(0);

  useEffect(() => {
    if (address && isConnected) {
      fetchBalance();
    }
  }, [address, isConnected]);

  const fetchBalance = async () => {
    if (!address) return;

    setLoading(true);

    try {
      // TODO: Fetch real balance from Stacks API
      // https://api.hiro.so/extended/v1/address/{address}/balances

      // Mock STX balance
      setStxBalance(1500000n); // 1.5 STX

      // Mock token balances
      const mockTokens: Token[] = [
        {
          symbol: 'ALEX',
          name: 'Alex Token',
          balance: 10000000000n,
          decimals: 8,
          contractAddress: 'SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9.age000-governance-token',
          priceUsd: 0.15,
          change24h: 5.2,
        },
        {
          symbol: 'USDA',
          name: 'USD-A Stablecoin',
          balance: 50000000n,
          decimals: 6,
          contractAddress: 'SP2C2YFP12AJZB4MABJBST4K0HEYNYB0P9R6TQK1Y.usda-token',
          priceUsd: 1.0,
          change24h: 0.1,
        },
        {
          symbol: 'STX20',
          name: 'STX20 Token',
          balance: 25000000n,
          decimals: 6,
          contractAddress: 'SP3Y2ZSH8P7D50B0VBTSX11S7XSG24M1VB9YFQA4K.stx20-token',
          priceUsd: 0.05,
          change24h: -2.3,
        },
      ];

      setTokens(mockTokens);

      // Calculate total value
      const stxPrice = 0.5; // Mock STX price
      const stxValue = Number(stxBalance) / 1_000_000 * stxPrice;
      const tokensValue = mockTokens.reduce((sum, token) => {
        const balance = Number(token.balance) / Math.pow(10, token.decimals);
        return sum + (balance * (token.priceUsd || 0));
      }, 0);

      setTotalValueUsd(stxValue + tokensValue);
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTokenBalance = (token: Token): string => {
    const balance = Number(token.balance) / Math.pow(10, token.decimals);
    return balance.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: token.decimals,
    });
  };

  if (!isConnected) {
    return null;
  }

  return (
    <div className={`bg-gradient-to-br from-blue-600 to-purple-700 rounded-2xl p-6 text-white ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-blue-100 text-sm mb-1">Total Balance</p>
          <div className="flex items-center gap-3">
            {hideBalance ? (
              <p className="text-3xl font-bold">••••••</p>
            ) : (
              <>
                <p className="text-3xl font-bold">${totalValueUsd.toFixed(2)}</p>
                <button
                  onClick={() => setHideBalance(!hideBalance)}
                  className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                >
                  {hideBalance ? (
                    <Eye className="w-5 h-5" />
                  ) : (
                    <EyeOff className="w-5 h-5" />
                  )}
                </button>
              </>
            )}
          </div>
        </div>

        <button
          onClick={fetchBalance}
          disabled={loading}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
          title="Refresh balances"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* STX Balance */}
      <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
              <span className="font-bold text-blue-600">Ξ</span>
            </div>
            <div>
              <p className="font-semibold">Stacks</p>
              <p className="text-sm text-blue-100">STX</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-bold">
              {hideBalance ? '••••' : formatSTXWithSymbol(stxBalance, 2)}
            </p>
            <p className="text-sm text-blue-100">
              {hideBalance ? '••••' : `$${(Number(stxBalance) / 1_000_000 * 0.5).toFixed(2)}`}
            </p>
          </div>
        </div>
      </div>

      {/* Tokens List */}
      {showTokens && tokens.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-blue-100 font-medium mb-2">Tokens</p>
          {tokens.map((token) => (
            <div
              key={token.contractAddress}
              className="bg-white/10 rounded-xl p-3 backdrop-blur-sm hover:bg-white/20 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="font-bold text-xs">{token.symbol.slice(0, 2)}</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">{token.symbol}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-blue-100">{token.name}</p>
                      {token.change24h && (
                        <span
                          className={`flex items-center gap-1 text-xs ${
                            token.change24h >= 0 ? 'text-green-300' : 'text-red-300'
                          }`}
                        >
                          {token.change24h >= 0 ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          {Math.abs(token.change24h).toFixed(1)}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-sm">
                    {hideBalance ? '••••' : formatCompactNumber(Number(token.balance) / Math.pow(10, token.decimals))}
                  </p>
                  {token.priceUsd && (
                    <p className="text-xs text-blue-100">
                      {hideBalance
                        ? '••••'
                        : `$${((Number(token.balance) / Math.pow(10, token.decimals)) * token.priceUsd).toFixed(2)}`}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Tokens Link */}
      {showTokens && (
        <button className="w-full mt-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-sm font-medium">
          + Add Token
        </button>
      )}
    </div>
  );
}

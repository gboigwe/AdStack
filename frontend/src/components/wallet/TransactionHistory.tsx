/**
 * Transaction History Viewer
 * Displays user's transaction history with filtering and details
 */

'use client';

import { useState, useEffect } from 'react';
import {
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle,
  XCircle,
  ExternalLink,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { useWalletStore } from '@/store/wallet-store';
import { formatSTXWithSymbol, formatTimestamp, formatTxId } from '@/lib/display-utils';
import { CURRENT_NETWORK } from '@/lib/stacks-config';

/**
 * Transaction Interface
 */
interface Transaction {
  txId: string;
  type: 'sent' | 'received' | 'contract_call' | 'token_transfer';
  status: 'pending' | 'success' | 'failed';
  amount: bigint;
  timestamp: number;
  from: string;
  to: string;
  memo?: string;
  contractAddress?: string;
  functionName?: string;
}

/**
 * Transaction Filter Type
 */
type TransactionFilter = 'all' | 'sent' | 'received' | 'contracts';

interface TransactionHistoryProps {
  className?: string;
}

export function TransactionHistory({ className = '' }: TransactionHistoryProps) {
  const { address, isConnected } = useWalletStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<TransactionFilter>('all');
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    if (address && isConnected) {
      fetchTransactions();
    }
  }, [address, isConnected, page]);

  const fetchTransactions = async () => {
    if (!address) return;

    setLoading(true);

    try {
      // TODO: Fetch real transactions from Stacks API
      // https://api.hiro.so/extended/v1/address/{address}/transactions

      // Mock data for now
      const mockTxs: Transaction[] = [
        {
          txId: '0x1234567890abcdef1234567890abcdef12345678',
          type: 'contract_call',
          status: 'success',
          amount: 1000000n,
          timestamp: Math.floor(Date.now() / 1000) - 3600,
          from: address,
          to: 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7',
          contractAddress: 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7',
          functionName: 'create-campaign',
        },
        {
          txId: '0xabcdef1234567890abcdef1234567890abcdef12',
          type: 'sent',
          status: 'success',
          amount: 500000n,
          timestamp: Math.floor(Date.now() / 1000) - 7200,
          from: address,
          to: 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE',
        },
        {
          txId: '0x9876543210fedcba9876543210fedcba98765432',
          type: 'received',
          status: 'success',
          amount: 2000000n,
          timestamp: Math.floor(Date.now() / 1000) - 14400,
          from: 'SP1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
          to: address,
        },
        {
          txId: '0xfedcba9876543210fedcba9876543210fedcba98',
          type: 'contract_call',
          status: 'pending',
          amount: 750000n,
          timestamp: Math.floor(Date.now() / 1000) - 300,
          from: address,
          to: 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7',
          contractAddress: 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7',
          functionName: 'fund-campaign',
        },
      ];

      setTransactions(mockTxs);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter((tx) => {
    if (filter === 'all') return true;
    if (filter === 'sent') return tx.type === 'sent' || tx.type === 'contract_call';
    if (filter === 'received') return tx.type === 'received';
    if (filter === 'contracts') return tx.type === 'contract_call';
    return true;
  });

  const getTxIcon = (tx: Transaction) => {
    if (tx.type === 'received') {
      return <ArrowDownLeft className="w-5 h-5 text-green-600" />;
    }
    return <ArrowUpRight className="w-5 h-5 text-blue-600" />;
  };

  const getStatusIcon = (status: Transaction['status']) => {
    if (status === 'success') {
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    }
    if (status === 'failed') {
      return <XCircle className="w-4 h-4 text-red-600" />;
    }
    return <Clock className="w-4 h-4 text-yellow-600 animate-spin" />;
  };

  const getExplorerUrl = (txId: string) => {
    return CURRENT_NETWORK === 'mainnet'
      ? `https://explorer.hiro.so/txid/${txId}`
      : `https://explorer.hiro.so/txid/${txId}?chain=testnet`;
  };

  if (!isConnected) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <p className="text-gray-600">Connect your wallet to view transaction history</p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Transaction History</h2>
          <button
            onClick={fetchTransactions}
            disabled={loading}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-gray-600" />
          {(['all', 'sent', 'received', 'contracts'] as TransactionFilter[]).map((filterType) => (
            <button
              key={filterType}
              onClick={() => setFilter(filterType)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filter === filterType
                  ? 'bg-blue-100 text-blue-700 border-2 border-blue-500'
                  : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:border-gray-300'
              }`}
            >
              {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Transaction List */}
      <div className="divide-y divide-gray-200">
        {loading && transactions.length === 0 ? (
          <div className="p-8 text-center">
            <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-2" />
            <p className="text-gray-600">Loading transactions...</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-600">No transactions found</p>
          </div>
        ) : (
          filteredTransactions.map((tx) => (
            <div key={tx.txId} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="p-2 bg-gray-100 rounded-lg">{getTxIcon(tx)}</div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 capitalize">
                          {tx.type.replace('_', ' ')}
                        </h3>
                        {getStatusIcon(tx.status)}
                      </div>

                      {tx.contractAddress && tx.functionName && (
                        <p className="text-xs text-gray-600 mb-1">
                          Function: <code className="font-mono">{tx.functionName}</code>
                        </p>
                      )}

                      <p className="text-xs text-gray-600 font-mono">{formatTxId(tx.txId)}</p>
                    </div>

                    <div className="text-right">
                      <p className={`font-bold ${tx.type === 'received' ? 'text-green-600' : 'text-gray-900'}`}>
                        {tx.type === 'received' ? '+' : '-'}
                        {formatSTXWithSymbol(tx.amount, 2)}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {formatTimestamp(tx.timestamp, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-2">
                    <a
                      href={getExplorerUrl(tx.txId)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      View on Explorer
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {filteredTransactions.length > 0 && (
        <div className="p-4 border-t border-gray-200 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {filteredTransactions.length} transactions
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={filteredTransactions.length < ITEMS_PER_PAGE}
              className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Wallet, TrendingUp, Users, Clock, FileText } from 'lucide-react';

interface Transaction {
  id: number;
  recipient: string;
  amount: number;
  memo: string;
  proposedBy: string;
  signaturesCount: number;
  thresholdMet: boolean;
  executed: boolean;
  proposedAt: number;
}

interface TreasuryStats {
  balance: number;
  totalTransactions: number;
  pendingTransactions: number;
  signers: number;
  threshold: number;
}

export function TreasuryViewer() {
  const [stats, setStats] = useState<TreasuryStats>({
    balance: 0,
    totalTransactions: 0,
    pendingTransactions: 0,
    signers: 5,
    threshold: 3,
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTreasuryData();
  }, []);

  const loadTreasuryData = async () => {
    try {
      setLoading(true);
      // TODO: Fetch treasury data from multisig-treasury contract
      setStats({
        balance: 500000000000, // 500k STX
        totalTransactions: 24,
        pendingTransactions: 2,
        signers: 5,
        threshold: 3,
      });

      // TODO: Fetch pending transactions
      setTransactions([]);
    } catch (error) {
      console.error('Failed to load treasury data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatSTX = (microSTX: number): string => {
    return (microSTX / 1000000).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const shortenAddress = (address: string): string => {
    if (address.length <= 12) return address;
    return `${address.slice(0, 8)}...${address.slice(-4)}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Treasury</h1>
        <p className="text-gray-600">Multi-signature treasury management</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Treasury Balance</span>
            <Wallet className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {formatSTX(stats.balance)}
          </p>
          <p className="text-xs text-gray-500 mt-1">STX</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Total Transactions</span>
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.totalTransactions}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Pending</span>
            <Clock className="w-5 h-5 text-yellow-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.pendingTransactions}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Signers</span>
            <Users className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {stats.threshold}/{stats.signers}
          </p>
          <p className="text-xs text-gray-500 mt-1">Required/Total</p>
        </div>
      </div>

      {/* Pending Transactions */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Pending Transactions</h2>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading transactions...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No pending transactions</p>
              <p className="text-gray-500 text-sm mt-2">All transactions have been processed</p>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-gray-500">TX #{tx.id}</span>
                        {tx.thresholdMet ? (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                            Ready to Execute
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                            Awaiting Signatures
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">To:</span> {shortenAddress(tx.recipient)}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Memo:</span> {tx.memo}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">
                        {formatSTX(tx.amount)} STX
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>
                        Proposed by: <span className="font-medium">{shortenAddress(tx.proposedBy)}</span>
                      </span>
                      <span>
                        Signatures: <span className="font-medium">{tx.signaturesCount}/{stats.threshold}</span>
                      </span>
                    </div>
                    {tx.thresholdMet && !tx.executed && (
                      <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                        Execute
                      </button>
                    )}
                    {!tx.thresholdMet && (
                      <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors">
                        Sign
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
        <h4 className="text-sm font-semibold text-purple-900 mb-2">Multi-Signature Security</h4>
        <p className="text-sm text-purple-800">
          This treasury requires {stats.threshold} out of {stats.signers} authorized signers to approve
          any transaction. This ensures no single party can move funds unilaterally.
        </p>
      </div>
    </div>
  );
}

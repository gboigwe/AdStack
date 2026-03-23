'use client';

import { DollarSign, Eye, TrendingUp, Users, RefreshCw } from 'lucide-react';
import { useWalletStore } from '@/store/wallet-store';
import { useStxBalance, useTransactions } from '@/hooks';
import { formatSTXWithSymbol } from '@/lib/display-utils';

export default function PublisherDashboard() {
  const { isConnected, address } = useWalletStore();
  const { data: balance, isLoading: balanceLoading } = useStxBalance(address);
  const { data: txList, isLoading: txLoading } = useTransactions(address, 5);

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Connect Your Wallet
          </h2>
          <p className="text-gray-600">
            Please connect your Stacks wallet to access the publisher dashboard.
          </p>
        </div>
      </div>
    );
  }

  const totalReceived = balance ? BigInt(balance.total_received) : 0n;
  const currentBalance = balance ? BigInt(balance.balance) : 0n;

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Publisher Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Track your earnings and ad performance
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Received</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {balanceLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-gray-400" />
                  ) : (
                    formatSTXWithSymbol(totalReceived, 2)
                  )}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Current Balance</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {balanceLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-gray-400" />
                  ) : (
                    formatSTXWithSymbol(currentBalance, 2)
                  )}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Eye className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Ads</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">0</p>
                <p className="text-xs text-gray-500 mt-1">Contract integration pending</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Transactions</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {txLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-gray-400" />
                  ) : (
                    txList?.total ?? 0
                  )}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-xl border border-gray-200 mb-6">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
          </div>
          <div className="p-6">
            {txLoading ? (
              <div className="flex justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : txList && txList.results.length > 0 ? (
              <div className="space-y-3">
                {txList.results.map((tx) => (
                  <div
                    key={tx.tx_id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-mono text-gray-700">
                        {tx.tx_id.slice(0, 10)}...{tx.tx_id.slice(-6)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {tx.tx_type} &middot; Block {tx.block_height}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        tx.tx_status === 'success'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {tx.tx_status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600">No transactions yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Earnings History placeholder */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Earnings History</h2>
          </div>
          <div className="p-6">
            <div className="text-center py-12">
              <p className="text-gray-600">
                Earnings tracking will be available after contract deployment
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

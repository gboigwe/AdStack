'use client';

import Link from 'next/link';
import { DollarSign, Eye, TrendingUp, Users, RefreshCw, ExternalLink } from 'lucide-react';
import { useWalletStore } from '@/store/wallet-store';
import { useStxBalance, useTransactions } from '@/hooks';
import { formatSTXWithSymbol, formatTxId, getExplorerTxUrl } from '@/lib/display-utils';
import { getExplorerTxUrl as explorerTx } from '@/lib/stacks-config';
import { StatCard } from '@/components/ui';
import { Badge } from '@/components/ui';

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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Publisher Dashboard</h1>
            <p className="text-gray-600 mt-2">
              Track your earnings and ad performance
            </p>
          </div>
          <Link
            href="/publisher/settings"
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Settings
          </Link>
        </div>

        {/* Stats — now using StatCard */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={DollarSign}
            iconBgColor="bg-green-100"
            iconColor="text-green-600"
            label="Total Received"
            value={formatSTXWithSymbol(totalReceived, 2)}
            isLoading={balanceLoading}
          />
          <StatCard
            icon={Eye}
            iconBgColor="bg-blue-100"
            iconColor="text-blue-600"
            label="Current Balance"
            value={formatSTXWithSymbol(currentBalance, 2)}
            isLoading={balanceLoading}
          />
          <StatCard
            icon={TrendingUp}
            iconBgColor="bg-purple-100"
            iconColor="text-purple-600"
            label="Active Ads"
            value={0}
            isLoading={false}
            subtitle="Contract integration pending"
          />
          <StatCard
            icon={Users}
            iconBgColor="bg-yellow-100"
            iconColor="text-yellow-600"
            label="Transactions"
            value={txList?.total ?? 0}
            isLoading={txLoading}
          />
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-xl border border-gray-200 mb-6">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
            {txList && txList.total > 5 && (
              <Link
                href="/transactions"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View all
              </Link>
            )}
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
                    <div className="min-w-0">
                      <a
                        href={explorerTx(tx.tx_id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-mono text-gray-700 hover:text-blue-600 inline-flex items-center gap-1"
                      >
                        {formatTxId(tx.tx_id)}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <p className="text-xs text-gray-500 mt-1">
                        {tx.tx_type} &middot; Block {tx.block_height}
                      </p>
                    </div>
                    <Badge
                      variant={tx.tx_status === 'success' ? 'success' : 'error'}
                    >
                      {tx.tx_status}
                    </Badge>
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

        {/* Earnings History */}
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

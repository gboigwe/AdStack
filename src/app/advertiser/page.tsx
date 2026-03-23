'use client';

import { Plus, TrendingUp, DollarSign, Eye, RefreshCw } from 'lucide-react';
import { useWalletStore } from '@/store/wallet-store';
import { useStxBalance } from '@/hooks';
import { formatSTXWithSymbol, formatCompactNumber } from '@/lib/display-utils';
import Link from 'next/link';

export default function AdvertiserDashboard() {
  const { isConnected, address } = useWalletStore();
  const { data: balance, isLoading: balanceLoading } = useStxBalance(address);

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Connect Your Wallet
          </h2>
          <p className="text-gray-600">
            Please connect your Stacks wallet to access the advertiser dashboard.
          </p>
        </div>
      </div>
    );
  }

  const totalSent = balance ? BigInt(balance.total_sent) : 0n;

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Advertiser Dashboard</h1>
          <Link
            href="/advertiser/campaigns/new"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Campaign
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Sent</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {balanceLoading ? (
                    <span className="inline-flex items-center gap-2 text-gray-400">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    </span>
                  ) : (
                    formatSTXWithSymbol(totalSent, 2)
                  )}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Available Balance</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {balanceLoading ? (
                    <span className="inline-flex items-center gap-2 text-gray-400">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    </span>
                  ) : (
                    formatSTXWithSymbol(balance ? BigInt(balance.balance) : 0n, 2)
                  )}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Eye className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Campaigns</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">0</p>
                <p className="text-xs text-gray-500 mt-1">Contract integration pending</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Campaigns List */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Your Campaigns</h2>
          </div>
          <div className="p-6">
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">No campaigns yet</p>
              <Link
                href="/advertiser/campaigns/new"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Create your first campaign
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

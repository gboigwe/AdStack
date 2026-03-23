'use client';

import { Plus, TrendingUp, DollarSign, Eye } from 'lucide-react';
import { useWalletStore } from '@/store/wallet-store';
import { useStxBalance, useCampaignCount } from '@/hooks';
import { formatSTXWithSymbol } from '@/lib/display-utils';
import { StatCard, SkeletonLines } from '@/components/ui';
import Link from 'next/link';

export default function AdvertiserDashboard() {
  const { isConnected, address } = useWalletStore();
  const { data: balance, isLoading: balanceLoading } = useStxBalance(address);
  const { data: campaignCountRaw, isLoading: countLoading } = useCampaignCount();

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
  const currentBalance = balance ? BigInt(balance.balance) : 0n;

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Advertiser Dashboard</h1>
          <Link
            href="/advertiser/campaigns/new"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
          >
            <Plus className="w-4 h-4" />
            New Campaign
          </Link>
        </div>

        {/* Stats — using StatCard for consistency */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatCard
            icon={DollarSign}
            iconBgColor="bg-blue-100"
            iconColor="text-blue-600"
            label="Total Sent"
            value={formatSTXWithSymbol(totalSent, 2)}
            isLoading={balanceLoading}
          />
          <StatCard
            icon={Eye}
            iconBgColor="bg-green-100"
            iconColor="text-green-600"
            label="Available Balance"
            value={formatSTXWithSymbol(currentBalance, 2)}
            isLoading={balanceLoading}
          />
          <StatCard
            icon={TrendingUp}
            iconBgColor="bg-purple-100"
            iconColor="text-purple-600"
            label="Active Campaigns"
            value={countLoading ? undefined : String(campaignCountRaw ?? 0)}
            isLoading={countLoading}
            subtitle="From on-chain data"
          />
        </div>

        {/* Campaigns List */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Your Campaigns</h2>
          </div>
          <div className="p-6">
            {countLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 border border-gray-100 rounded-lg">
                    <SkeletonLines count={3} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-600 mb-4">No campaigns yet</p>
                <Link
                  href="/advertiser/campaigns/new"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Create your first campaign
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { Plus, TrendingUp, DollarSign, Eye } from 'lucide-react';
import { useWalletStore } from '@/store/wallet-store';
import { useStxBalance, useCampaignCount } from '@/hooks';
import { formatSTXWithSymbol } from '@/lib/display-utils';
import { StatCard, SkeletonLines, PageTransition, EmptyState } from '@/components/ui';
import Link from 'next/link';

export default function AdvertiserDashboard() {
  const { isConnected, address } = useWalletStore();
  const { data: balance, isLoading: balanceLoading } = useStxBalance(address);
  const { data: campaignCountRaw, isLoading: countLoading } = useCampaignCount();

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Connect Your Wallet
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Please connect your Stacks wallet to access the advertiser dashboard.
          </p>
        </div>
      </div>
    );
  }

  const totalSent = balance ? BigInt(balance.total_sent) : 0n;
  const currentBalance = balance ? BigInt(balance.balance) : 0n;

  return (
    <PageTransition className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Advertiser Dashboard</h1>
          <Link
            href="/advertiser/campaigns/new"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors font-medium text-sm"
          >
            <Plus className="w-4 h-4" />
            New Campaign
          </Link>
        </div>

        {/* Stats — using StatCard for consistency */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatCard
            icon={DollarSign}
            iconBgColor="bg-blue-100 dark:bg-blue-900/30"
            iconColor="text-blue-600 dark:text-blue-400"
            label="Total Sent"
            value={formatSTXWithSymbol(totalSent, 2)}
            isLoading={balanceLoading}
          />
          <StatCard
            icon={Eye}
            iconBgColor="bg-green-100 dark:bg-green-900/30"
            iconColor="text-green-600 dark:text-green-400"
            label="Available Balance"
            value={formatSTXWithSymbol(currentBalance, 2)}
            isLoading={balanceLoading}
          />
          <StatCard
            icon={TrendingUp}
            iconBgColor="bg-purple-100 dark:bg-purple-900/30"
            iconColor="text-purple-600 dark:text-purple-400"
            label="Active Campaigns"
            value={countLoading ? undefined : String(campaignCountRaw ?? 0)}
            isLoading={countLoading}
            subtitle="From on-chain data"
          />
        </div>

        {/* Campaigns List */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Your Campaigns</h2>
          </div>
          <div className="p-6">
            {countLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 border border-gray-100 dark:border-gray-800 rounded-lg">
                    <SkeletonLines count={3} />
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={TrendingUp}
                title="No campaigns yet"
                description="Launch your first ad campaign to start reaching publishers on the Stacks network."
                action={
                  <Link
                    href="/advertiser/campaigns/new"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors text-sm font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Create your first campaign
                  </Link>
                }
              />
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

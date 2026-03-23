'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  BarChart3,
  Clock,
  DollarSign,
  Eye,
  MousePointerClick,
  Pause,
  Play,
  RefreshCw,
} from 'lucide-react';
import { useWalletStore } from '@/store/wallet-store';
import { useCampaign, useCampaignAnalytics } from '@/hooks';
import { useContractCall } from '@/hooks/use-contract-call';
import { formatSTXWithSymbol } from '@/lib/display-utils';
import { buildPauseCampaign, buildResumeCampaign } from '@/lib/contract-calls';
import { CONTRACTS } from '@/lib/stacks-config';
import { StatCard } from '@/components/ui';

export default function CampaignDetailPage() {
  const params = useParams();
  const { isConnected } = useWalletStore();

  const campaignId = params.id ? Number(params.id) : undefined;
  const isValidId = campaignId !== undefined && !isNaN(campaignId) && campaignId > 0;

  const {
    data: campaignData,
    isLoading: campaignLoading,
    error: campaignError,
  } = useCampaign(isValidId ? campaignId : undefined);

  const {
    data: analyticsData,
    isLoading: analyticsLoading,
  } = useCampaignAnalytics(isValidId ? campaignId : undefined);

  const invalidateKeys = [['read-only', CONTRACTS.PROMO_MANAGER]];
  const { execute: pauseCampaign, isLoading: pausing } = useContractCall({
    label: 'Pause Campaign',
    invalidateKeys,
  });
  const { execute: resumeCampaign, isLoading: resuming } = useContractCall({
    label: 'Resume Campaign',
    invalidateKeys,
  });

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Connect Your Wallet
          </h2>
          <p className="text-gray-600">
            Connect your Stacks wallet to view campaign details.
          </p>
        </div>
      </div>
    );
  }

  if (!isValidId) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Invalid Campaign ID
          </h2>
          <p className="text-gray-600 mb-6">
            The campaign ID &ldquo;{params.id}&rdquo; is not valid.
          </p>
          <Link
            href="/advertiser"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/advertiser"
            className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Campaign #{campaignId}
              </h1>
              <p className="text-gray-600 mt-1">
                {campaignLoading ? 'Loading campaign data...' : 'Campaign overview and analytics'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => campaignId && pauseCampaign(buildPauseCampaign(campaignId))}
                disabled={pausing || !isValidId}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700 disabled:opacity-50"
                title="Pause campaign"
              >
                <Pause className="w-4 h-4" />
                {pausing ? 'Pausing...' : 'Pause'}
              </button>
              <button
                onClick={() => campaignId && resumeCampaign(buildResumeCampaign(campaignId))}
                disabled={resuming || !isValidId}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50"
                title="Resume campaign"
              >
                <Play className="w-4 h-4" />
                {resuming ? 'Resuming...' : 'Resume'}
              </button>
            </div>
          </div>
        </div>

        {/* Error State */}
        {campaignError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <p className="font-medium">Failed to load campaign</p>
            <p className="text-sm mt-1">
              {campaignError instanceof Error ? campaignError.message : 'Unknown error occurred'}
            </p>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={<DollarSign className="w-5 h-5 text-blue-600" />}
            label="Budget"
            value={campaignLoading ? undefined : formatSTXWithSymbol(0n, 2)}
            isLoading={campaignLoading}
          />
          <StatCard
            icon={<Eye className="w-5 h-5 text-green-600" />}
            label="Total Views"
            value={analyticsLoading ? undefined : '0'}
            isLoading={analyticsLoading}
          />
          <StatCard
            icon={<MousePointerClick className="w-5 h-5 text-purple-600" />}
            label="Clicks"
            value={analyticsLoading ? undefined : '0'}
            isLoading={analyticsLoading}
          />
          <StatCard
            icon={<BarChart3 className="w-5 h-5 text-orange-600" />}
            label="CTR"
            value={analyticsLoading ? undefined : '0.00%'}
            isLoading={analyticsLoading}
          />
        </div>

        {/* Campaign Details Card */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Campaign Details</h2>

            {campaignLoading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : (
              <dl className="space-y-4">
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-600">Status</dt>
                  <dd>
                    <span className="px-2.5 py-0.5 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">
                      Pending Data
                    </span>
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-600">Campaign ID</dt>
                  <dd className="text-sm font-medium text-gray-900">#{campaignId}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-600">Contract Result</dt>
                  <dd className="text-sm font-mono text-gray-500 truncate max-w-[200px]">
                    {campaignData || 'No data'}
                  </dd>
                </div>
              </dl>
            )}
          </div>

          {/* Activity Timeline */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Clock className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Campaign page viewed</p>
                  <p className="text-xs text-gray-500">Just now</p>
                </div>
              </div>

              <div className="text-center py-6">
                <p className="text-sm text-gray-500">
                  Activity data will appear once the campaign contract is deployed.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

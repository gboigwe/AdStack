'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/store/wallet-store';
import {
  getCampaignStateName,
  CampaignState,
  type Campaign
} from '@/lib/contracts/campaign-lifecycle';

interface CampaignMetrics {
  views: number;
  clicks: number;
  conversions: number;
  revenue: number;
  spend: number;
  ctr: number;
  cvr: number;
  roi: number;
  roas: number;
}

interface DashboardCampaign extends Campaign {
  metrics?: CampaignMetrics;
  progress: number;
}

export default function CampaignDashboard() {
  const { address, isConnected } = useWallet();
  const [campaigns, setCampaigns] = useState<DashboardCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState<DashboardCampaign | null>(null);
  const [filterState, setFilterState] = useState<CampaignState | 'all'>('all');

  useEffect(() => {
    if (isConnected && address) {
      loadCampaigns();

      // Refresh every 30 seconds
      const interval = setInterval(loadCampaigns, 30000);
      return () => clearInterval(interval);
    }
  }, [isConnected, address]);

  const loadCampaigns = async () => {
    try {
      // TODO: Fetch campaigns from contract
      // For now, using mock data
      const mockCampaigns: DashboardCampaign[] = [
        {
          campaignId: 1,
          owner: address || '',
          name: 'Summer Sale 2026',
          budget: 10000000000n,
          currentFunding: 10000000000n,
          fundingThreshold: 8000000000n,
          state: CampaignState.ACTIVE,
          startTime: Math.floor(Date.now() / 1000) - 86400,
          endTime: Math.floor(Date.now() / 1000) + 2592000,
          escrowId: 1,
          metadata: '{}',
          progress: 45,
          metrics: {
            views: 125000,
            clicks: 5600,
            conversions: 234,
            revenue: 12500000000,
            spend: 4500000000,
            ctr: 448,
            cvr: 418,
            roi: 17777,
            roas: 27777
          }
        },
        {
          campaignId: 2,
          owner: address || '',
          name: 'Product Launch Campaign',
          budget: 5000000000n,
          currentFunding: 5000000000n,
          fundingThreshold: 5000000000n,
          state: CampaignState.ACTIVE,
          startTime: Math.floor(Date.now() / 1000) - 172800,
          endTime: Math.floor(Date.now() / 1000) + 1728000,
          escrowId: 2,
          metadata: '{}',
          progress: 67,
          metrics: {
            views: 78000,
            clicks: 3200,
            conversions: 156,
            revenue: 7800000000,
            spend: 3350000000,
            ctr: 410,
            cvr: 487,
            roi: 13283,
            roas: 23283
          }
        }
      ];

      setCampaigns(mockCampaigns);
      setLoading(false);
    } catch (error) {
      console.error('Error loading campaigns:', error);
      setLoading(false);
    }
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat().format(num);
  };

  const formatCurrency = (microStx: bigint): string => {
    const stx = Number(microStx) / 1_000_000;
    return `${stx.toLocaleString()} STX`;
  };

  const formatPercentage = (basisPoints: number): string => {
    return `${(basisPoints / 100).toFixed(2)}%`;
  };

  const getStateColor = (state: CampaignState): string => {
    switch (state) {
      case CampaignState.DRAFT:
        return 'bg-gray-100 text-gray-800';
      case CampaignState.FUNDED:
        return 'bg-yellow-100 text-yellow-800';
      case CampaignState.ACTIVE:
        return 'bg-green-100 text-green-800';
      case CampaignState.PAUSED:
        return 'bg-orange-100 text-orange-800';
      case CampaignState.COMPLETED:
        return 'bg-blue-100 text-blue-800';
      case CampaignState.CANCELLED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredCampaigns = campaigns.filter(
    c => filterState === 'all' || c.state === filterState
  );

  if (!isConnected) {
    return (
      <div className="max-w-7xl mx-auto p-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-yellow-800">Please connect your wallet to view campaigns</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading campaigns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Campaign Dashboard</h1>
        <p className="text-gray-600">Monitor and manage your advertising campaigns</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        <button
          onClick={() => setFilterState('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filterState === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All ({campaigns.length})
        </button>
        {[
          CampaignState.ACTIVE,
          CampaignState.PAUSED,
          CampaignState.FUNDED,
          CampaignState.COMPLETED
        ].map(state => {
          const count = campaigns.filter(c => c.state === state).length;
          return (
            <button
              key={state}
              onClick={() => setFilterState(state)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterState === state
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {getCampaignStateName(state)} ({count})
            </button>
          );
        })}
      </div>

      {/* Campaigns grid */}
      {filteredCampaigns.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-600">No campaigns found</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredCampaigns.map(campaign => (
            <div
              key={campaign.campaignId}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedCampaign(campaign)}
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold">{campaign.name}</h3>
                    <p className="text-sm text-gray-500">Campaign #{campaign.campaignId}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStateColor(campaign.state)}`}>
                    {getCampaignStateName(campaign.state)}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-medium">{campaign.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${campaign.progress}%` }}
                    />
                  </div>
                </div>

                {/* Budget info */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Budget</p>
                    <p className="font-semibold">{formatCurrency(campaign.budget)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Spent</p>
                    <p className="font-semibold">
                      {campaign.metrics ? formatCurrency(BigInt(campaign.metrics.spend)) : '0 STX'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Remaining</p>
                    <p className="font-semibold">
                      {campaign.metrics
                        ? formatCurrency(campaign.budget - BigInt(campaign.metrics.spend))
                        : formatCurrency(campaign.budget)}
                    </p>
                  </div>
                </div>

                {/* Metrics */}
                {campaign.metrics && (
                  <div className="grid grid-cols-4 gap-4 pt-4 border-t">
                    <div>
                      <p className="text-sm text-gray-600">Views</p>
                      <p className="font-semibold">{formatNumber(campaign.metrics.views)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Clicks</p>
                      <p className="font-semibold">{formatNumber(campaign.metrics.clicks)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">CTR</p>
                      <p className="font-semibold">{formatPercentage(campaign.metrics.ctr)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">ROI</p>
                      <p className={`font-semibold ${campaign.metrics.roi > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatPercentage(campaign.metrics.roi)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Timeline */}
                <div className="flex justify-between text-sm text-gray-600 mt-4 pt-4 border-t">
                  <span>Started: {new Date(campaign.startTime * 1000).toLocaleDateString()}</span>
                  <span>Ends: {new Date(campaign.endTime * 1000).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for detailed view */}
      {selectedCampaign && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedCampaign(null)}
        >
          <div
            className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold">{selectedCampaign.name}</h2>
                  <p className="text-gray-500">Campaign #{selectedCampaign.campaignId}</p>
                </div>
                <button
                  onClick={() => setSelectedCampaign(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              {selectedCampaign.metrics && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Total Views</p>
                    <p className="text-2xl font-bold">{formatNumber(selectedCampaign.metrics.views)}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Total Clicks</p>
                    <p className="text-2xl font-bold">{formatNumber(selectedCampaign.metrics.clicks)}</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Conversions</p>
                    <p className="text-2xl font-bold">{formatNumber(selectedCampaign.metrics.conversions)}</p>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Revenue</p>
                    <p className="text-2xl font-bold">{formatCurrency(BigInt(selectedCampaign.metrics.revenue))}</p>
                  </div>
                </div>
              )}

              <div className="mt-6 flex gap-3">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  View Details
                </button>
                <button className="px-4 py-2 border rounded-lg hover:bg-gray-50">
                  Edit Campaign
                </button>
                {selectedCampaign.state === CampaignState.ACTIVE && (
                  <button className="px-4 py-2 border border-orange-500 text-orange-600 rounded-lg hover:bg-orange-50">
                    Pause Campaign
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

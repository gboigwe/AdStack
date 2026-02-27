'use client';

import { useState } from 'react';
import { BarChart3, TrendingUp, Users, Eye, MousePointer, Target } from 'lucide-react';
import { type SegmentAnalytics, SEGMENT_TYPES } from './types';

interface SegmentAnalyticsEntry {
  segmentId: number;
  name: string;
  type: number;
  memberCount: number;
  analytics: SegmentAnalytics;
}

export function SegmentAnalyticsPanel() {
  const [segments] = useState<SegmentAnalyticsEntry[]>([
    {
      segmentId: 1,
      name: 'Tech Enthusiasts 25-35',
      type: 3,
      memberCount: 4520,
      analytics: {
        totalImpressions: 128500, totalClicks: 6840, totalConversions: 342,
        avgSimilarity: 78, reachRate: 4520, engagementRate: 532,
        revenueGenerated: 15200, lastUpdated: Date.now() / 1000,
      },
    },
    {
      segmentId: 2,
      name: 'DeFi Power Users',
      type: 2,
      memberCount: 1870,
      analytics: {
        totalImpressions: 56200, totalClicks: 3920, totalConversions: 196,
        avgSimilarity: 85, reachRate: 1870, engagementRate: 697,
        revenueGenerated: 9800, lastUpdated: Date.now() / 1000,
      },
    },
    {
      segmentId: 3,
      name: 'Crypto Newcomers Lookalike',
      type: 4,
      memberCount: 8200,
      analytics: {
        totalImpressions: 245000, totalClicks: 9800, totalConversions: 490,
        avgSimilarity: 62, reachRate: 8200, engagementRate: 400,
        revenueGenerated: 22400, lastUpdated: Date.now() / 1000,
      },
    },
    {
      segmentId: 4,
      name: 'NFT Collectors 18-45',
      type: 1,
      memberCount: 3100,
      analytics: {
        totalImpressions: 89300, totalClicks: 5360, totalConversions: 268,
        avgSimilarity: 71, reachRate: 3100, engagementRate: 600,
        revenueGenerated: 12800, lastUpdated: Date.now() / 1000,
      },
    },
  ]);

  const [sortBy, setSortBy] = useState<'impressions' | 'conversions' | 'engagement' | 'revenue'>('revenue');

  const sortedSegments = [...segments].sort((a, b) => {
    switch (sortBy) {
      case 'impressions': return b.analytics.totalImpressions - a.analytics.totalImpressions;
      case 'conversions': return b.analytics.totalConversions - a.analytics.totalConversions;
      case 'engagement': return b.analytics.engagementRate - a.analytics.engagementRate;
      case 'revenue': return b.analytics.revenueGenerated - a.analytics.revenueGenerated;
    }
  });

  const totalImpressions = segments.reduce((s, seg) => s + seg.analytics.totalImpressions, 0);
  const totalConversions = segments.reduce((s, seg) => s + seg.analytics.totalConversions, 0);
  const totalRevenue = segments.reduce((s, seg) => s + seg.analytics.revenueGenerated, 0);
  const totalMembers = segments.reduce((s, seg) => s + seg.memberCount, 0);

  const formatNumber = (n: number) => {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toString();
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-50 rounded-lg">
            <BarChart3 className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Segment Analytics</h2>
            <p className="text-sm text-gray-500">Performance metrics across audience segments</p>
          </div>
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
        >
          <option value="revenue">Sort by Revenue</option>
          <option value="impressions">Sort by Impressions</option>
          <option value="conversions">Sort by Conversions</option>
          <option value="engagement">Sort by Engagement</option>
        </select>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <Eye className="w-4 h-4 text-gray-400 mx-auto mb-1" />
          <div className="text-lg font-bold text-gray-900">{formatNumber(totalImpressions)}</div>
          <div className="text-[10px] text-gray-500">Impressions</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <Target className="w-4 h-4 text-gray-400 mx-auto mb-1" />
          <div className="text-lg font-bold text-gray-900">{formatNumber(totalConversions)}</div>
          <div className="text-[10px] text-gray-500">Conversions</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <Users className="w-4 h-4 text-gray-400 mx-auto mb-1" />
          <div className="text-lg font-bold text-gray-900">{formatNumber(totalMembers)}</div>
          <div className="text-[10px] text-gray-500">Total Members</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <TrendingUp className="w-4 h-4 text-gray-400 mx-auto mb-1" />
          <div className="text-lg font-bold text-green-600">{formatNumber(totalRevenue)} STX</div>
          <div className="text-[10px] text-gray-500">Revenue</div>
        </div>
      </div>

      <div className="space-y-3">
        {sortedSegments.map((seg) => {
          const ctr = seg.analytics.totalImpressions > 0
            ? ((seg.analytics.totalClicks / seg.analytics.totalImpressions) * 100).toFixed(2)
            : '0.00';
          const cvr = seg.analytics.totalClicks > 0
            ? ((seg.analytics.totalConversions / seg.analytics.totalClicks) * 100).toFixed(2)
            : '0.00';

          return (
            <div key={seg.segmentId} className="border border-gray-100 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">{seg.name}</span>
                    <span className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px] text-gray-500">
                      {SEGMENT_TYPES[seg.type]}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">{seg.memberCount.toLocaleString()} members</span>
                </div>
                <span className="text-sm font-semibold text-green-600">
                  {formatNumber(seg.analytics.revenueGenerated)} STX
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <div className="text-center">
                  <div className="text-xs font-semibold text-gray-700">{formatNumber(seg.analytics.totalImpressions)}</div>
                  <div className="text-[10px] text-gray-400">Impressions</div>
                </div>
                <div className="text-center">
                  <div className="text-xs font-semibold text-gray-700">{formatNumber(seg.analytics.totalClicks)}</div>
                  <div className="text-[10px] text-gray-400">Clicks</div>
                </div>
                <div className="text-center">
                  <div className="text-xs font-semibold text-blue-600">{ctr}%</div>
                  <div className="text-[10px] text-gray-400">CTR</div>
                </div>
                <div className="text-center">
                  <div className="text-xs font-semibold text-purple-600">{cvr}%</div>
                  <div className="text-[10px] text-gray-400">CVR</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Eye, Users, TrendingUp, Zap, AlertCircle } from 'lucide-react';
import { MATCH_TIERS, SEGMENT_STATUS, type AudienceSegment, type MatchResult } from './types';

interface TargetingPreviewProps {
  segment?: AudienceSegment;
  campaignId?: number;
}

interface PreviewUser {
  address: string;
  matchScore: number;
  matchTier: number;
  ageMatch: boolean;
  locationMatch: boolean;
  interestMatch: boolean;
  deviceMatch: boolean;
}

export function TargetingPreview({ segment, campaignId }: TargetingPreviewProps) {
  const [previewUsers] = useState<PreviewUser[]>([
    { address: 'SP2J6ZY...8QJ5', matchScore: 92, matchTier: 4, ageMatch: true, locationMatch: true, interestMatch: true, deviceMatch: true },
    { address: 'SP3FBR...SVTE', matchScore: 78, matchTier: 3, ageMatch: true, locationMatch: true, interestMatch: true, deviceMatch: false },
    { address: 'SP1HTB...8QE', matchScore: 65, matchTier: 3, ageMatch: true, locationMatch: false, interestMatch: true, deviceMatch: true },
    { address: 'SP2NEB...3ND', matchScore: 45, matchTier: 2, ageMatch: false, locationMatch: true, interestMatch: true, deviceMatch: false },
    { address: 'SP2REH...VB', matchScore: 32, matchTier: 2, ageMatch: true, locationMatch: false, interestMatch: false, deviceMatch: true },
    { address: 'SP3QBR...KTE', matchScore: 18, matchTier: 1, ageMatch: false, locationMatch: false, interestMatch: true, deviceMatch: false },
  ]);

  const [selectedTierFilter, setSelectedTierFilter] = useState<number | null>(null);

  const filteredUsers = selectedTierFilter !== null
    ? previewUsers.filter((u) => u.matchTier === selectedTierFilter)
    : previewUsers;

  const tierDistribution = [0, 1, 2, 3, 4].map((tier) => ({
    tier,
    label: MATCH_TIERS[tier],
    count: previewUsers.filter((u) => u.matchTier === tier).length,
  }));

  const avgScore = previewUsers.length > 0
    ? Math.round(previewUsers.reduce((sum, u) => sum + u.matchScore, 0) / previewUsers.length)
    : 0;

  const getTierColor = (tier: number) => {
    switch (tier) {
      case 4: return 'bg-green-100 text-green-700 border-green-200';
      case 3: return 'bg-blue-100 text-blue-700 border-blue-200';
      case 2: return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 1: return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getScoreBarColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-yellow-500';
    if (score >= 20) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-indigo-50 rounded-lg">
          <Eye className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Targeting Preview</h2>
          <p className="text-sm text-gray-500">Preview how users match your targeting criteria</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{previewUsers.length}</div>
          <div className="text-xs text-gray-500 mt-1">Sample Users</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-indigo-600">{avgScore}%</div>
          <div className="text-xs text-gray-500 mt-1">Avg Match Score</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-green-600">
            {previewUsers.filter((u) => u.matchTier >= 3).length}
          </div>
          <div className="text-xs text-gray-500 mt-1">High+ Matches</div>
        </div>
      </div>

      <div className="mb-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Tier Distribution</h3>
        <div className="flex gap-2">
          {tierDistribution.map(({ tier, label, count }) => (
            <button
              key={tier}
              onClick={() => setSelectedTierFilter(selectedTierFilter === tier ? null : tier)}
              className={`flex-1 py-2 px-2 rounded-lg border text-center text-xs transition-colors ${
                selectedTierFilter === tier
                  ? getTierColor(tier) + ' ring-2 ring-offset-1 ring-indigo-300'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-semibold">{count}</div>
              <div className="text-gray-500">{label}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {filteredUsers.map((user, index) => (
          <div
            key={index}
            className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg hover:border-gray-200 transition-colors"
          >
            <div className="w-20 text-xs font-mono text-gray-600 truncate">{user.address}</div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${getScoreBarColor(user.matchScore)}`}
                    style={{ width: `${user.matchScore}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-gray-700 w-10 text-right">
                  {user.matchScore}%
                </span>
              </div>
              <div className="flex gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ${user.ageMatch ? 'bg-green-400' : 'bg-red-300'}`} />
                <span className="text-[10px] text-gray-500">Age</span>
                <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ml-1 ${user.locationMatch ? 'bg-green-400' : 'bg-red-300'}`} />
                <span className="text-[10px] text-gray-500">Geo</span>
                <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ml-1 ${user.interestMatch ? 'bg-green-400' : 'bg-red-300'}`} />
                <span className="text-[10px] text-gray-500">Interest</span>
                <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ml-1 ${user.deviceMatch ? 'bg-green-400' : 'bg-red-300'}`} />
                <span className="text-[10px] text-gray-500">Device</span>
              </div>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getTierColor(user.matchTier)}`}>
              {MATCH_TIERS[user.matchTier]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

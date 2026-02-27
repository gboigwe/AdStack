'use client';

import { useState } from 'react';
import { Scale, Star, Clock, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import {
  ARBITRATOR_TIERS,
  ARBITRATOR_STATUS,
  type Arbitrator,
  type ArbitratorPerformance,
  type CaseAssignment,
} from './types';

interface ArbitratorDashboardProps {
  arbitrator?: Arbitrator;
  performance?: ArbitratorPerformance;
  activeCases?: CaseAssignment[];
}

export function ArbitratorDashboard({
  arbitrator,
  performance,
  activeCases = [],
}: ArbitratorDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'cases' | 'ratings'>('overview');

  if (!arbitrator) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="text-center py-8">
          <Scale className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No arbitrator profile found</p>
        </div>
      </div>
    );
  }

  const tierColor = (tier: number) => {
    if (tier === 4) return 'bg-purple-100 text-purple-800';
    if (tier === 3) return 'bg-blue-100 text-blue-800';
    if (tier === 2) return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-800';
  };

  const statusColor = (status: number) => {
    if (status === 1) return 'bg-green-50 text-green-700';
    if (status === 2) return 'bg-red-50 text-red-700';
    if (status === 3) return 'bg-gray-50 text-gray-700';
    return 'bg-yellow-50 text-yellow-700';
  };

  const reputationColor = (rep: number) => {
    if (rep >= 80) return 'text-green-600';
    if (rep >= 60) return 'text-blue-600';
    if (rep >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const totalRatings = performance
    ? performance.favorableRatings + performance.unfavorableRatings
    : 0;
  const favorablePercent = totalRatings > 0
    ? Math.round((performance!.favorableRatings / totalRatings) * 100)
    : 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-50 rounded-xl">
              <Scale className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{arbitrator.displayName}</h3>
              <p className="text-sm text-gray-500 mt-0.5">{arbitrator.bio.substring(0, 80)}{arbitrator.bio.length > 80 ? '...' : ''}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${tierColor(arbitrator.tier)}`}>
              {ARBITRATOR_TIERS[arbitrator.tier]}
            </span>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColor(arbitrator.status)}`}>
              {ARBITRATOR_STATUS[arbitrator.status]}
            </span>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          {arbitrator.specializations.map((spec) => (
            <span key={spec} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
              {spec}
            </span>
          ))}
        </div>
      </div>

      <div className="border-b border-gray-100">
        <div className="flex">
          {(['overview', 'cases', 'ratings'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className={`text-3xl font-bold ${reputationColor(arbitrator.reputation)}`}>
                  {arbitrator.reputation}
                </p>
                <p className="text-xs text-gray-500 mt-1">Reputation</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-gray-900">
                  {(arbitrator.stakeAmount / 1000000).toFixed(1)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Stake (STX)</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-gray-900">
                  {performance?.casesResolved || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">Cases Resolved</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-gray-900">
                  {performance?.activeCases || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">Active Cases</p>
              </div>
            </div>

            {performance && (
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {performance.avgResolutionTime} blocks
                    </p>
                    <p className="text-xs text-gray-500">Avg Resolution Time</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {(performance.totalRewardsEarned / 1000000).toFixed(2)} STX
                    </p>
                    <p className="text-xs text-gray-500">Total Rewards</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {performance.casesOverturned}
                    </p>
                    <p className="text-xs text-gray-500">Overturned</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Star className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {favorablePercent}% Favorable
                    </p>
                    <p className="text-xs text-gray-500">
                      {totalRatings} total ratings
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'cases' && (
          <div>
            {activeCases.length === 0 ? (
              <p className="text-center text-gray-400 py-6">No active case assignments</p>
            ) : (
              <div className="space-y-3">
                {activeCases.map((assignment, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Reward: {(assignment.rewardAmount / 1000000).toFixed(2)} STX
                      </p>
                      <p className="text-xs text-gray-500">
                        Assigned block {assignment.assignedAt}
                        {assignment.acceptedAt > 0 && ` | Accepted block ${assignment.acceptedAt}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {assignment.completed ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded text-xs font-medium">
                          <CheckCircle className="w-3 h-3" /> Completed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-50 text-yellow-700 rounded text-xs font-medium">
                          <Clock className="w-3 h-3" /> In Progress
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'ratings' && performance && (
          <div className="space-y-4">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-4xl font-bold text-green-600">{performance.favorableRatings}</p>
                <p className="text-xs text-gray-500 mt-1">Favorable</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold text-red-600">{performance.unfavorableRatings}</p>
                <p className="text-xs text-gray-500 mt-1">Unfavorable</p>
              </div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: `${favorablePercent}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">{favorablePercent}% approval rate</p>
              </div>
            </div>
            {performance.totalSlashed > 0 && (
              <div className="p-3 bg-red-50 rounded-lg">
                <p className="text-sm text-red-700">
                  Total slashed: {(performance.totalSlashed / 1000000).toFixed(2)} STX
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

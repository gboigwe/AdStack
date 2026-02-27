'use client';

import { useState } from 'react';
import { Calculator, TrendingUp, Users, AlertCircle } from 'lucide-react';
import { CRITERIA_TYPES, MATCH_TIERS } from './types';

interface MatchRateData {
  criteriaType: string;
  totalUsers: number;
  matchedUsers: number;
  matchRate: number;
  avgScore: number;
}

export function MatchRateCalculator() {
  const [matchData] = useState<MatchRateData[]>([
    { criteriaType: 'Age Range', totalUsers: 15000, matchedUsers: 9200, matchRate: 61.3, avgScore: 72 },
    { criteriaType: 'Location', totalUsers: 15000, matchedUsers: 6800, matchRate: 45.3, avgScore: 68 },
    { criteriaType: 'Interests', totalUsers: 15000, matchedUsers: 7500, matchRate: 50.0, avgScore: 75 },
    { criteriaType: 'Device', totalUsers: 15000, matchedUsers: 11200, matchRate: 74.7, avgScore: 82 },
    { criteriaType: 'Language', totalUsers: 15000, matchedUsers: 12300, matchRate: 82.0, avgScore: 88 },
    { criteriaType: 'Income Bracket', totalUsers: 15000, matchedUsers: 5400, matchRate: 36.0, avgScore: 65 },
  ]);

  const [combinedMode, setCombinedMode] = useState<'all' | 'any'>('all');

  const combinedMatchRate = combinedMode === 'all'
    ? matchData.reduce((rate, d) => rate * (d.matchRate / 100), 1) * 100
    : Math.min(100, matchData.reduce((rate, d) => rate + d.matchRate, 0) / matchData.length);

  const estimatedReach = Math.round(
    15000 * (combinedMatchRate / 100)
  );

  const overallAvgScore = Math.round(
    matchData.reduce((sum, d) => sum + d.avgScore, 0) / matchData.length
  );

  const tierBreakdown = [
    { tier: 'Exact', pct: 12, color: 'bg-green-500' },
    { tier: 'High', pct: 28, color: 'bg-blue-500' },
    { tier: 'Medium', pct: 35, color: 'bg-yellow-500' },
    { tier: 'Low', pct: 18, color: 'bg-orange-500' },
    { tier: 'None', pct: 7, color: 'bg-gray-300' },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-50 rounded-lg">
            <Calculator className="w-5 h-5 text-cyan-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Match Rate Calculator</h2>
            <p className="text-sm text-gray-500">Estimate audience match rates per criteria</p>
          </div>
        </div>
        <div className="flex bg-gray-100 rounded-lg p-0.5">
          <button
            onClick={() => setCombinedMode('all')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              combinedMode === 'all' ? 'bg-white shadow text-gray-900' : 'text-gray-500'
            }`}
          >
            Match All
          </button>
          <button
            onClick={() => setCombinedMode('any')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              combinedMode === 'any' ? 'bg-white shadow text-gray-900' : 'text-gray-500'
            }`}
          >
            Match Any
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-cyan-700">{combinedMatchRate.toFixed(1)}%</div>
          <div className="text-xs text-gray-500 mt-1">Combined Match Rate</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{estimatedReach.toLocaleString()}</div>
          <div className="text-xs text-gray-500 mt-1">Estimated Reach</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{overallAvgScore}</div>
          <div className="text-xs text-gray-500 mt-1">Avg Match Score</div>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Match Rate by Criteria</h3>
        <div className="space-y-3">
          {matchData.map((d, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-xs text-gray-600 w-28 truncate">{d.criteriaType}</span>
              <div className="flex-1">
                <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-500 rounded-full transition-all"
                    style={{ width: `${d.matchRate}%` }}
                  />
                </div>
              </div>
              <span className="text-xs font-semibold text-gray-700 w-14 text-right">
                {d.matchRate}%
              </span>
              <span className="text-[10px] text-gray-400 w-16 text-right">
                {d.matchedUsers.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Tier Distribution</h3>
        <div className="flex h-6 rounded-full overflow-hidden mb-2">
          {tierBreakdown.map((t) => (
            <div
              key={t.tier}
              className={`${t.color} transition-all`}
              style={{ width: `${t.pct}%` }}
            />
          ))}
        </div>
        <div className="flex justify-between">
          {tierBreakdown.map((t) => (
            <div key={t.tier} className="text-center">
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${t.color}`} />
                <span className="text-[10px] text-gray-500">{t.tier}</span>
              </div>
              <span className="text-[10px] font-medium text-gray-700">{t.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

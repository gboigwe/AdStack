'use client';

import { useState, useCallback } from 'react';
import { Users, Star, Shield, Search, Check } from 'lucide-react';
import { ARBITRATOR_TIERS, ARBITRATOR_STATUS, type Arbitrator, type ArbitratorPerformance } from './types';

interface ArbitratorCandidate {
  arbitrator: Arbitrator;
  performance: ArbitratorPerformance;
}

interface ArbitratorSelectionProps {
  candidates?: ArbitratorCandidate[];
  selectedArbitrator?: string;
  caseSeverity?: number;
  onSelect?: (address: string) => void;
}

const tierMinimums: Record<number, number> = { 1: 1, 2: 2, 3: 3, 4: 4 };

export function ArbitratorSelection({
  candidates = [],
  selectedArbitrator,
  caseSeverity = 1,
  onSelect,
}: ArbitratorSelectionProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState<number>(0);
  const [sortBy, setSortBy] = useState<'reputation' | 'cases' | 'speed'>('reputation');

  const eligibleCandidates = candidates.filter((c) => {
    const meetsMinTier = c.arbitrator.tier >= (tierMinimums[caseSeverity] || 1);
    const isActive = c.arbitrator.status === 1;
    const matchesSearch =
      !searchTerm || c.arbitrator.owner.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTier = tierFilter === 0 || c.arbitrator.tier === tierFilter;
    return meetsMinTier && isActive && matchesSearch && matchesTier;
  });

  const sortedCandidates = [...eligibleCandidates].sort((a, b) => {
    if (sortBy === 'reputation') return b.arbitrator.reputationScore - a.arbitrator.reputationScore;
    if (sortBy === 'cases') return b.performance.casesCompleted - a.performance.casesCompleted;
    if (sortBy === 'speed') {
      const aSpeed = a.performance.casesCompleted > 0 ? a.performance.avgResolutionTime : Infinity;
      const bSpeed = b.performance.casesCompleted > 0 ? b.performance.avgResolutionTime : Infinity;
      return aSpeed - bSpeed;
    }
    return 0;
  });

  const handleSelect = useCallback(
    (address: string) => {
      if (onSelect) onSelect(address);
    },
    [onSelect]
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-teal-50 rounded-lg">
          <Users className="w-5 h-5 text-teal-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Select Arbitrator</h3>
          <p className="text-sm text-gray-500">
            {eligibleCandidates.length} eligible for severity {caseSeverity}
          </p>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by address..."
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4].map((tier) => (
              <button
                key={tier}
                onClick={() => setTierFilter(tier)}
                className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                  tierFilter === tier
                    ? 'bg-teal-600 text-white border-teal-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-teal-300'
                }`}
              >
                {tier === 0 ? 'All' : ARBITRATOR_TIERS[tier]}
              </button>
            ))}
          </div>
          <div className="ml-auto">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="reputation">Reputation</option>
              <option value="cases">Experience</option>
              <option value="speed">Speed</option>
            </select>
          </div>
        </div>
      </div>

      {sortedCandidates.length === 0 ? (
        <p className="text-center text-gray-400 py-8 text-sm">No eligible arbitrators found</p>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {sortedCandidates.map((c) => {
            const isSelected = selectedArbitrator === c.arbitrator.owner;
            const favorableRate =
              c.performance.casesCompleted > 0
                ? Math.round(
                    (c.performance.favorableRulings / c.performance.casesCompleted) * 100
                  )
                : 0;

            return (
              <button
                key={c.arbitrator.owner}
                onClick={() => handleSelect(c.arbitrator.owner)}
                className={`w-full p-3 rounded-lg border text-left transition-all ${
                  isSelected
                    ? 'border-teal-500 bg-teal-50 ring-1 ring-teal-500'
                    : 'border-gray-200 hover:border-teal-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">
                      {c.arbitrator.owner.slice(0, 8)}...{c.arbitrator.owner.slice(-4)}
                    </span>
                    <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                      {ARBITRATOR_TIERS[c.arbitrator.tier]}
                    </span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-teal-600" />}
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-500" />
                      <span className="text-xs font-medium text-gray-900">
                        {c.arbitrator.reputationScore}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">Score</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-900">
                      {c.performance.casesCompleted}
                    </p>
                    <p className="text-xs text-gray-400">Cases</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-900">{favorableRate}%</p>
                    <p className="text-xs text-gray-400">Favorable</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <Shield className="w-3 h-3 text-gray-400" />
                      <span className="text-xs font-medium text-gray-900">
                        {(c.arbitrator.stakeAmount / 1_000_000).toFixed(0)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">Stake</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

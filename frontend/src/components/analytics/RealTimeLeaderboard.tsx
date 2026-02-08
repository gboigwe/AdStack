import React, { useState, useEffect, useMemo } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import ConnectionStatus from './ConnectionStatus';
import {
  Trophy,
  TrendingUp,
  TrendingDown,
  Minus,
  Medal,
  Crown,
  Award,
} from 'lucide-react';

export interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  metrics?: {
    impressions?: number;
    revenue?: number;
    ctr?: number;
    bids?: number;
  };
  rank: number;
  previousRank?: number;
  avatar?: string;
}

export interface RealTimeLeaderboardProps {
  contractId: string;
  type?: 'campaigns' | 'publishers';
  maxEntries?: number;
  scoreMetric?: 'revenue' | 'impressions' | 'ctr' | 'bids';
  showMetrics?: boolean;
  animationDuration?: number;
}

type RankChange = 'up' | 'down' | 'same' | 'new';

function getRankIcon(rank: number) {
  switch (rank) {
    case 1:
      return <Crown className="h-5 w-5 text-yellow-500" />;
    case 2:
      return <Medal className="h-5 w-5 text-gray-400" />;
    case 3:
      return <Medal className="h-5 w-5 text-orange-600" />;
    default:
      return null;
  }
}

function getRankChangeIndicator(change: RankChange, difference: number = 0) {
  switch (change) {
    case 'up':
      return (
        <div className="flex items-center gap-1 text-green-600">
          <TrendingUp className="h-4 w-4" />
          <span className="text-xs font-medium">+{difference}</span>
        </div>
      );
    case 'down':
      return (
        <div className="flex items-center gap-1 text-red-600">
          <TrendingDown className="h-4 w-4" />
          <span className="text-xs font-medium">-{difference}</span>
        </div>
      );
    case 'new':
      return (
        <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
          New
        </span>
      );
    case 'same':
      return (
        <div className="flex items-center gap-1 text-gray-400">
          <Minus className="h-4 w-4" />
        </div>
      );
  }
}

export default function RealTimeLeaderboard({
  contractId,
  type = 'campaigns',
  maxEntries = 10,
  scoreMetric = 'revenue',
  showMetrics = true,
  animationDuration = 500,
}: RealTimeLeaderboardProps) {
  const { isConnected, events, error } = useWebSocket({
    contractId,
    autoConnect: true,
    eventTypes: [type, `${type}-update`, 'leaderboard'],
  });

  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [previousEntries, setPreviousEntries] = useState<LeaderboardEntry[]>([]);

  // Process incoming events
  useEffect(() => {
    if (!events.length) return;

    const latestEvent = events[0];
    const { data } = latestEvent;

    // Handle leaderboard data
    if (data.leaderboard || data.rankings) {
      const leaderboardData = data.leaderboard || data.rankings;
      setPreviousEntries(entries);
      setEntries(parseLeaderboardData(leaderboardData, scoreMetric));
      return;
    }

    // Handle individual entry updates
    if (data.type === type || data.entityType === type) {
      setPreviousEntries(entries);

      setEntries((prev) => {
        const existingIndex = prev.findIndex((e) => e.id === data.id);

        if (existingIndex >= 0) {
          // Update existing entry
          const updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            score: calculateScore(data, scoreMetric),
            metrics: {
              impressions: data.impressions || updated[existingIndex].metrics?.impressions || 0,
              revenue: data.revenue || updated[existingIndex].metrics?.revenue || 0,
              ctr: data.ctr || updated[existingIndex].metrics?.ctr || 0,
              bids: data.bids || updated[existingIndex].metrics?.bids || 0,
            },
          };
          return rankEntries(updated);
        } else {
          // Add new entry
          const newEntry: LeaderboardEntry = {
            id: data.id,
            name: data.name || data.campaignName || data.publisher || 'Unknown',
            score: calculateScore(data, scoreMetric),
            metrics: {
              impressions: data.impressions || 0,
              revenue: data.revenue || 0,
              ctr: data.ctr || 0,
              bids: data.bids || 0,
            },
            rank: 0,
          };
          return rankEntries([...prev, newEntry]);
        }
      });
    }
  }, [events, type, scoreMetric, entries]);

  const topEntries = useMemo(() => {
    return entries.slice(0, maxEntries);
  }, [entries, maxEntries]);

  const formatScore = (score: number): string => {
    if (scoreMetric === 'revenue') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(score);
    }

    if (scoreMetric === 'ctr') {
      return `${score.toFixed(2)}%`;
    }

    return new Intl.NumberFormat('en-US').format(score);
  };

  const getScoreLabel = (): string => {
    const labels = {
      revenue: 'Revenue',
      impressions: 'Impressions',
      ctr: 'CTR',
      bids: 'Bids',
    };
    return labels[scoreMetric];
  };

  const getRankChange = (entry: LeaderboardEntry): { change: RankChange; difference: number } => {
    if (!entry.previousRank) {
      return { change: 'new', difference: 0 };
    }

    const diff = entry.previousRank - entry.rank;

    if (diff > 0) {
      return { change: 'up', difference: diff };
    } else if (diff < 0) {
      return { change: 'down', difference: Math.abs(diff) };
    } else {
      return { change: 'same', difference: 0 };
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Trophy className="h-6 w-6 text-yellow-500" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Live Leaderboard</h2>
            <p className="text-sm text-gray-600">
              Top {type} by {getScoreLabel()}
            </p>
          </div>
        </div>
        <ConnectionStatus isConnected={isConnected} />
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <p className="font-medium">Connection Error</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="divide-y divide-gray-200">
          {topEntries.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Award className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No entries yet...</p>
              {!isConnected && (
                <p className="text-sm mt-2">Waiting for connection...</p>
              )}
            </div>
          ) : (
            topEntries.map((entry, index) => {
              const { change, difference } = getRankChange(entry);
              const isTopThree = entry.rank <= 3;

              return (
                <div
                  key={entry.id}
                  className={`p-4 transition-all duration-${animationDuration} ${
                    isTopThree ? 'bg-gradient-to-r from-yellow-50 to-orange-50' : 'hover:bg-gray-50'
                  }`}
                  style={{
                    animation: change !== 'same' ? `slideIn ${animationDuration}ms ease-out` : undefined,
                  }}
                >
                  <div className="flex items-center gap-4">
                    {/* Rank */}
                    <div className="flex items-center justify-center w-12 h-12 shrink-0">
                      {getRankIcon(entry.rank) || (
                        <span className="text-2xl font-bold text-gray-400">
                          {entry.rank}
                        </span>
                      )}
                    </div>

                    {/* Entry Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {entry.name}
                        </h3>
                        {getRankChangeIndicator(change, difference)}
                      </div>

                      {showMetrics && entry.metrics && (
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                          {entry.metrics.impressions !== undefined && (
                            <span>{entry.metrics.impressions.toLocaleString()} views</span>
                          )}
                          {entry.metrics.revenue !== undefined && (
                            <span>${entry.metrics.revenue.toLocaleString()}</span>
                          )}
                          {entry.metrics.ctr !== undefined && (
                            <span>{entry.metrics.ctr.toFixed(2)}% CTR</span>
                          )}
                          {entry.metrics.bids !== undefined && (
                            <span>{entry.metrics.bids} bids</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Score */}
                    <div className="text-right shrink-0">
                      <p className="text-sm font-medium text-gray-600">
                        {getScoreLabel()}
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatScore(entry.score)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

function parseLeaderboardData(
  data: any[],
  scoreMetric: string
): LeaderboardEntry[] {
  if (!Array.isArray(data)) return [];

  const entries = data.map((item) => ({
    id: item.id,
    name: item.name || item.campaignName || item.publisher || 'Unknown',
    score: calculateScore(item, scoreMetric),
    metrics: {
      impressions: item.impressions || 0,
      revenue: item.revenue || 0,
      ctr: item.ctr || 0,
      bids: item.bids || 0,
    },
    rank: 0,
    previousRank: item.previousRank,
  }));

  return rankEntries(entries);
}

function calculateScore(data: any, metric: string): number {
  const value = data[metric] || data.score || 0;
  return typeof value === 'number' ? value : parseFloat(value) || 0;
}

function rankEntries(entries: LeaderboardEntry[]): LeaderboardEntry[] {
  // Sort by score descending
  const sorted = [...entries].sort((a, b) => b.score - a.score);

  // Assign ranks
  return sorted.map((entry, index) => ({
    ...entry,
    previousRank: entry.rank || undefined,
    rank: index + 1,
  }));
}

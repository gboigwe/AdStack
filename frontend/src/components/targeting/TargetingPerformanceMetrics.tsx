'use client';

import { useState } from 'react';
import { Activity, TrendingUp, TrendingDown, Minus, Clock, DollarSign, Users, Eye } from 'lucide-react';

interface MetricCard {
  label: string;
  value: string;
  change: number;
  icon: typeof Activity;
  color: string;
}

interface DailyMetric {
  date: string;
  impressions: number;
  matchRate: number;
  ctr: number;
  spend: number;
}

export function TargetingPerformanceMetrics() {
  const [timeRange, setTimeRange] = useState<'7d' | '14d' | '30d'>('7d');

  const metrics: MetricCard[] = [
    { label: 'Avg Match Rate', value: '64.3%', change: 3.2, icon: Activity, color: 'text-blue-600 bg-blue-50' },
    { label: 'Total Reach', value: '142.8K', change: 12.5, icon: Users, color: 'text-green-600 bg-green-50' },
    { label: 'Effective CPM', value: '3.42 STX', change: -1.8, icon: DollarSign, color: 'text-purple-600 bg-purple-50' },
    { label: 'Impressions', value: '892K', change: 8.7, icon: Eye, color: 'text-amber-600 bg-amber-50' },
  ];

  const dailyData: DailyMetric[] = [
    { date: 'Feb 19', impressions: 124000, matchRate: 62.1, ctr: 4.2, spend: 428 },
    { date: 'Feb 20', impressions: 131000, matchRate: 63.5, ctr: 4.5, spend: 445 },
    { date: 'Feb 21', impressions: 118000, matchRate: 61.8, ctr: 4.1, spend: 402 },
    { date: 'Feb 22', impressions: 142000, matchRate: 65.2, ctr: 4.8, spend: 486 },
    { date: 'Feb 23', impressions: 138000, matchRate: 64.9, ctr: 4.6, spend: 472 },
    { date: 'Feb 24', impressions: 129000, matchRate: 63.7, ctr: 4.3, spend: 440 },
    { date: 'Feb 25', impressions: 145000, matchRate: 66.1, ctr: 5.0, spend: 502 },
  ];

  const maxImpressions = Math.max(...dailyData.map((d) => d.impressions));

  const changeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="w-3 h-3 text-green-500" />;
    if (change < 0) return <TrendingDown className="w-3 h-3 text-red-500" />;
    return <Minus className="w-3 h-3 text-gray-400" />;
  };

  const changeColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-500';
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 rounded-lg">
            <Activity className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Performance Metrics</h2>
            <p className="text-sm text-gray-500">Targeting performance over time</p>
          </div>
        </div>
        <div className="flex bg-gray-100 rounded-lg p-0.5">
          {(['7d', '14d', '30d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                timeRange === range ? 'bg-white shadow text-gray-900' : 'text-gray-500'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-6">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="border border-gray-100 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className={`p-1.5 rounded-lg ${m.color.split(' ')[1]}`}>
                  <Icon className={`w-3.5 h-3.5 ${m.color.split(' ')[0]}`} />
                </div>
                <div className={`flex items-center gap-0.5 text-xs ${changeColor(m.change)}`}>
                  {changeIcon(m.change)}
                  {Math.abs(m.change)}%
                </div>
              </div>
              <div className="text-lg font-bold text-gray-900">{m.value}</div>
              <div className="text-[10px] text-gray-400">{m.label}</div>
            </div>
          );
        })}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Daily Breakdown</h3>
        <div className="space-y-2">
          <div className="grid grid-cols-5 gap-2 text-[10px] font-medium text-gray-400 px-3">
            <span>Date</span>
            <span>Impressions</span>
            <span>Match Rate</span>
            <span>CTR</span>
            <span>Spend</span>
          </div>
          {dailyData.map((day) => (
            <div
              key={day.date}
              className="grid grid-cols-5 gap-2 items-center px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="text-xs text-gray-600">{day.date}</span>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-400 rounded-full"
                    style={{ width: `${(day.impressions / maxImpressions) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] text-gray-500 w-8 text-right">
                  {(day.impressions / 1000).toFixed(0)}K
                </span>
              </div>
              <span className="text-xs font-medium text-gray-700">{day.matchRate}%</span>
              <span className="text-xs font-medium text-blue-600">{day.ctr}%</span>
              <span className="text-xs font-medium text-gray-700">{day.spend} STX</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

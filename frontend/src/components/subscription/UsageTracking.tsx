'use client';

import { useState, useEffect } from 'react';
import {
  TrendingUp,
  Activity,
  Database,
  Users,
  Megaphone,
  Eye,
  Zap,
  AlertTriangle,
} from 'lucide-react';
import type { UsageMetrics } from './types';

interface UsageTrackingProps {
  onUpgrade?: () => void;
}

export function UsageTracking({ onUpgrade }: UsageTrackingProps) {
  const [usage, setUsage] = useState<UsageMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('month');

  useEffect(() => {
    loadUsageData();
  }, [timeRange]);

  const loadUsageData = async () => {
    try {
      setLoading(true);
      // TODO: Fetch usage data from API
      // Placeholder data
      setUsage({
        campaigns: { used: 45, limit: 100, percentage: 45 },
        impressions: { used: 850000, limit: 1000000, percentage: 85 },
        apiCalls: { used: 92000, limit: 100000, percentage: 92 },
        storage: { used: 38, limit: 50, percentage: 76 },
        users: { used: 8, limit: 10, percentage: 80 },
      });
    } catch (error) {
      console.error('Failed to load usage data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUsageIcon = (key: string) => {
    const icons = {
      campaigns: Megaphone,
      impressions: Eye,
      apiCalls: Zap,
      storage: Database,
      users: Users,
    };
    return icons[key as keyof typeof icons] || Activity;
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'red';
    if (percentage >= 75) return 'yellow';
    if (percentage >= 50) return 'blue';
    return 'green';
  };

  const getProgressBarColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-600';
    if (percentage >= 75) return 'bg-yellow-600';
    return 'bg-blue-600';
  };

  const getBackgroundColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-50 border-red-200';
    if (percentage >= 75) return 'bg-yellow-50 border-yellow-200';
    return 'bg-white border-gray-200';
  };

  const formatUsageValue = (key: string, value: number) => {
    if (key === 'storage') {
      return `${value} GB`;
    }
    return value.toLocaleString();
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading usage data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Usage Tracking</h1>
          <p className="text-gray-600">Monitor your resource usage and limits</p>
        </div>

        {/* Time Range Selector */}
        <div className="flex items-center bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setTimeRange('day')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              timeRange === 'day'
                ? 'bg-white text-gray-900 shadow'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setTimeRange('week')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              timeRange === 'week'
                ? 'bg-white text-gray-900 shadow'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => setTimeRange('month')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              timeRange === 'month'
                ? 'bg-white text-gray-900 shadow'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            This Month
          </button>
        </div>
      </div>

      {/* Usage Overview Cards */}
      {usage && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {Object.entries(usage).map(([key, metric]) => {
            const Icon = getUsageIcon(key);
            const color = getUsageColor(metric.percentage);
            const isNearLimit = metric.percentage >= 90;

            return (
              <div
                key={key}
                className={`rounded-lg shadow border ${getBackgroundColor(metric.percentage)} p-6 transition-all hover:shadow-lg`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-lg bg-${color}-100`}>
                    <Icon className={`w-6 h-6 text-${color}-600`} />
                  </div>
                  {isNearLimit && (
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  )}
                </div>

                <h3 className="text-sm font-medium text-gray-600 mb-1 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </h3>

                <div className="mb-3">
                  <div className="flex items-baseline">
                    <span className="text-3xl font-bold text-gray-900">
                      {formatUsageValue(key, metric.used)}
                    </span>
                    <span className="ml-2 text-gray-600">
                      / {metric.limit === -1 ? '∞' : formatUsageValue(key, metric.limit)}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${getProgressBarColor(metric.percentage)}`}
                      style={{ width: `${Math.min(metric.percentage, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-900">
                    {metric.limit === -1 ? 'Unlimited' : `${metric.percentage}% used`}
                  </span>
                  {isNearLimit && (
                    <span className="text-xs text-red-600 font-medium">Near limit</span>
                  )}
                </div>

                {isNearLimit && (
                  <div className="mt-3 pt-3 border-t border-red-200">
                    <button
                      onClick={onUpgrade}
                      className="text-sm text-red-700 hover:text-red-800 font-medium"
                    >
                      Upgrade plan →
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Detailed Usage Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Detailed Usage Breakdown</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Resource
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Used
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Limit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Remaining
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {usage &&
                Object.entries(usage).map(([key, metric]) => {
                  const remaining = metric.limit === -1 ? Infinity : metric.limit - metric.used;
                  const statusColor = getUsageColor(metric.percentage);

                  return (
                    <tr key={key} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {(() => {
                            const Icon = getUsageIcon(key);
                            return <Icon className="w-5 h-5 text-gray-400 mr-3" />;
                          })()}
                          <span className="text-sm font-medium text-gray-900 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatUsageValue(key, metric.used)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {metric.limit === -1 ? 'Unlimited' : formatUsageValue(key, metric.limit)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {remaining === Infinity ? '∞' : formatUsageValue(key, remaining)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                            <div
                              className={`h-2 rounded-full ${getProgressBarColor(metric.percentage)}`}
                              style={{ width: `${Math.min(metric.percentage, 100)}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-900">
                            {metric.limit === -1 ? '∞' : `${metric.percentage}%`}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            statusColor === 'red'
                              ? 'bg-red-100 text-red-800'
                              : statusColor === 'yellow'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {statusColor === 'red'
                            ? 'Critical'
                            : statusColor === 'yellow'
                            ? 'Warning'
                            : 'Good'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Usage Tips */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start">
          <TrendingUp className="w-6 h-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Usage Tips</h3>
            <ul className="space-y-1 text-sm text-blue-800">
              <li>• Monitor your usage regularly to avoid hitting limits</li>
              <li>• Consider upgrading if you consistently use over 75% of your resources</li>
              <li>• Usage resets at the start of each billing period</li>
              <li>• Contact support if you need custom limits for your plan</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

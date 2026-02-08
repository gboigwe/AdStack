import React, { useState, useEffect } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import ConnectionStatus from './ConnectionStatus';
import { TrendingUp, TrendingDown, Eye, MousePointer, DollarSign, Activity } from 'lucide-react';

export interface CampaignMetrics {
  impressions: number;
  activeBids: number;
  revenue: number;
  clicks: number;
  ctr: number;
}

export interface LiveCampaignMetricsProps {
  contractId: string;
  campaignId?: string;
  refreshInterval?: number;
  showTrends?: boolean;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: number;
  trendLabel?: string;
  color?: string;
  formatValue?: (value: number) => string;
}

function MetricCard({
  title,
  value,
  icon,
  trend,
  trendLabel,
  color = 'blue',
}: MetricCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>

          {trend !== undefined && (
            <div className="flex items-center mt-2 text-sm">
              {trend >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
              )}
              <span className={trend >= 0 ? 'text-green-600' : 'text-red-600'}>
                {Math.abs(trend).toFixed(1)}%
              </span>
              {trendLabel && (
                <span className="text-gray-500 ml-1">{trendLabel}</span>
              )}
            </div>
          )}
        </div>

        <div className={`p-3 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function LiveCampaignMetrics({
  contractId,
  campaignId,
  refreshInterval = 1000,
  showTrends = true,
}: LiveCampaignMetricsProps) {
  const { isConnected, events, error } = useWebSocket({
    contractId,
    autoConnect: true,
    eventTypes: campaignId ? [`campaign-${campaignId}`] : undefined,
  });

  const [metrics, setMetrics] = useState<CampaignMetrics>({
    impressions: 0,
    activeBids: 0,
    revenue: 0,
    clicks: 0,
    ctr: 0,
  });

  const [previousMetrics, setPreviousMetrics] = useState<CampaignMetrics>(metrics);
  const [trends, setTrends] = useState({
    impressions: 0,
    activeBids: 0,
    revenue: 0,
    clicks: 0,
    ctr: 0,
  });

  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());

  // Update metrics from WebSocket events
  useEffect(() => {
    if (!events.length) return;

    const latestEvent = events[0];
    const { data } = latestEvent;

    setMetrics((prev) => {
      const newMetrics = { ...prev };

      // Update based on event type
      if (data.type === 'impression' || data.impressions !== undefined) {
        newMetrics.impressions = data.impressions || prev.impressions + 1;
      }

      if (data.type === 'bid' || data.activeBids !== undefined) {
        newMetrics.activeBids = data.activeBids || prev.activeBids + 1;
      }

      if (data.type === 'click' || data.clicks !== undefined) {
        newMetrics.clicks = data.clicks || prev.clicks + 1;
      }

      if (data.revenue !== undefined || data.amount !== undefined) {
        newMetrics.revenue = data.revenue || data.amount || prev.revenue;
      }

      // Calculate CTR
      if (newMetrics.impressions > 0) {
        newMetrics.ctr = (newMetrics.clicks / newMetrics.impressions) * 100;
      }

      return newMetrics;
    });

    setLastUpdateTime(new Date());
  }, [events]);

  // Calculate trends periodically
  useEffect(() => {
    if (!showTrends) return;

    const interval = setInterval(() => {
      setTrends({
        impressions: calculateTrend(previousMetrics.impressions, metrics.impressions),
        activeBids: calculateTrend(previousMetrics.activeBids, metrics.activeBids),
        revenue: calculateTrend(previousMetrics.revenue, metrics.revenue),
        clicks: calculateTrend(previousMetrics.clicks, metrics.clicks),
        ctr: calculateTrend(previousMetrics.ctr, metrics.ctr),
      });

      setPreviousMetrics(metrics);
    }, 10000); // Update trends every 10 seconds

    return () => clearInterval(interval);
  }, [metrics, previousMetrics, showTrends]);

  // Auto-refresh display
  useEffect(() => {
    const interval = setInterval(() => {
      // Force re-render to update display
      setLastUpdateTime(new Date());
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatNumber = (value: number): string => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Live Campaign Metrics</h2>
          <p className="text-sm text-gray-500 mt-1">
            Last updated: {lastUpdateTime.toLocaleTimeString()}
          </p>
        </div>
        <ConnectionStatus isConnected={isConnected} />
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <p className="font-medium">Connection Error</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Impressions"
          value={formatNumber(metrics.impressions)}
          icon={<Eye className="h-6 w-6" />}
          trend={showTrends ? trends.impressions : undefined}
          trendLabel="vs last period"
          color="blue"
        />

        <MetricCard
          title="Active Bids"
          value={formatNumber(metrics.activeBids)}
          icon={<Activity className="h-6 w-6" />}
          trend={showTrends ? trends.activeBids : undefined}
          trendLabel="vs last period"
          color="green"
        />

        <MetricCard
          title="Total Revenue"
          value={formatCurrency(metrics.revenue)}
          icon={<DollarSign className="h-6 w-6" />}
          trend={showTrends ? trends.revenue : undefined}
          trendLabel="vs last period"
          color="orange"
        />

        <MetricCard
          title="Click-Through Rate"
          value={`${metrics.ctr.toFixed(2)}%`}
          icon={<MousePointer className="h-6 w-6" />}
          trend={showTrends ? trends.ctr : undefined}
          trendLabel="vs last period"
          color="purple"
        />
      </div>

      {!isConnected && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800 text-sm">
            Waiting for connection... Metrics will update automatically when connected.
          </p>
        </div>
      )}
    </div>
  );
}

function calculateTrend(previous: number, current: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

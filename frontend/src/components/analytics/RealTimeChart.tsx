import React, { useState, useEffect, useMemo } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useWebSocket } from '@/hooks/useWebSocket';
import ConnectionStatus from './ConnectionStatus';
import { Loader2 } from 'lucide-react';

export interface MetricConfig {
  key: string;
  label: string;
  color: string;
  enabled: boolean;
}

export interface RealTimeChartProps {
  contractId: string;
  metrics?: MetricConfig[];
  timeWindow?: 'hour' | 'day';
  chartType?: 'line' | 'area';
  updateInterval?: number;
  maxDataPoints?: number;
  height?: number;
  showLegend?: boolean;
  animationDuration?: number;
}

interface ChartDataPoint {
  timestamp: number;
  time: string;
  [key: string]: number | string;
}

const DEFAULT_METRICS: MetricConfig[] = [
  { key: 'impressions', label: 'Impressions', color: '#3b82f6', enabled: true },
  { key: 'bids', label: 'Bids', color: '#10b981', enabled: true },
  { key: 'revenue', label: 'Revenue', color: '#f59e0b', enabled: true },
];

export default function RealTimeChart({
  contractId,
  metrics = DEFAULT_METRICS,
  timeWindow = 'hour',
  chartType = 'area',
  updateInterval = 1000,
  maxDataPoints = 60,
  height = 400,
  showLegend = true,
  animationDuration = 300,
}: RealTimeChartProps) {
  const { isConnected, events, error } = useWebSocket({
    contractId,
    autoConnect: true,
  });

  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize chart data
  useEffect(() => {
    const now = Date.now();
    const initialData: ChartDataPoint[] = [];

    for (let i = maxDataPoints - 1; i >= 0; i--) {
      const timestamp = now - i * updateInterval;
      initialData.push({
        timestamp,
        time: formatTime(timestamp, timeWindow),
        ...metrics.reduce((acc, metric) => ({ ...acc, [metric.key]: 0 }), {}),
      });
    }

    setChartData(initialData);
    setIsLoading(false);
  }, [maxDataPoints, updateInterval, timeWindow, metrics]);

  // Update chart data with WebSocket events
  useEffect(() => {
    if (!events.length) return;

    const latestEvent = events[0];
    const now = Date.now();

    setChartData((prev) => {
      const newData = [...prev];
      const lastPoint = newData[newData.length - 1];

      // Check if we need to add a new data point
      if (now - lastPoint.timestamp >= updateInterval) {
        // Add new point
        const newPoint: ChartDataPoint = {
          timestamp: now,
          time: formatTime(now, timeWindow),
          ...metrics.reduce((acc, metric) => {
            const value = extractMetricValue(latestEvent.data, metric.key);
            return { ...acc, [metric.key]: value };
          }, {}),
        };

        newData.push(newPoint);

        // Remove oldest point if exceeding max
        if (newData.length > maxDataPoints) {
          newData.shift();
        }
      } else {
        // Update current point
        metrics.forEach((metric) => {
          const currentValue = lastPoint[metric.key] as number;
          const newValue = extractMetricValue(latestEvent.data, metric.key);
          lastPoint[metric.key] = currentValue + newValue;
        });
      }

      return newData;
    });
  }, [events, updateInterval, maxDataPoints, timeWindow, metrics]);

  // Auto-refresh with empty data points
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();

      setChartData((prev) => {
        const lastPoint = prev[prev.length - 1];

        if (now - lastPoint.timestamp >= updateInterval) {
          const newPoint: ChartDataPoint = {
            timestamp: now,
            time: formatTime(now, timeWindow),
            ...metrics.reduce((acc, metric) => ({ ...acc, [metric.key]: 0 }), {}),
          };

          const newData = [...prev, newPoint];

          if (newData.length > maxDataPoints) {
            newData.shift();
          }

          return newData;
        }

        return prev;
      });
    }, updateInterval);

    return () => clearInterval(interval);
  }, [updateInterval, maxDataPoints, timeWindow, metrics]);

  const enabledMetrics = useMemo(
    () => metrics.filter((m) => m.enabled),
    [metrics]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const ChartComponent = chartType === 'line' ? LineChart : AreaChart;
  const DataComponent = chartType === 'line' ? Line : Area;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Real-Time Metrics</h3>
        <ConnectionStatus isConnected={isConnected} />
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          {error}
        </div>
      )}

      <ResponsiveContainer width="100%" height={height}>
        <ChartComponent
          data={chartData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="time"
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
            }}
            labelStyle={{ color: '#374151', fontWeight: 'bold' }}
          />
          {showLegend && <Legend />}

          {enabledMetrics.map((metric) => (
            <DataComponent
              key={metric.key}
              type="monotone"
              dataKey={metric.key}
              stroke={metric.color}
              fill={metric.color}
              fillOpacity={chartType === 'area' ? 0.6 : 1}
              strokeWidth={2}
              name={metric.label}
              animationDuration={animationDuration}
              isAnimationActive={true}
            />
          ))}
        </ChartComponent>
      </ResponsiveContainer>
    </div>
  );
}

function formatTime(timestamp: number, timeWindow: 'hour' | 'day'): string {
  const date = new Date(timestamp);

  if (timeWindow === 'hour') {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function extractMetricValue(data: any, key: string): number {
  if (!data) return 0;

  // Handle nested data structures
  if (data[key] !== undefined) {
    return typeof data[key] === 'number' ? data[key] : parseFloat(data[key]) || 0;
  }

  // Handle common aliases
  const aliases: Record<string, string[]> = {
    impressions: ['impression', 'views', 'view-count'],
    bids: ['bid', 'bid-count', 'total-bids'],
    revenue: ['amount', 'value', 'total-revenue'],
  };

  if (aliases[key]) {
    for (const alias of aliases[key]) {
      if (data[alias] !== undefined) {
        return typeof data[alias] === 'number' ? data[alias] : parseFloat(data[alias]) || 0;
      }
    }
  }

  return 0;
}

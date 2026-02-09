/**
 * React Hook for Usage Tracking and Limits
 * Monitors resource usage and enforces subscription limits
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useWalletStore } from '../store/wallet-store';
import {
  UsageMetrics,
  UsageLimit,
  UsageAlert,
  UsageRecord,
  trackUsage,
  getCurrentUsage,
  checkUsageLimit,
  getUsageHistory,
} from '../lib/subscription';

/**
 * Hook to fetch current usage metrics
 */
export function useUsageMetrics(enabled: boolean = true) {
  const { address, isConnected } = useWalletStore();

  return useQuery<UsageMetrics, Error>({
    queryKey: ['usage', 'metrics', address],
    queryFn: () => getCurrentUsage(address!),
    enabled: enabled && isConnected && !!address,
    staleTime: 60000, // 1 minute
    refetchInterval: 120000, // Refetch every 2 minutes
  });
}

/**
 * Hook to check specific usage limits
 */
export function useUsageLimit(
  resourceType: 'campaigns' | 'impressions' | 'apiCalls' | 'storage' | 'users',
  enabled: boolean = true
) {
  const { address } = useWalletStore();

  return useQuery<UsageLimit, Error>({
    queryKey: ['usage', 'limit', resourceType, address],
    queryFn: () => checkUsageLimit(address!, resourceType),
    enabled: enabled && !!address,
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Hook to track new usage
 */
export function useTrackUsage() {
  const queryClient = useQueryClient();
  const { address } = useWalletStore();

  return useMutation<
    void,
    Error,
    {
      resourceType: 'campaigns' | 'impressions' | 'apiCalls' | 'storage' | 'users';
      amount: number;
      metadata?: Record<string, any>;
    }
  >({
    mutationFn: async ({ resourceType, amount, metadata }) => {
      if (!address) throw new Error('Wallet not connected');
      await trackUsage(address, resourceType, amount, metadata);
    },
    onSuccess: (_, variables) => {
      // Invalidate usage queries
      queryClient.invalidateQueries({
        queryKey: ['usage', 'metrics'],
      });
      queryClient.invalidateQueries({
        queryKey: ['usage', 'limit', variables.resourceType],
      });
    },
  });
}

/**
 * Hook to fetch usage history
 */
export function useUsageHistory(
  startDate?: Date,
  endDate?: Date,
  enabled: boolean = true
) {
  const { address } = useWalletStore();

  return useQuery<UsageRecord[], Error>({
    queryKey: ['usage', 'history', address, startDate, endDate],
    queryFn: () => getUsageHistory(address!, startDate, endDate),
    enabled: enabled && !!address,
    staleTime: 300000, // 5 minutes
  });
}

/**
 * Hook for usage alerts
 */
export function useUsageAlerts() {
  const [alerts, setAlerts] = useState<UsageAlert[]>([]);
  const { data: metrics, isLoading } = useUsageMetrics();

  useEffect(() => {
    if (!metrics) return;

    const newAlerts: UsageAlert[] = [];
    const now = Date.now();

    // Check campaigns usage
    if (metrics.campaigns.percentage >= 90) {
      newAlerts.push({
        id: `campaigns-${now}`,
        type: 'usage_limit',
        resourceType: 'campaigns',
        severity: metrics.campaigns.percentage >= 100 ? 'error' : 'warning',
        title: 'Campaign Limit Reached',
        message: `You've used ${metrics.campaigns.used} of ${metrics.campaigns.limit} campaigns (${metrics.campaigns.percentage.toFixed(1)}%)`,
        percentage: metrics.campaigns.percentage,
        current: metrics.campaigns.used,
        limit: metrics.campaigns.limit,
        timestamp: now,
        dismissed: false,
      });
    }

    // Check impressions usage
    if (metrics.impressions.percentage >= 80) {
      newAlerts.push({
        id: `impressions-${now}`,
        type: 'usage_limit',
        resourceType: 'impressions',
        severity: metrics.impressions.percentage >= 100 ? 'error' : 'warning',
        title: 'Impression Limit Warning',
        message: `You've used ${metrics.impressions.used.toLocaleString()} of ${metrics.impressions.limit.toLocaleString()} impressions (${metrics.impressions.percentage.toFixed(1)}%)`,
        percentage: metrics.impressions.percentage,
        current: metrics.impressions.used,
        limit: metrics.impressions.limit,
        timestamp: now,
        dismissed: false,
      });
    }

    // Check API calls usage
    if (metrics.apiCalls.percentage >= 80) {
      newAlerts.push({
        id: `apiCalls-${now}`,
        type: 'usage_limit',
        resourceType: 'apiCalls',
        severity: metrics.apiCalls.percentage >= 100 ? 'error' : 'warning',
        title: 'API Calls Limit Warning',
        message: `You've used ${metrics.apiCalls.used.toLocaleString()} of ${metrics.apiCalls.limit.toLocaleString()} API calls (${metrics.apiCalls.percentage.toFixed(1)}%)`,
        percentage: metrics.apiCalls.percentage,
        current: metrics.apiCalls.used,
        limit: metrics.apiCalls.limit,
        timestamp: now,
        dismissed: false,
      });
    }

    // Check storage usage
    if (metrics.storage.percentage >= 85) {
      newAlerts.push({
        id: `storage-${now}`,
        type: 'usage_limit',
        resourceType: 'storage',
        severity: metrics.storage.percentage >= 100 ? 'error' : 'warning',
        title: 'Storage Limit Warning',
        message: `You've used ${metrics.storage.used.toFixed(2)} GB of ${metrics.storage.limit} GB storage (${metrics.storage.percentage.toFixed(1)}%)`,
        percentage: metrics.storage.percentage,
        current: metrics.storage.used,
        limit: metrics.storage.limit,
        timestamp: now,
        dismissed: false,
      });
    }

    // Check users usage
    if (metrics.users.percentage >= 90) {
      newAlerts.push({
        id: `users-${now}`,
        type: 'usage_limit',
        resourceType: 'users',
        severity: metrics.users.percentage >= 100 ? 'error' : 'warning',
        title: 'User Limit Reached',
        message: `You've added ${metrics.users.used} of ${metrics.users.limit} users (${metrics.users.percentage.toFixed(1)}%)`,
        percentage: metrics.users.percentage,
        current: metrics.users.used,
        limit: metrics.users.limit,
        timestamp: now,
        dismissed: false,
      });
    }

    setAlerts(newAlerts);
  }, [metrics]);

  const dismissAlert = useCallback((alertId: string) => {
    setAlerts((prev) =>
      prev.map((alert) =>
        alert.id === alertId ? { ...alert, dismissed: true } : alert
      )
    );
  }, []);

  const clearDismissedAlerts = useCallback(() => {
    setAlerts((prev) => prev.filter((alert) => !alert.dismissed));
  }, []);

  return {
    alerts: alerts.filter((a) => !a.dismissed),
    allAlerts: alerts,
    dismissAlert,
    clearDismissedAlerts,
    hasAlerts: alerts.some((a) => !a.dismissed),
    criticalAlerts: alerts.filter((a) => !a.dismissed && a.severity === 'error'),
    warningAlerts: alerts.filter((a) => !a.dismissed && a.severity === 'warning'),
  };
}

/**
 * Hook to check if user can perform action based on usage
 */
export function useCanPerformAction(
  resourceType: 'campaigns' | 'impressions' | 'apiCalls' | 'storage' | 'users',
  amount: number = 1
) {
  const { data: limit, isLoading } = useUsageLimit(resourceType);
  const [canPerform, setCanPerform] = useState<boolean>(true);
  const [reason, setReason] = useState<string | null>(null);

  useEffect(() => {
    if (!limit) return;

    const wouldExceed = limit.current + amount > limit.limit;

    if (wouldExceed) {
      setCanPerform(false);
      setReason(
        `This action would exceed your ${resourceType} limit. Current: ${limit.current}, Limit: ${limit.limit}, Requested: ${amount}`
      );
    } else {
      setCanPerform(true);
      setReason(null);
    }
  }, [limit, amount, resourceType]);

  return {
    canPerform,
    reason,
    isLoading,
    remaining: limit ? limit.limit - limit.current : 0,
    limit: limit?.limit || 0,
    current: limit?.current || 0,
  };
}

/**
 * Hook for real-time usage monitoring with auto-refresh
 */
export function useUsageMonitor(
  options: {
    refreshInterval?: number; // in ms
    alertThreshold?: number; // percentage (0-100)
    enableNotifications?: boolean;
  } = {}
) {
  const {
    refreshInterval = 60000, // 1 minute default
    alertThreshold = 80,
    enableNotifications = true,
  } = options;

  const { data: metrics, isLoading, refetch } = useUsageMetrics();
  const { alerts, hasAlerts } = useUsageAlerts();
  const [lastNotificationTime, setLastNotificationTime] = useState<number>(0);

  // Auto-refresh
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refetch, refreshInterval]);

  // Show browser notifications for critical alerts
  useEffect(() => {
    if (!enableNotifications || !hasAlerts) return;

    const criticalAlerts = alerts.filter((a) => a.severity === 'error');
    const now = Date.now();

    // Throttle notifications to once every 5 minutes
    if (criticalAlerts.length > 0 && now - lastNotificationTime > 300000) {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('AdStack Usage Alert', {
          body: criticalAlerts[0].message,
          icon: '/logo.png',
          tag: 'usage-alert',
        });
        setLastNotificationTime(now);
      }
    }
  }, [alerts, hasAlerts, enableNotifications, lastNotificationTime]);

  // Request notification permission on mount
  useEffect(() => {
    if (enableNotifications && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, [enableNotifications]);

  return {
    metrics,
    alerts,
    hasAlerts,
    isLoading,
    refetch,
  };
}

/**
 * Hook for usage trends and analytics
 */
export function useUsageTrends(days: number = 30) {
  const { address } = useWalletStore();
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data: history, isLoading } = useUsageHistory(startDate, endDate);

  const [trends, setTrends] = useState<{
    campaigns: { date: string; value: number }[];
    impressions: { date: string; value: number }[];
    apiCalls: { date: string; value: number }[];
    storage: { date: string; value: number }[];
    users: { date: string; value: number }[];
  } | null>(null);

  useEffect(() => {
    if (!history || history.length === 0) return;

    // Group by date and resource type
    const grouped = history.reduce(
      (acc, record) => {
        const date = new Date(record.timestamp).toISOString().split('T')[0];
        const key = record.resourceType;

        if (!acc[key]) {
          acc[key] = {};
        }

        if (!acc[key][date]) {
          acc[key][date] = 0;
        }

        acc[key][date] += record.amount;

        return acc;
      },
      {} as Record<string, Record<string, number>>
    );

    // Convert to array format for charting
    const convertToArray = (data: Record<string, number>) =>
      Object.entries(data)
        .map(([date, value]) => ({ date, value }))
        .sort((a, b) => a.date.localeCompare(b.date));

    setTrends({
      campaigns: convertToArray(grouped.campaigns || {}),
      impressions: convertToArray(grouped.impressions || {}),
      apiCalls: convertToArray(grouped.apiCalls || {}),
      storage: convertToArray(grouped.storage || {}),
      users: convertToArray(grouped.users || {}),
    });
  }, [history]);

  return {
    trends,
    isLoading,
    history,
  };
}

/**
 * Combined hook for complete usage management
 */
export function useUsageManager() {
  const metrics = useUsageMetrics();
  const trackMutation = useTrackUsage();
  const { alerts, dismissAlert, hasAlerts, criticalAlerts, warningAlerts } = useUsageAlerts();
  const trends = useUsageTrends();

  const trackCampaign = useCallback(() => {
    trackMutation.mutate({ resourceType: 'campaigns', amount: 1 });
  }, [trackMutation]);

  const trackImpressions = useCallback((count: number) => {
    trackMutation.mutate({ resourceType: 'impressions', amount: count });
  }, [trackMutation]);

  const trackApiCall = useCallback(() => {
    trackMutation.mutate({ resourceType: 'apiCalls', amount: 1 });
  }, [trackMutation]);

  const trackStorage = useCallback((sizeInGB: number) => {
    trackMutation.mutate({ resourceType: 'storage', amount: sizeInGB });
  }, [trackMutation]);

  const trackUser = useCallback(() => {
    trackMutation.mutate({ resourceType: 'users', amount: 1 });
  }, [trackMutation]);

  return {
    // Data
    metrics: metrics.data,
    alerts,
    criticalAlerts,
    warningAlerts,
    hasAlerts,
    trends: trends.trends,

    // Loading states
    isLoading: metrics.isLoading || trends.isLoading,
    isTracking: trackMutation.isPending,

    // Actions
    trackCampaign,
    trackImpressions,
    trackApiCall,
    trackStorage,
    trackUser,
    dismissAlert,

    // Errors
    error: metrics.error || trackMutation.error,

    // Utilities
    refetch: metrics.refetch,
  };
}

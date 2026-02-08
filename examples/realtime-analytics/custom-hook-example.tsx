/**
 * Custom Hook Integration Example
 *
 * This example demonstrates how to use the useWebSocket hook
 * to build custom real-time components.
 */

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useWebSocket, WebSocketEvent } from '@/hooks/useWebSocket';
import { Bell, TrendingUp, TrendingDown } from 'lucide-react';

interface CampaignStats {
  impressions: number;
  clicks: number;
  revenue: number;
  ctr: number;
  trend: 'up' | 'down' | 'neutral';
}

export function CustomMetricsComponent() {
  const contractId = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.campaigns';

  // Use the WebSocket hook
  const {
    isConnected,
    events,
    latestEvent,
    error,
    subscribe,
    unsubscribe,
    getHistory,
    clearEvents,
  } = useWebSocket({
    contractId,
    eventTypes: ['campaign_created', 'impression_tracked', 'click_tracked'],
    autoConnect: true,
  });

  const [stats, setStats] = useState<CampaignStats>({
    impressions: 0,
    clicks: 0,
    revenue: 0,
    ctr: 0,
    trend: 'neutral',
  });

  const [notifications, setNotifications] = useState<string[]>([]);

  // Process events and update stats
  useEffect(() => {
    if (!latestEvent) return;

    setStats((prev) => {
      let newStats = { ...prev };

      switch (latestEvent.type) {
        case 'impression_tracked':
          newStats.impressions += 1;
          break;
        case 'click_tracked':
          newStats.clicks += 1;
          break;
        case 'payment_processed':
          newStats.revenue += latestEvent.data?.amount || 0;
          break;
      }

      // Calculate CTR
      newStats.ctr = newStats.impressions > 0
        ? (newStats.clicks / newStats.impressions) * 100
        : 0;

      // Determine trend
      if (newStats.impressions > prev.impressions + 5) {
        newStats.trend = 'up';
      } else if (newStats.impressions < prev.impressions) {
        newStats.trend = 'down';
      } else {
        newStats.trend = 'neutral';
      }

      return newStats;
    });

    // Add notification for important events
    if (latestEvent.type === 'campaign_created') {
      setNotifications((prev) => [
        `New campaign created: ${latestEvent.data?.name || 'Unknown'}`,
        ...prev.slice(0, 4), // Keep last 5 notifications
      ]);
    }
  }, [latestEvent]);

  // Load historical data on mount
  useEffect(() => {
    if (isConnected) {
      getHistory(contractId, 50);
    }
  }, [isConnected, contractId, getHistory]);

  const handleSubscribeChange = () => {
    if (isConnected) {
      unsubscribe(contractId);
    } else {
      subscribe(contractId, ['campaign_created', 'impression_tracked']);
    }
  };

  const handleClearData = () => {
    clearEvents();
    setStats({
      impressions: 0,
      clicks: 0,
      revenue: 0,
      ctr: 0,
      trend: 'neutral',
    });
    setNotifications([]);
  };

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Custom Metrics Dashboard</span>
            <Badge variant={isConnected ? 'default' : 'destructive'}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="text-red-500 mb-4">
              Error: {error}
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={handleSubscribeChange} variant="outline">
              {isConnected ? 'Unsubscribe' : 'Subscribe'}
            </Button>
            <Button onClick={handleClearData} variant="outline">
              Clear Data
            </Button>
            <Button onClick={() => getHistory(contractId, 50)} variant="outline">
              Refresh History
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Real-time Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Impressions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.impressions.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              {stats.trend === 'up' && <TrendingUp className="h-3 w-3 text-green-500 mr-1" />}
              {stats.trend === 'down' && <TrendingDown className="h-3 w-3 text-red-500 mr-1" />}
              <span>{stats.trend === 'up' ? 'Increasing' : stats.trend === 'down' ? 'Decreasing' : 'Stable'}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Clicks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.clicks.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              From {events.length} events
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Click-Through Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.ctr.toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.clicks}/{stats.impressions}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.revenue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Live updates
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Notifications */}
      {notifications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Recent Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {notifications.map((notification, index) => (
                <li
                  key={index}
                  className="text-sm p-2 bg-muted rounded-md"
                >
                  {notification}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Recent Events */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Events ({events.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {events.slice(0, 10).map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between p-2 bg-muted rounded-md text-sm"
              >
                <div>
                  <span className="font-medium">{event.type}</span>
                  <span className="text-muted-foreground ml-2">
                    Block #{event.blockHeight}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(event.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

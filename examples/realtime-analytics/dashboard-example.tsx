/**
 * Complete Dashboard Example
 *
 * This example shows how to build a complete real-time analytics dashboard
 * combining multiple components from the AdStack real-time analytics system.
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LiveCampaignMetrics,
  RealTimeChart,
  LiveBiddingInterface,
  RealTimeLeaderboard,
  ActivityFeed,
  ConnectionStatus,
} from '@/components/analytics';
import { useWebSocket } from '@/hooks/useWebSocket';

// Contract IDs for different services
const CONTRACTS = {
  campaigns: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.campaign-orchestrator',
  auctions: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.auction-engine',
  bridge: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.cross-chain-bridge',
  payments: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.payment-processor',
  governance: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.governance-dao',
};

export default function RealtimeAnalyticsDashboard() {
  const { isConnected, events, error } = useWebSocket({
    contractId: CONTRACTS.campaigns,
    autoConnect: true,
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Real-Time Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Live updates from the AdStack blockchain
          </p>
        </div>
        <ConnectionStatus isConnected={isConnected} showText={true} />
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-500">
          <CardContent className="pt-6">
            <p className="text-red-500">WebSocket Error: {error}</p>
          </CardContent>
        </Card>
      )}

      {/* Campaign Overview */}
      <LiveCampaignMetrics
        contractId={CONTRACTS.campaigns}
        refreshInterval={1000}
      />

      {/* Tabbed Interface */}
      <Tabs defaultValue="charts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="charts">Charts</TabsTrigger>
          <TabsTrigger value="bidding">Live Bidding</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="activity">Activity Feed</TabsTrigger>
        </TabsList>

        {/* Charts Tab */}
        <TabsContent value="charts" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Impressions Over Time</CardTitle>
                <CardDescription>Last hour of impression data</CardDescription>
              </CardHeader>
              <CardContent>
                <RealTimeChart
                  contractId={CONTRACTS.campaigns}
                  metric="impressions"
                  timeWindow="hour"
                  chartType="area"
                  height={300}
                  maxDataPoints={60}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
                <CardDescription>Real-time revenue tracking</CardDescription>
              </CardHeader>
              <CardContent>
                <RealTimeChart
                  contractId={CONTRACTS.campaigns}
                  metric="revenue"
                  timeWindow="hour"
                  chartType="line"
                  height={300}
                  maxDataPoints={60}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Click-Through Rate</CardTitle>
                <CardDescription>CTR performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <RealTimeChart
                  contractId={CONTRACTS.campaigns}
                  metric="ctr"
                  timeWindow="day"
                  chartType="area"
                  height={300}
                  maxDataPoints={24}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Active Bids</CardTitle>
                <CardDescription>Bidding activity over time</CardDescription>
              </CardHeader>
              <CardContent>
                <RealTimeChart
                  contractId={CONTRACTS.auctions}
                  metric="bids"
                  timeWindow="hour"
                  chartType="line"
                  height={300}
                  maxDataPoints={60}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Bidding Tab */}
        <TabsContent value="bidding">
          <Card>
            <CardHeader>
              <CardTitle>Live Auction Activity</CardTitle>
              <CardDescription>
                Real-time bidding updates with notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LiveBiddingInterface
                contractId={CONTRACTS.auctions}
                enableNotifications={true}
                enableSound={true}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leaderboard Tab */}
        <TabsContent value="leaderboard" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Campaigns</CardTitle>
                <CardDescription>By revenue generated</CardDescription>
              </CardHeader>
              <CardContent>
                <RealTimeLeaderboard
                  contractId={CONTRACTS.campaigns}
                  type="campaigns"
                  scoreMetric="revenue"
                  limit={10}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Publishers</CardTitle>
                <CardDescription>By impression count</CardDescription>
              </CardHeader>
              <CardContent>
                <RealTimeLeaderboard
                  contractId={CONTRACTS.campaigns}
                  type="publishers"
                  scoreMetric="impressions"
                  limit={10}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Activity Feed Tab */}
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Live Event Stream</CardTitle>
              <CardDescription>
                All blockchain events in real-time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ActivityFeed
                contractId={CONTRACTS.campaigns}
                autoScroll={true}
                maxEvents={100}
                height={600}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Connection Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{events.length}</p>
              <p className="text-sm text-muted-foreground">Events Received</p>
            </div>
            <div>
              <p className="text-2xl font-bold">
                {isConnected ? 'Active' : 'Inactive'}
              </p>
              <p className="text-sm text-muted-foreground">Connection Status</p>
            </div>
            <div>
              <p className="text-2xl font-bold">&lt;1s</p>
              <p className="text-sm text-muted-foreground">Average Latency</p>
            </div>
            <div>
              <p className="text-2xl font-bold">100%</p>
              <p className="text-sm text-muted-foreground">Uptime</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

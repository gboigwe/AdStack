/**
 * AdStack Real-Time Analytics Components
 *
 * Comprehensive suite of real-time visualization components
 * for the AdStack blockchain advertising platform.
 *
 * @module analytics
 * @see {@link https://docs.adstack.io/realtime|Real-Time Analytics Documentation}
 */

// Core Components
export { default as RealTimeChart } from './RealTimeChart';
export type { RealTimeChartProps, MetricConfig } from './RealTimeChart';

export { default as LiveCampaignMetrics } from './LiveCampaignMetrics';
export type { LiveCampaignMetricsProps, CampaignMetrics } from './LiveCampaignMetrics';

export { default as LiveBiddingInterface } from './LiveBiddingInterface';
export type { LiveBiddingInterfaceProps, Bid } from './LiveBiddingInterface';

export { default as RealTimeLeaderboard } from './RealTimeLeaderboard';
export type { RealTimeLeaderboardProps, LeaderboardEntry } from './RealTimeLeaderboard';

export { default as ActivityFeed } from './ActivityFeed';
export type { ActivityFeedProps } from './ActivityFeed';

export { default as ConnectionStatus } from './ConnectionStatus';

/**
 * Component Overview
 *
 * ConnectionStatus - Visual WebSocket connection indicator
 * - Shows connection state (connected/connecting/disconnected)
 * - Optional text display
 * - Animated icons
 *
 * RealTimeChart - Time-series data visualization
 * - Recharts-based area/line charts
 * - Auto-updating from WebSocket events
 * - Configurable metrics and time windows
 *
 * LiveCampaignMetrics - Real-time KPI dashboard
 * - 4 metric cards (Impressions, Bids, Revenue, CTR)
 * - Trend indicators
 * - Responsive grid layout
 *
 * LiveBiddingInterface - Auction activity monitor
 * - Current highest bid tracking
 * - Bid trend visualization
 * - Toast and browser notifications
 *
 * RealTimeLeaderboard - Dynamic ranking system
 * - Top 10 campaigns/publishers
 * - Animated rank changes
 * - Multiple scoring metrics
 *
 * ActivityFeed - Event stream viewer
 * - Live event display
 * - Event type filtering
 * - Auto-scroll toggle
 *
 * @example
 * ```tsx
 * import {
 *   LiveCampaignMetrics,
 *   RealTimeChart,
 *   LiveBiddingInterface
 * } from '@/components/analytics';
 *
 * function Dashboard() {
 *   const contractId = 'ST1...campaigns';
 *
 *   return (
 *     <div>
 *       <LiveCampaignMetrics contractId={contractId} />
 *       <RealTimeChart
 *         contractId={contractId}
 *         metric="impressions"
 *         timeWindow="hour"
 *       />
 *       <LiveBiddingInterface contractId={contractId} />
 *     </div>
 *   );
 * }
 * ```
 */

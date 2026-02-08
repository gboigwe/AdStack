# AdStack Real-Time Analytics Components

Comprehensive real-time analytics components for monitoring campaigns, bids, and system activity using WebSocket connections.

## Installation

First, install the required dependencies:

```bash
npm install recharts
```

## Components

### 1. RealTimeChart

A configurable real-time chart component using Recharts for visualizing metrics over time.

**Features:**
- Auto-updating data from WebSocket
- Configurable metrics (impressions, bids, revenue)
- Time-based x-axis (last hour/day)
- Smooth animations
- Responsive design
- Support for line and area charts

**Usage:**

```tsx
import { RealTimeChart } from '@/components/analytics';

function Dashboard() {
  return (
    <RealTimeChart
      contractId="ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.adstack-core"
      metrics={[
        { key: 'impressions', label: 'Impressions', color: '#3b82f6', enabled: true },
        { key: 'bids', label: 'Bids', color: '#10b981', enabled: true },
        { key: 'revenue', label: 'Revenue', color: '#f59e0b', enabled: true },
      ]}
      timeWindow="hour"
      chartType="area"
      height={400}
      showLegend={true}
    />
  );
}
```

**Props:**
- `contractId` (required): Stacks contract ID to monitor
- `metrics`: Array of metric configurations
- `timeWindow`: 'hour' | 'day' - Time range for x-axis
- `chartType`: 'line' | 'area' - Chart visualization type
- `updateInterval`: Update frequency in milliseconds (default: 1000)
- `maxDataPoints`: Maximum data points to display (default: 60)
- `height`: Chart height in pixels (default: 400)
- `showLegend`: Show/hide chart legend (default: true)
- `animationDuration`: Animation duration in milliseconds (default: 300)

---

### 2. LiveCampaignMetrics

Real-time campaign dashboard showing key performance metrics.

**Features:**
- Live impression count
- Active bids tracking
- Revenue monitoring
- CTR percentage calculation
- Trend indicators
- Auto-refresh every second

**Usage:**

```tsx
import { LiveCampaignMetrics } from '@/components/analytics';

function CampaignDashboard() {
  return (
    <LiveCampaignMetrics
      contractId="ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.adstack-core"
      campaignId="campaign-123"
      refreshInterval={1000}
      showTrends={true}
    />
  );
}
```

**Props:**
- `contractId` (required): Stacks contract ID
- `campaignId`: Specific campaign to monitor
- `refreshInterval`: Display refresh interval in milliseconds (default: 1000)
- `showTrends`: Show trend indicators (default: true)

---

### 3. LiveBiddingInterface

Real-time bidding activity monitor with bid stream and trend visualization.

**Features:**
- Live bid stream
- Bid history table
- Current highest bid display
- Bid trend chart
- Toast notifications for new bids
- Notification permission handling

**Usage:**

```tsx
import { LiveBiddingInterface } from '@/components/analytics';

function BiddingDashboard() {
  return (
    <LiveBiddingInterface
      contractId="ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.adstack-core"
      maxBids={50}
      maxHistoryPoints={20}
      showNotifications={true}
      enableSound={false}
    />
  );
}
```

**Props:**
- `contractId` (required): Stacks contract ID
- `maxBids`: Maximum bids to display in stream (default: 50)
- `maxHistoryPoints`: Maximum points in trend chart (default: 20)
- `showNotifications`: Enable browser notifications (default: true)
- `enableSound`: Enable sound notifications (default: false)

---

### 4. RealTimeLeaderboard

Live leaderboard component showing top campaigns or publishers.

**Features:**
- Top campaigns/publishers ranking
- Real-time position updates
- Animated rank changes
- Performance metrics display
- Configurable scoring metric

**Usage:**

```tsx
import { RealTimeLeaderboard } from '@/components/analytics';

function Leaderboard() {
  return (
    <RealTimeLeaderboard
      contractId="ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.adstack-core"
      type="campaigns"
      maxEntries={10}
      scoreMetric="revenue"
      showMetrics={true}
    />
  );
}
```

**Props:**
- `contractId` (required): Stacks contract ID
- `type`: 'campaigns' | 'publishers' - Entity type to rank (default: 'campaigns')
- `maxEntries`: Maximum entries to display (default: 10)
- `scoreMetric`: 'revenue' | 'impressions' | 'ctr' | 'bids' - Metric for ranking (default: 'revenue')
- `showMetrics`: Show detailed metrics (default: true)
- `animationDuration`: Rank change animation duration (default: 500)

---

### 5. ActivityFeed

Live activity stream showing real-time events.

**Features:**
- Real-time event feed
- Event type filtering
- Timestamp display
- Auto-scroll to latest
- Event icons and colors
- Event grouping support

**Usage:**

```tsx
import { ActivityFeed } from '@/components/analytics';

function EventMonitor() {
  return (
    <ActivityFeed
      contractId="ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.adstack-core"
      maxEvents={100}
      autoScroll={true}
      showFilters={true}
      height={600}
    />
  );
}
```

**Props:**
- `contractId` (required): Stacks contract ID
- `maxEvents`: Maximum events to store (default: 100)
- `autoScroll`: Auto-scroll to latest event (default: true)
- `showFilters`: Show filter dropdown (default: true)
- `enableGrouping`: Group similar events (default: false)
- `height`: Feed container height in pixels (default: 600)

---

### 6. ConnectionStatus

WebSocket connection status indicator.

**Features:**
- Live connection status
- Connecting state
- Visual indicators
- Customizable display

**Usage:**

```tsx
import { ConnectionStatus } from '@/components/analytics';

function Header() {
  const { isConnected } = useWebSocket({ contractId: 'your-contract-id' });

  return (
    <div>
      <ConnectionStatus isConnected={isConnected} showText={true} />
    </div>
  );
}
```

**Props:**
- `isConnected` (required): Connection status
- `isConnecting`: Connecting state (default: false)
- `showText`: Show status text (default: true)

---

## Common Features

All analytics components include:

- **useWebSocket Integration**: Automatic connection management
- **ConnectionStatus Indicator**: Visual connection feedback
- **Error Handling**: Graceful error display
- **Loading States**: Loading indicators
- **Responsive Design**: Mobile-friendly layouts
- **TypeScript Support**: Full type definitions
- **Accessibility**: ARIA labels and keyboard navigation

## WebSocket Event Format

Components expect WebSocket events in the following format:

```typescript
interface WebSocketEvent {
  id: string;
  type: string;
  contractId: string;
  txId: string;
  blockHeight: number;
  timestamp: number;
  data: {
    type?: string;
    impressions?: number;
    clicks?: number;
    bids?: number;
    revenue?: number;
    amount?: number;
    campaignId?: string;
    campaignName?: string;
    bidder?: string;
    publisher?: string;
    // ... other custom fields
  };
}
```

## Example: Complete Analytics Dashboard

```tsx
import {
  RealTimeChart,
  LiveCampaignMetrics,
  LiveBiddingInterface,
  RealTimeLeaderboard,
  ActivityFeed,
} from '@/components/analytics';

export default function AnalyticsDashboard() {
  const contractId = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.adstack-core';

  return (
    <div className="p-6 space-y-6">
      {/* Campaign Metrics Overview */}
      <LiveCampaignMetrics contractId={contractId} />

      {/* Real-Time Chart */}
      <RealTimeChart
        contractId={contractId}
        timeWindow="hour"
        chartType="area"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bidding Activity */}
        <LiveBiddingInterface contractId={contractId} />

        {/* Leaderboard */}
        <RealTimeLeaderboard
          contractId={contractId}
          type="campaigns"
          scoreMetric="revenue"
        />
      </div>

      {/* Activity Feed */}
      <ActivityFeed
        contractId={contractId}
        showFilters={true}
        autoScroll={true}
      />
    </div>
  );
}
```

## Styling

Components use Tailwind CSS classes and assume the following color palette:

- Blue: `#3b82f6` - Primary/Impressions
- Green: `#10b981` - Success/Bids
- Orange: `#f59e0b` - Warning/Revenue
- Purple: `#8b5cf6` - CTR
- Red: `#ef4444` - Errors
- Gray: `#6b7280` - Secondary text

## Browser Notifications

For `LiveBiddingInterface` notifications to work:

1. Request permission on user interaction
2. Ensure HTTPS in production
3. Provide notification sound file at `/notification-sound.mp3` (optional)
4. Provide notification icon at `/notification-icon.png` (optional)

## Performance Considerations

- **maxDataPoints/maxEvents**: Limit stored data to prevent memory issues
- **updateInterval**: Balance between real-time updates and performance
- **Auto-scroll**: Disable if causing performance issues with many events
- **Filters**: Use event type filtering to reduce rendered events

## Troubleshooting

### WebSocket not connecting
- Check `contractId` is valid
- Verify WebSocket server is running
- Check browser console for errors

### No data displaying
- Verify WebSocket events match expected format
- Check event type filtering
- Ensure contract is emitting events

### High CPU usage
- Reduce `updateInterval`
- Decrease `maxDataPoints` or `maxEvents`
- Disable animations (`animationDuration={0}`)

## License

Part of AdStack project.

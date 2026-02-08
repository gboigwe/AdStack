# Real-Time Analytics Examples

This directory contains practical examples demonstrating how to use the AdStack Real-Time WebSocket Analytics system.

## Examples

### 1. Complete Dashboard (`dashboard-example.tsx`)

A fully-featured real-time analytics dashboard that combines all available components:

- **Features**:
  - Live campaign metrics with 4 KPI cards
  - Multiple real-time charts (impressions, revenue, CTR, bids)
  - Tabbed interface for different views
  - Live bidding interface with notifications
  - Dual leaderboards (campaigns and publishers)
  - Activity feed for all events
  - Connection status indicator
  - Error handling

- **Usage**:
  ```tsx
  import RealtimeAnalyticsDashboard from './dashboard-example';

  function App() {
    return <RealtimeAnalyticsDashboard />;
  }
  ```

- **Key Concepts**:
  - Component composition
  - WebSocket connection management
  - Multi-contract monitoring
  - Responsive grid layouts

### 2. Custom Hook Integration (`custom-hook-example.tsx`)

Demonstrates how to build custom components using the `useWebSocket` hook:

- **Features**:
  - Direct hook usage for custom logic
  - Real-time stats calculation
  - Event processing and aggregation
  - Manual subscription control
  - Notification system
  - Historical data loading

- **Usage**:
  ```tsx
  import { CustomMetricsComponent } from './custom-hook-example';

  function MyDashboard() {
    return <CustomMetricsComponent />;
  }
  ```

- **Key Concepts**:
  - `useWebSocket` hook API
  - Event filtering
  - State management
  - Subscribe/unsubscribe patterns
  - History retrieval

### 3. Toast Notifications (`notification-example.tsx`)

Shows how to integrate toast notifications with WebSocket events:

- **Features**:
  - Event-based toast notifications
  - Custom notification styling per event type
  - Sound notifications
  - Browser notification permission handling
  - Configurable notification settings
  - Smart notification throttling (e.g., every 100th impression)

- **Usage**:
  ```tsx
  import { NotificationExample } from './notification-example';

  function App() {
    return <NotificationExample />;
  }
  ```

- **Key Concepts**:
  - Toast integration
  - Sound alerts
  - Browser Notifications API
  - Event filtering for notifications
  - User preferences

## Getting Started

### Prerequisites

```bash
# Install dependencies
cd frontend
npm install socket.io-client recharts

# Ensure WebSocket server is running
cd ../websocket-server
npm install
npm run dev
```

### Configuration

Create `.env` file in `frontend/`:

```env
VITE_WS_URL=http://localhost:3002
```

### Running Examples

1. **Import into your project**:
   ```tsx
   import RealtimeAnalyticsDashboard from '@/examples/realtime-analytics/dashboard-example';
   ```

2. **Add to your router**:
   ```tsx
   <Route path="/analytics" element={<RealtimeAnalyticsDashboard />} />
   ```

3. **Use components directly**:
   ```tsx
   import { CustomMetricsComponent } from '@/examples/realtime-analytics/custom-hook-example';

   function MyPage() {
     return (
       <div>
         <h1>My Analytics</h1>
         <CustomMetricsComponent />
       </div>
     );
   }
   ```

## Common Patterns

### 1. Multiple Contract Monitoring

```tsx
const CONTRACTS = {
  campaigns: 'ST1...campaigns',
  auctions: 'ST1...auctions',
  payments: 'ST1...payments',
};

// Monitor campaigns
const campaignWS = useWebSocket({ contractId: CONTRACTS.campaigns });

// Monitor auctions
const auctionWS = useWebSocket({ contractId: CONTRACTS.auctions });
```

### 2. Event Filtering

```tsx
const { events } = useWebSocket({
  contractId: 'ST1...campaigns',
  eventTypes: ['campaign_created', 'campaign_updated'], // Only these events
});
```

### 3. Manual Connection Control

```tsx
const { subscribe, unsubscribe } = useWebSocket({
  autoConnect: false, // Don't connect automatically
});

// Connect when needed
useEffect(() => {
  if (userIsAuthenticated) {
    subscribe(contractId, eventTypes);
  }
}, [userIsAuthenticated]);
```

### 4. Historical Data Loading

```tsx
const { getHistory, events } = useWebSocket({ contractId });

useEffect(() => {
  // Load last 50 events on mount
  getHistory(contractId, 50);
}, []);
```

### 5. Real-time Calculations

```tsx
const { events } = useWebSocket({ contractId });

const stats = useMemo(() => {
  return events.reduce((acc, event) => {
    if (event.type === 'impression_tracked') {
      acc.impressions += 1;
    }
    return acc;
  }, { impressions: 0, clicks: 0 });
}, [events]);
```

## Best Practices

### Performance

1. **Limit stored events**:
   ```tsx
   setEvents(prev => [newEvent, ...prev].slice(0, 100)); // Keep only 100
   ```

2. **Debounce chart updates**:
   ```tsx
   const debouncedUpdate = useDebouncedCallback(updateChart, 500);
   ```

3. **Use event filtering**:
   ```tsx
   // Only subscribe to relevant events
   eventTypes: ['campaign_created', 'payment_processed']
   ```

### Error Handling

```tsx
const { error, isConnected } = useWebSocket({ contractId });

if (error) {
  return <ErrorDisplay message={error} />;
}

if (!isConnected) {
  return <ConnectionStatus isConnected={false} />;
}
```

### Authentication

```tsx
import { useAuth } from '@/hooks/useAuth';

function Dashboard() {
  const { token } = useAuth();

  const { isConnected } = useWebSocket({
    contractId: 'ST1...campaigns',
    token, // Pass JWT token
  });
}
```

## Troubleshooting

### Connection Issues

1. **Check WebSocket server**:
   ```bash
   curl http://localhost:3002/health
   ```

2. **Verify CORS settings**: Ensure `ALLOWED_ORIGINS` includes your frontend URL

3. **Check browser console**: Look for WebSocket connection errors

### Event Not Received

1. **Verify subscription**: Check `subscribed` event in console
2. **Check event types**: Ensure event type matches filter
3. **Test with global subscription**: Remove `eventTypes` filter

### Performance Issues

1. **Reduce data retention**: Keep fewer events in state
2. **Increase update intervals**: Use longer refresh intervals
3. **Limit subscriptions**: Don't monitor too many contracts simultaneously

## Next Steps

- Review [Complete Documentation](../../docs/REALTIME_ANALYTICS.md)
- Check [Component API Reference](../../frontend/src/components/analytics/README.md)
- See [WebSocket Server Docs](../../websocket-server/README.md)
- Try [Load Testing](../../websocket-server/tests/load-test.js)

## Support

- GitHub Issues: https://github.com/adstack/issues
- Discord: https://discord.gg/adstack
- Email: support@adstack.io

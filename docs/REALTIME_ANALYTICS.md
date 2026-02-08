# Real-Time WebSocket Analytics Documentation

## Overview

The AdStack Real-Time Analytics system provides sub-second latency updates for campaign metrics, bidding activity, and blockchain events through WebSocket technology.

## Architecture

### Components

1. **WebSocket Server** (`websocket-server/`)
   - Socket.io server with Redis caching
   - Stacks blockchain event streaming
   - JWT authentication
   - Event aggregation and filtering

2. **Frontend Client** (`frontend/src/`)
   - WebSocket client library
   - React hooks for real-time data
   - Real-time visualization components
   - Toast notification system

3. **Redis Cache**
   - Event history storage (24h TTL)
   - Statistics caching (5min TTL)
   - Connection state management

## Quick Start

### Server Setup

1. **Install dependencies:**
```bash
cd websocket-server
npm install
```

2. **Configure environment:**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Start Redis:**
```bash
docker run -d -p 6379:6379 redis:alpine
```

4. **Start server:**
```bash
npm run dev
```

Server runs on `http://localhost:3002`

### Frontend Integration

1. **Install Socket.io client:**
```bash
cd frontend
npm install socket.io-client recharts
```

2. **Configure WebSocket URL:**
```env
# frontend/.env
VITE_WS_URL=http://localhost:3002
```

3. **Use in components:**
```tsx
import { useWebSocket } from '@/hooks/useWebSocket';
import { LiveCampaignMetrics } from '@/components/analytics';

function Dashboard() {
  const contractId = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.campaign-orchestrator';

  return <LiveCampaignMetrics contractId={contractId} />;
}
```

## API Reference

### WebSocket Events

#### Client → Server

**subscribe**
```typescript
socket.emit('subscribe', {
  contractId: string;
  eventTypes?: string[]; // Optional filter
});
```

**unsubscribe**
```typescript
socket.emit('unsubscribe', {
  contractId: string;
});
```

**getHistory**
```typescript
socket.emit('getHistory', {
  contractId: string;
  limit?: number; // Default: 50, Max: 100
});
```

**getStats**
```typescript
socket.emit('getStats', {
  contractId: string;
});
```

#### Server → Client

**connected**
```typescript
{
  message: string;
  socketId: string;
  userId: string;
  timestamp: number;
}
```

**event**
```typescript
{
  id: string;
  type: string; // 'campaign_created', 'bid_placed', etc.
  contractId: string;
  txId: string;
  blockHeight: number;
  timestamp: number;
  data: any;
}
```

**history**
```typescript
{
  contractId: string;
  events: Event[];
  count: number;
  limit: number;
}
```

**stats**
```typescript
{
  contractId: string;
  stats: {
    totalEvents: number;
    eventsByType: Record<string, number>;
    lastUpdated: number;
  };
}
```

**error**
```typescript
{
  message: string;
  code: string; // 'MAX_SUBSCRIPTIONS', 'NOT_SUBSCRIBED', etc.
}
```

### HTTP Endpoints

**GET /health**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "services": {
    "redis": true,
    "stacksWebSocket": true,
    "websocket": 15
  },
  "metrics": {
    "connectedClients": 15,
    "activeSubscriptions": 42,
    "memoryUsage": {...}
  }
}
```

**GET /status**

Detailed server status including:
- Service connection states
- Contract addresses
- System metrics
- Uptime information

**GET /metrics**

Prometheus-style metrics:
```
adstack_connected_clients 15
adstack_active_subscriptions 42
adstack_uptime_seconds 3600
adstack_memory_usage_bytes{type="rss"} 125829120
```

## Event Types

### Campaign Events
- `campaign_created` - New campaign created
- `campaign_updated` - Campaign settings modified
- `campaign_paused` - Campaign paused
- `campaign_resumed` - Campaign resumed

### Auction Events
- `auction_created` - New auction started
- `auction_bid_placed` - New bid placed
- `auction_finalized` - Auction ended

### Bridge Events
- `bridge_deposit` - Tokens deposited to bridge
- `bridge_withdrawal` - Tokens withdrawn from bridge

### Payment Events
- `payment_processed` - Payment completed
- `payment_claimed` - Payment claimed by recipient

### Governance Events
- `governance_proposal_created` - New proposal
- `governance_vote_cast` - Vote recorded

## React Components

### useWebSocket Hook

```tsx
import { useWebSocket } from '@/hooks/useWebSocket';

function MyComponent() {
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
    contractId: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.campaigns',
    eventTypes: ['campaign_created', 'campaign_updated'],
    autoConnect: true,
    token: 'your-jwt-token', // Optional
  });

  return (
    <div>
      <p>Status: {isConnected ? 'Connected' : 'Disconnected'}</p>
      <p>Total Events: {events.length}</p>
      {latestEvent && <p>Latest: {latestEvent.type}</p>}
    </div>
  );
}
```

### LiveCampaignMetrics

```tsx
import { LiveCampaignMetrics } from '@/components/analytics';

<LiveCampaignMetrics
  contractId="ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.campaigns"
  refreshInterval={1000} // Update every second
/>
```

Displays:
- Total Impressions
- Active Bids
- Total Revenue
- Click-Through Rate (CTR)

### RealTimeChart

```tsx
import { RealTimeChart } from '@/components/analytics';

<RealTimeChart
  contractId="ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.campaigns"
  metric="impressions"
  timeWindow="hour" // or 'day'
  chartType="area" // or 'line'
  height={300}
  maxDataPoints={60}
/>
```

### LiveBiddingInterface

```tsx
import { LiveBiddingInterface } from '@/components/analytics';

<LiveBiddingInterface
  contractId="ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.auctions"
  enableNotifications={true}
  enableSound={true}
/>
```

Features:
- Live bid stream
- Highest bid tracker
- Bid trend chart
- Toast notifications
- Browser notifications (with permission)

### RealTimeLeaderboard

```tsx
import { RealTimeLeaderboard } from '@/components/analytics';

<RealTimeLeaderboard
  contractId="ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.campaigns"
  type="campaigns" // or 'publishers'
  scoreMetric="revenue" // 'impressions', 'ctr', 'bids'
  limit={10}
/>
```

### ActivityFeed

```tsx
import { ActivityFeed } from '@/components/analytics';

<ActivityFeed
  contractId="ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.campaigns"
  autoScroll={true}
  maxEvents={100}
  height={600}
/>
```

## Authentication

### JWT Token Generation

Server-side:
```typescript
import { generateToken } from './middleware/auth';

const token = generateToken(
  'user-123', // userId
  'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7', // Stacks address
  'user' // role: 'user' | 'admin' | 'developer'
);
```

Client-side:
```typescript
import { wsClient } from '@/lib/websocket';

wsClient.connect('your-jwt-token');
```

### Development Mode

Skip authentication (for development only):
```env
NODE_ENV=development
SKIP_AUTH=true
```

## Performance Optimization

### Redis Caching

Events are cached with TTL:
- **Events**: 3600s (1 hour)
- **Statistics**: 300s (5 minutes)
- **Counters**: Custom TTL

### Connection Limits

- **Max subscriptions per client**: 10 (configurable)
- **Event history limit**: 100 events (configurable)
- **Auto-reconnection**: Exponential backoff (5s → 60s)

### Frontend Optimization

```tsx
// Limit events in state
const [events, setEvents] = useState<Event[]>([]);

useEffect(() => {
  setEvents(prev => [newEvent, ...prev].slice(0, 100));
}, [newEvent]);

// Debounce chart updates
import { useDebouncedCallback } from 'use-debounce';

const debouncedUpdate = useDebouncedCallback(
  (data) => setChartData(data),
  500
);
```

## Monitoring

### Server Health

```bash
curl http://localhost:3002/health
```

### Prometheus Metrics

```bash
curl http://localhost:3002/metrics
```

Integrate with Prometheus:
```yaml
scrape_configs:
  - job_name: 'adstack-websocket'
    static_configs:
      - targets: ['localhost:3002']
```

### Logging

Logs are written to:
- `logs/combined.log` - All logs
- `logs/error.log` - Errors only
- Console - Development output

Configure log level:
```env
LOG_LEVEL=info # debug | info | warn | error
```

## Troubleshooting

### Connection Issues

**Problem**: Client cannot connect

**Solutions**:
1. Check server is running: `curl http://localhost:3002/health`
2. Verify CORS settings in `.env`: `ALLOWED_ORIGINS`
3. Check Redis connection: `redis-cli ping`
4. Review logs: `tail -f websocket-server/logs/combined.log`

### High Latency

**Problem**: Events delayed >1 second

**Solutions**:
1. Check Redis latency: `redis-cli --latency`
2. Monitor server load: `GET /metrics`
3. Reduce `maxDataPoints` in charts
4. Limit active subscriptions
5. Use event type filtering

### Memory Issues

**Problem**: Server memory growing

**Solutions**:
1. Reduce `EVENT_HISTORY_LIMIT`
2. Lower `REDIS_TTL`
3. Implement event cleanup:
```typescript
await redisService.clearEvents();
```

### Missing Events

**Problem**: Some events not received

**Solutions**:
1. Check subscription status: Listen for `subscribed` event
2. Verify contract address is correct
3. Check event type filtering
4. Review Stacks WebSocket connection: `GET /status`

## Production Deployment

### Server

1. **Use process manager:**
```bash
pm2 start dist/index.js --name adstack-ws
pm2 save
pm2 startup
```

2. **Configure environment:**
```env
NODE_ENV=production
JWT_SECRET=your-strong-secret-key
REDIS_URL=redis://your-redis-host:6379
STACKS_WS_URL=wss://stacks-node-api.mainnet.stacks.co
```

3. **Setup reverse proxy (Nginx):**
```nginx
upstream websocket {
    server localhost:3002;
}

server {
    listen 443 ssl;
    server_name ws.adstack.io;

    location / {
        proxy_pass http://websocket;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

4. **Enable SSL:**
```bash
certbot --nginx -d ws.adstack.io
```

### Frontend

Update production WebSocket URL:
```env
VITE_WS_URL=https://ws.adstack.io
```

### Monitoring

Setup alerts for:
- Server downtime
- High error rate (>5%)
- Memory usage (>80%)
- Redis connection failures
- Stacks WebSocket disconnections

## Security

### Best Practices

1. **Always use JWT authentication in production**
2. **Enable CORS only for trusted origins**
3. **Use WSS (WebSocket Secure) in production**
4. **Rotate JWT secrets regularly**
5. **Rate limit subscriptions per user**
6. **Sanitize event data before broadcasting**
7. **Monitor for suspicious activity**

### Rate Limiting

Implement rate limiting:
```typescript
const RATE_LIMIT = 10; // subscriptions per user
const RATE_WINDOW = 60000; // 1 minute

// Track in Redis
await redis.incrementCounter(`ratelimit:${userId}`, RATE_WINDOW);
```

## Support

- **Documentation**: https://docs.adstack.io/realtime
- **Discord**: https://discord.gg/adstack
- **GitHub Issues**: https://github.com/adstack/issues
- **Email**: support@adstack.io

## License

MIT License - See LICENSE file for details

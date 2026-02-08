# AdStack WebSocket Server

Real-time analytics server for the AdStack blockchain advertising platform, providing sub-second latency updates for campaigns, bidding, and blockchain events.

## Features

- **Real-Time Event Streaming**: Sub-second latency blockchain event delivery
- **Socket.io Integration**: WebSocket with automatic fallback
- **Redis Caching**: High-performance event caching with TTL management
- **JWT Authentication**: Secure token-based authentication
- **Event Filtering**: Subscribe to specific contract and event types
- **Horizontal Scaling**: Multi-instance support with Redis Pub/Sub
- **Health Monitoring**: Built-in health checks and Prometheus metrics
- **Production Ready**: PM2, Docker, and Kubernetes deployment options

## Quick Start

### Prerequisites

- Node.js 18+
- Redis 6.0+
- TypeScript 5+

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
nano .env
```

### Development

```bash
# Start Redis
docker run -d -p 6379:6379 redis:alpine

# Start development server
npm run dev

# Server will be available at http://localhost:3002
```

### Production

```bash
# Build TypeScript
npm run build

# Start with PM2
pm2 start ecosystem.config.js --env production

# Or with Docker
docker-compose up -d
```

## Architecture

```
┌─────────────────┐
│  Stacks Node    │
│  WebSocket API  │
└────────┬────────┘
         │
         │ Events
         ▼
┌─────────────────┐      ┌─────────────────┐
│  Event Listener │─────▶│  Redis Cache    │
│    Service      │      │  (TTL: 1 hour)  │
└────────┬────────┘      └─────────────────┘
         │
         │ Parsed Events
         ▼
┌─────────────────┐
│  WebSocket      │
│  Server         │
│  (Socket.io)    │
└────────┬────────┘
         │
         │ Socket.io
         ▼
┌─────────────────┐
│  Client Apps    │
│  (Frontend)     │
└─────────────────┘
```

## API Reference

### HTTP Endpoints

#### GET /health

Health check endpoint for monitoring.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "services": {
    "redis": true,
    "stacksWebSocket": true,
    "websocket": 15
  }
}
```

#### GET /status

Detailed server status including configuration and metrics.

#### GET /metrics

Prometheus-compatible metrics endpoint.

### WebSocket Events

#### Client → Server

**subscribe**
```typescript
socket.emit('subscribe', {
  contractId: 'ST1...campaigns',
  eventTypes: ['campaign_created', 'bid_placed']  // Optional
});
```

**unsubscribe**
```typescript
socket.emit('unsubscribe', {
  contractId: 'ST1...campaigns'
});
```

**getHistory**
```typescript
socket.emit('getHistory', {
  contractId: 'ST1...campaigns',
  limit: 50  // Max: 100
});
```

**getStats**
```typescript
socket.emit('getStats', {
  contractId: 'ST1...campaigns'
});
```

#### Server → Client

**connected**
```typescript
{
  message: 'Connected to WebSocket server',
  socketId: 'abc123',
  userId: 'user-123',
  timestamp: 1642252800000
}
```

**event**
```typescript
{
  id: 'evt_123',
  type: 'campaign_created',
  contractId: 'ST1...campaigns',
  txId: '0x123...',
  blockHeight: 12345,
  timestamp: 1642252800000,
  data: { /* event-specific data */ }
}
```

**error**
```typescript
{
  message: 'Subscription limit exceeded',
  code: 'MAX_SUBSCRIPTIONS'
}
```

## Configuration

### Environment Variables

```env
# Server
NODE_ENV=production
PORT=3002
LOG_LEVEL=info

# Redis
REDIS_URL=redis://localhost:6379

# Stacks Blockchain
STACKS_WS_URL=wss://stacks-node-api.mainnet.stacks.co
STACKS_API_URL=https://stacks-node-api.mainnet.stacks.co

# Authentication
JWT_SECRET=your-secret-key-here
SKIP_AUTH=false

# CORS
ALLOWED_ORIGINS=https://adstack.io,https://app.adstack.io

# Contract Addresses
CAMPAIGN_CONTRACT=SP2J6...campaign-orchestrator
AUCTION_CONTRACT=SP2J6...auction-engine
BRIDGE_CONTRACT=SP2J6...cross-chain-bridge
PAYMENT_CONTRACT=SP2J6...payment-processor
GOVERNANCE_CONTRACT=SP2J6...governance-dao

# Performance
MAX_SUBSCRIPTIONS_PER_CLIENT=10
EVENT_HISTORY_LIMIT=100
REDIS_TTL=3600
```

## Documentation

- **[REALTIME_ANALYTICS.md](../docs/REALTIME_ANALYTICS.md)** - Complete real-time analytics documentation
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Production deployment guide
- **[SECURITY.md](./SECURITY.md)** - Security best practices and hardening
- **[PERFORMANCE.md](./PERFORMANCE.md)** - Performance optimization guide
- **[tests/README.md](./tests/README.md)** - Load and stress testing guide

## Examples

See [examples/realtime-analytics/](../examples/realtime-analytics/) for:
- Complete dashboard implementation
- Custom hook integration
- Toast notification setup

## Testing

### Unit Tests

```bash
npm test
```

### Load Testing

```bash
# Test with 100 clients for 60 seconds
node tests/load-test.js --clients=100 --duration=60

# Stress test to find breaking point
node tests/stress-test.js --max=1000
```

## Monitoring

### Prometheus Metrics

```bash
curl http://localhost:3002/metrics
```

Metrics include:
- `adstack_connected_clients` - Active WebSocket connections
- `adstack_active_subscriptions` - Total subscriptions
- `adstack_uptime_seconds` - Server uptime
- `adstack_memory_usage_bytes` - Memory usage by type

### Grafana Dashboard

```bash
# Start monitoring stack
docker-compose --profile monitoring up -d

# Access Grafana
open http://localhost:3000
```

## Deployment

### PM2 (VPS)

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start ecosystem.config.js --env production

# Setup auto-start
pm2 startup
pm2 save
```

### Docker

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f websocket-server

# Stop
docker-compose down
```

### Kubernetes

```bash
# Deploy to cluster
kubectl apply -f k8s/

# Check status
kubectl get pods -n adstack
```

## Troubleshooting

### Connection Issues

```bash
# Check server status
curl http://localhost:3002/health

# Check logs
pm2 logs adstack-websocket

# Test WebSocket connection
wscat -c ws://localhost:3002
```

### High Memory Usage

```bash
# Check memory usage
pm2 monit

# Restart with memory limit
pm2 restart adstack-websocket --max-memory-restart 1G
```

### Redis Connection Failed

```bash
# Check Redis status
redis-cli ping

# Restart Redis
sudo systemctl restart redis
```

## Performance

### Benchmarks

| Metric | Value |
|--------|-------|
| Max Concurrent Connections | 1000+ |
| Event Throughput | 10k+ events/sec |
| Average Latency | <100ms |
| P95 Latency | <250ms |
| Memory Usage | ~500MB (1000 clients) |

### Optimization Tips

1. **Enable cluster mode** - Use all CPU cores
2. **Optimize Redis** - Configure maxmemory and eviction policy
3. **Use WebSocket-only** - Disable polling transport
4. **Batch events** - Reduce network overhead
5. **Load balancing** - Distribute across multiple instances

See [PERFORMANCE.md](./PERFORMANCE.md) for detailed optimization guide.

## Security

### Best Practices

- ✅ Use strong JWT secrets (32+ characters)
- ✅ Enable SSL/TLS in production
- ✅ Configure CORS properly
- ✅ Disable SKIP_AUTH in production
- ✅ Rate limit connections and events
- ✅ Validate all inputs
- ✅ Monitor for suspicious activity

See [SECURITY.md](./SECURITY.md) for complete security guide.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - See [LICENSE](../LICENSE) for details.

## Support

- **Documentation**: https://docs.adstack.io
- **GitHub Issues**: https://github.com/adstack/issues
- **Discord**: https://discord.gg/adstack
- **Email**: support@adstack.io

## Changelog

### v1.0.0 (2024-01-15)

- ✨ Initial release
- ✨ Real-time event streaming from Stacks blockchain
- ✨ Socket.io WebSocket server
- ✨ Redis caching with TTL
- ✨ JWT authentication
- ✨ Event filtering and history
- ✨ Health monitoring and metrics
- ✨ Production deployment configs
- 📚 Comprehensive documentation
- 🧪 Load and stress testing scripts

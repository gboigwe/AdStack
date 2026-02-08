# AdStack WebSocket Server

Real-time analytics and event streaming server for the AdStack platform, built with Socket.io and Stacks blockchain integration.

## Features

- Real-time WebSocket connections using Socket.io
- Stacks blockchain event monitoring and forwarding
- Redis caching for event history and statistics
- JWT authentication for secure connections
- Subscription-based event filtering
- Historical event retrieval
- Prometheus-style metrics endpoint
- Health monitoring and status reporting
- Graceful shutdown handling

## Architecture

```
websocket-server/
├── src/
│   ├── index.ts              # Main server entry point
│   ├── middleware/
│   │   └── auth.ts           # JWT authentication middleware
│   ├── services/
│   │   ├── redis.ts          # Redis caching service
│   │   ├── stacksEvents.ts   # Stacks blockchain event listener
│   │   └── websocket.ts      # WebSocket connection handler
│   └── utils/
│       └── logger.ts         # Winston logger configuration
├── logs/                     # Application logs
├── .env.example             # Environment variables template
├── package.json             # Dependencies and scripts
└── tsconfig.json            # TypeScript configuration
```

## Prerequisites

- Node.js v18 or higher
- Redis server
- Stacks blockchain node WebSocket access
- npm or yarn

## Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Build the TypeScript code:
```bash
npm run build
```

## Configuration

Edit `.env` file with your settings:

```env
# Server
PORT=3002
NODE_ENV=production

# Redis
REDIS_URL=redis://localhost:6379
REDIS_TTL=3600

# Stacks Blockchain
STACKS_WS_URL=wss://stacks-node-api.mainnet.stacks.co
STACKS_NETWORK=mainnet

# Authentication
JWT_SECRET=your-secret-key

# Contract Addresses
CAMPAIGN_CONTRACT=SP...
AUCTION_CONTRACT=SP...
BRIDGE_CONTRACT=SP...
PAYMENT_CONTRACT=SP...
GOVERNANCE_CONTRACT=SP...

# CORS
ALLOWED_ORIGINS=http://localhost:3000,https://adstack.app
```

## Running

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

### Watch Mode (Auto-reload)
```bash
npm run watch
```

## API Endpoints

### Health Check
```
GET /health
```
Returns server health status and service connectivity.

### Status
```
GET /status
```
Returns detailed server status, configuration, and metrics.

### Metrics
```
GET /metrics
```
Returns Prometheus-style metrics for monitoring.

## WebSocket Events

### Client to Server

#### Connect
```javascript
const socket = io('http://localhost:3002', {
  auth: { token: 'your-jwt-token' }
});
```

#### Subscribe to Contract Events
```javascript
socket.emit('subscribe', {
  contractId: 'SP...adstack-campaigns',
  eventTypes: ['campaign_created', 'campaign_updated'] // Optional
});
```

#### Unsubscribe
```javascript
socket.emit('unsubscribe', {
  contractId: 'SP...adstack-campaigns'
});
```

#### Get Event History
```javascript
socket.emit('getHistory', {
  contractId: 'SP...adstack-campaigns',
  limit: 50 // Optional, default 50
});
```

#### Get Statistics
```javascript
socket.emit('getStats', {
  contractId: 'SP...adstack-campaigns'
});
```

### Server to Client

#### Connected
```javascript
socket.on('connected', (data) => {
  console.log('Connected:', data);
});
```

#### Event
```javascript
socket.on('event', (event) => {
  console.log('New event:', event);
  // event: { id, type, contractId, txId, blockHeight, timestamp, data }
});
```

#### History
```javascript
socket.on('history', (data) => {
  console.log('Event history:', data.events);
});
```

#### Stats
```javascript
socket.on('stats', (data) => {
  console.log('Statistics:', data.stats);
});
```

#### Error
```javascript
socket.on('error', (error) => {
  console.error('Error:', error);
});
```

## Authentication

The server uses JWT tokens for authentication. In development mode, you can bypass authentication:

```env
NODE_ENV=development
SKIP_AUTH=true
```

To generate a token:
```javascript
import { generateToken } from './middleware/auth';

const token = generateToken('userId', 'ST...address', 'user');
```

## Event Types

The server monitors and forwards the following event types:

- **Campaigns**: `campaign_created`, `campaign_updated`, `campaign_paused`, `campaign_resumed`
- **Auctions**: `auction_created`, `auction_bid_placed`, `auction_finalized`
- **Bridge**: `bridge_deposit`, `bridge_withdrawal`
- **Payments**: `payment_processed`, `payment_claimed`
- **Governance**: `governance_proposal_created`, `governance_vote_cast`

## Monitoring

### Logs
Application logs are stored in the `logs/` directory:
- `combined.log` - All logs
- `error.log` - Error logs only

### Metrics
Access Prometheus metrics at `http://localhost:3002/metrics` for:
- Connected clients count
- Active subscriptions count
- Server uptime
- Memory usage

## Production Deployment

### Using PM2
```bash
npm install -g pm2
pm2 start dist/index.js --name adstack-ws
pm2 save
pm2 startup
```

### Using Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
CMD ["node", "dist/index.js"]
```

### Environment Variables for Production
- Set strong `JWT_SECRET`
- Configure proper `ALLOWED_ORIGINS`
- Use production Redis URL
- Set `NODE_ENV=production`
- Configure proper contract addresses

## Troubleshooting

### Redis Connection Issues
- Verify Redis is running: `redis-cli ping`
- Check `REDIS_URL` in `.env`
- Review logs for connection errors

### Stacks WebSocket Issues
- Verify Stacks node WebSocket endpoint is accessible
- Check `STACKS_WS_URL` configuration
- Monitor reconnection attempts in logs

### Authentication Errors
- Verify `JWT_SECRET` is set
- Check token expiration (24h default)
- Ensure proper token format in client

## Performance Tuning

### Redis TTL
Adjust `REDIS_TTL` based on your needs:
- Lower values = Less storage, more API calls
- Higher values = More storage, fewer API calls

### Rate Limiting
Configure in `.env`:
```env
MAX_SUBSCRIPTIONS_PER_CLIENT=10
EVENT_HISTORY_LIMIT=100
```

### Memory Usage
Monitor via `/metrics` endpoint and adjust Node.js heap size:
```bash
NODE_OPTIONS="--max-old-space-size=4096" npm start
```

## Development

### Running Tests
```bash
npm test
```

### Type Checking
```bash
npm run build
```

### Code Style
Follow TypeScript best practices and ensure:
- Proper error handling
- Async/await for promises
- Comprehensive logging
- Type safety

## License

MIT

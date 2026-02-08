# Bridge Relayer Service

Automated relayer service for the AdStack cross-chain bridge. Monitors and processes bridge transactions between Stacks and supported EVM chains.

## Features

- Multi-sig validation support
- Automatic transaction processing
- Health monitoring endpoints
- Configurable polling interval
- Support for multiple chains (Ethereum, Polygon, BSC, Avalanche)
- Comprehensive logging

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Build the service:
```bash
npm run build
```

4. Start the relayer:
```bash
npm start
```

For development with hot reload:
```bash
npm run dev
```

## API Endpoints

### Health Check
```
GET /health
```

Returns service health status and active validators.

### Get Pending Transactions
```
GET /api/pending
```

Returns list of pending bridge transactions.

### Get Transaction Status
```
GET /api/transaction/:txHash
```

Returns status of a specific bridge transaction.

### Manual Process
```
POST /api/process/:txHash
```

Manually trigger processing for a specific transaction.

## Configuration

Key environment variables:

- `STACKS_NETWORK`: `mainnet` or `testnet`
- `MIN_VALIDATORS`: Minimum validator signatures required (default: 3)
- `POLL_INTERVAL`: Transaction polling interval in ms (default: 30000)
- `RELAYER_PRIVATE_KEY`: Private key for signing transactions

## Security

- Never commit `.env` file with real credentials
- Use secure key management in production
- Restrict API access with authentication
- Monitor validator addresses regularly
- Enable rate limiting for API endpoints

## Monitoring

Logs are written to:
- Console (for development)
- `logs/combined.log` (all logs)
- `logs/error.log` (errors only)

## Production Deployment

For production deployment:

1. Use environment variables for secrets
2. Set up proper logging and monitoring
3. Configure database for transaction tracking
4. Implement rate limiting and authentication
5. Use process manager (PM2, systemd)
6. Set up alerts for failed transactions

Example PM2 configuration:
```bash
pm2 start dist/index.js --name bridge-relayer
pm2 save
pm2 startup
```

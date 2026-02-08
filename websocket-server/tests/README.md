# WebSocket Server Testing

This directory contains testing scripts for the AdStack WebSocket server.

## Available Tests

### 1. Load Testing (`load-test.js`)

Tests the server under realistic production load conditions with a fixed number of concurrent clients.

**Purpose:**
- Verify server can handle expected production load
- Measure connection latency
- Monitor event throughput
- Detect memory leaks or performance degradation

**Usage:**
```bash
node tests/load-test.js [options]
```

**Options:**
- `--clients=N` - Number of concurrent clients (default: 100)
- `--duration=N` - Test duration in seconds (default: 60)
- `--ramp-up=N` - Ramp-up time in seconds (default: 10)
- `--url=URL` - WebSocket server URL (default: http://localhost:3002)

**Examples:**
```bash
# Test with 100 clients for 60 seconds
node tests/load-test.js

# Test with 500 clients for 2 minutes
node tests/load-test.js --clients=500 --duration=120

# Test production server
node tests/load-test.js --url=https://ws.adstack.io --clients=1000

# Quick test with fast ramp-up
node tests/load-test.js --clients=50 --duration=30 --ramp-up=5
```

**What it tests:**
- Connection establishment time
- Event delivery latency
- Message throughput
- Connection stability
- Error rates

**Expected Results:**
- Success rate: >99%
- Average latency: <500ms
- p95 latency: <1000ms
- No errors during normal operation

### 2. Stress Testing (`stress-test.js`)

Progressively increases load until the server breaks to find maximum capacity.

**Purpose:**
- Discover the breaking point
- Determine safe production limits
- Identify bottlenecks
- Plan capacity requirements

**Usage:**
```bash
node tests/stress-test.js [options]
```

**Options:**
- `--start=N` - Starting number of clients (default: 50)
- `--increment=N` - Clients to add each step (default: 50)
- `--max=N` - Maximum clients to test (default: 1000)
- `--step-duration=N` - Duration of each step in seconds (default: 30)
- `--url=URL` - WebSocket server URL (default: http://localhost:3002)

**Examples:**
```bash
# Default stress test
node tests/stress-test.js

# Gradual stress test with small increments
node tests/stress-test.js --start=100 --increment=25 --max=2000

# Fast stress test
node tests/stress-test.js --increment=100 --step-duration=15

# Production capacity planning
node tests/stress-test.js --url=https://ws.adstack.io --max=5000
```

**What it tests:**
- Maximum concurrent connections
- Performance degradation curve
- Breaking point detection
- Resource exhaustion behavior

**Breaking Point Criteria:**
- Success rate drops below 90%
- p95 latency exceeds 2000ms
- More than 10 errors in a step

**Expected Results:**
- Breaking point: >500 clients (depends on hardware)
- Recommended limit: 75% of breaking point
- Graceful degradation, not sudden failure

## Metrics Explained

### Connection Metrics
- **Connected** - Successfully established connections
- **Disconnected** - Clients that disconnected during test
- **Errors** - Connection or runtime errors
- **Success Rate** - Percentage of successful connections

### Latency Metrics
- **Min** - Fastest connection time
- **Max** - Slowest connection time
- **Average** - Mean connection time
- **p50** - 50th percentile (median)
- **p95** - 95th percentile (95% of connections faster than this)
- **p99** - 99th percentile (99% of connections faster than this)

### Message Metrics
- **Events Received** - Total blockchain events received
- **Messages Sent** - Total messages sent by clients
- **Events/Second** - Event throughput rate

## Prerequisites

```bash
# Install dependencies
cd websocket-server
npm install

# Ensure Redis is running
docker run -d -p 6379:6379 redis:alpine

# Start WebSocket server
npm run dev
```

## Interpreting Results

### Good Performance ✓
- Success rate: >99%
- Average latency: <500ms
- p95 latency: <1000ms
- No errors
- Stable event throughput

### Acceptable Performance ⚠️
- Success rate: 95-99%
- Average latency: 500-1000ms
- p95 latency: 1000-2000ms
- Few errors (<5)
- Slight latency increase over time

### Poor Performance ❌
- Success rate: <95%
- Average latency: >1000ms
- p95 latency: >2000ms
- Many errors (>10)
- Throughput degradation

## Performance Tuning

If tests show poor performance, try:

### 1. Increase System Limits
```bash
# Linux: Increase file descriptor limit
ulimit -n 65536

# Add to /etc/security/limits.conf
* soft nofile 65536
* hard nofile 65536
```

### 2. Optimize Redis
```bash
# redis.conf
maxmemory 2gb
maxmemory-policy allkeys-lru
save ""
```

### 3. Node.js Tuning
```bash
# Increase heap size
NODE_OPTIONS="--max-old-space-size=4096" node tests/load-test.js
```

### 4. Server Configuration
```env
# .env
MAX_SUBSCRIPTIONS_PER_CLIENT=5
EVENT_HISTORY_LIMIT=50
REDIS_TTL=1800
```

### 5. Load Balancing
For >1000 clients, consider:
- Multiple server instances
- Redis cluster
- Sticky sessions
- WebSocket load balancer (HAProxy, Nginx)

## Monitoring During Tests

### Terminal 1: Run Test
```bash
node tests/load-test.js --clients=500
```

### Terminal 2: Monitor Server
```bash
# Watch server logs
tail -f websocket-server/logs/combined.log

# Monitor metrics
watch -n 1 curl -s http://localhost:3002/metrics
```

### Terminal 3: Monitor Redis
```bash
# Redis stats
redis-cli --stat

# Monitor memory
redis-cli info memory
```

### Terminal 4: System Resources
```bash
# CPU and memory
htop

# Network connections
watch -n 1 'netstat -an | grep 3002 | wc -l'
```

## CI/CD Integration

### GitHub Actions
```yaml
name: Load Test

on:
  push:
    branches: [main]

jobs:
  load-test:
    runs-on: ubuntu-latest
    services:
      redis:
        image: redis:alpine
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'

      - name: Install dependencies
        run: cd websocket-server && npm install

      - name: Start server
        run: cd websocket-server && npm start &

      - name: Wait for server
        run: sleep 10

      - name: Run load test
        run: node websocket-server/tests/load-test.js --clients=100 --duration=30

      - name: Check results
        run: |
          if [ $? -eq 0 ]; then
            echo "Load test passed"
          else
            echo "Load test failed"
            exit 1
          fi
```

## Troubleshooting

### Connection Timeouts
- **Cause**: Server overloaded or network issues
- **Fix**: Reduce client count, increase timeout, check server logs

### High Latency
- **Cause**: Redis slow, CPU bottleneck, network congestion
- **Fix**: Optimize Redis, scale vertically, use Redis cluster

### Memory Errors
- **Cause**: Memory leak, too many cached events
- **Fix**: Reduce EVENT_HISTORY_LIMIT, fix memory leaks, increase heap size

### Connection Refused
- **Cause**: Server not running, wrong URL, firewall
- **Fix**: Check server status, verify URL, check firewall rules

## Best Practices

1. **Always test locally first** before production testing
2. **Ramp up gradually** to avoid overwhelming the server
3. **Monitor all metrics** during tests (CPU, memory, network)
4. **Test with realistic data** matching production patterns
5. **Run multiple tests** to ensure consistency
6. **Document results** for capacity planning
7. **Test failure scenarios** (Redis down, network issues)
8. **Automate tests** in CI/CD pipeline

## Support

- Issues: https://github.com/adstack/issues
- Discord: https://discord.gg/adstack
- Email: support@adstack.io

# Performance Optimization Guide

Complete guide for optimizing AdStack WebSocket Server performance.

## Table of Contents

1. [Performance Metrics](#performance-metrics)
2. [Node.js Optimization](#nodejs-optimization)
3. [Redis Optimization](#redis-optimization)
4. [WebSocket Optimization](#websocket-optimization)
5. [Load Balancing](#load-balancing)
6. [Caching Strategies](#caching-strategies)
7. [Monitoring & Profiling](#monitoring--profiling)

## Performance Metrics

### Target Metrics

| Metric | Target | Acceptable | Critical |
|--------|--------|------------|----------|
| Connection Time | <200ms | <500ms | >1000ms |
| Event Latency | <100ms | <250ms | >500ms |
| Throughput | >10k events/s | >5k events/s | <1k events/s |
| Memory Usage | <1GB | <2GB | >3GB |
| CPU Usage | <70% | <85% | >90% |
| Concurrent Connections | >1000 | >500 | <200 |

### Measuring Performance

```bash
# Connection time
time node -e "const io = require('socket.io-client'); io('http://localhost:3002')"

# Event latency
node websocket-server/tests/load-test.js --clients=100 --duration=60

# Throughput
redis-cli --latency-history

# Resource usage
pm2 monit
```

## Node.js Optimization

### Event Loop Optimization

#### Avoid Blocking Operations

```typescript
// ❌ BAD - Blocking
const result = fs.readFileSync('/path/to/file');

// ✅ GOOD - Non-blocking
const result = await fs.promises.readFile('/path/to/file');
```

#### Use Streams for Large Data

```typescript
// ❌ BAD - Loads entire file into memory
const data = await fs.promises.readFile('large-file.json');
const json = JSON.parse(data.toString());

// ✅ GOOD - Streams data
const stream = fs.createReadStream('large-file.json');
const parser = JSONStream.parse('*');
stream.pipe(parser);
```

### Memory Management

#### Heap Size Configuration

```bash
# Increase heap size for high-traffic servers
NODE_OPTIONS="--max-old-space-size=4096" node dist/index.js

# PM2 ecosystem.config.js
node_args: ['--max-old-space-size=4096']
```

#### Memory Leak Prevention

```typescript
// Clear timers and intervals
const interval = setInterval(() => {}, 1000);

socket.on('disconnect', () => {
  clearInterval(interval);
});

// Remove event listeners
socket.on('disconnect', () => {
  socket.removeAllListeners();
});

// Clean up maps and sets
const cache = new Map();

setInterval(() => {
  // Remove old entries
  for (const [key, value] of cache.entries()) {
    if (value.timestamp < Date.now() - 3600000) {
      cache.delete(key);
    }
  }
}, 300000); // Every 5 minutes
```

#### Object Pooling

```typescript
// Reuse objects instead of creating new ones
class EventPool {
  private pool: Event[] = [];

  acquire(): Event {
    return this.pool.pop() || this.createEvent();
  }

  release(event: Event): void {
    event.reset();
    this.pool.push(event);
  }

  private createEvent(): Event {
    return new Event();
  }
}

const eventPool = new EventPool();
```

### Clustering

#### PM2 Cluster Mode

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'adstack-websocket',
    script: './dist/index.js',
    instances: 'max',  // Use all CPU cores
    exec_mode: 'cluster',
    max_memory_restart: '1G',
  }]
};
```

#### Sticky Sessions

```javascript
// Enable sticky sessions for WebSocket
const io = new Server(server, {
  transports: ['websocket', 'polling'],
  allowEIO3: true,
  cors: corsOptions,
  // Socket.IO will handle sticky sessions automatically in cluster mode
});
```

## Redis Optimization

### Configuration Tuning

```bash
# redis.conf

# Memory optimization
maxmemory 2gb
maxmemory-policy allkeys-lru

# Persistence (disable for pure cache)
save ""
appendonly no

# Network
tcp-backlog 511
timeout 300
tcp-keepalive 60

# Performance
lazyfree-lazy-eviction yes
lazyfree-lazy-expire yes
```

### Connection Pooling

```typescript
import Redis from 'ioredis';

// Create connection pool
const redis = new Redis({
  host: 'localhost',
  port: 6379,
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: false,

  // Connection pool
  connectionName: 'adstack-ws',
  keepAlive: 30000,

  // Performance
  enableOfflineQueue: false,
  commandTimeout: 5000,
});
```

### Pipeline Operations

```typescript
// ❌ BAD - Multiple round trips
await redis.set('key1', 'value1');
await redis.set('key2', 'value2');
await redis.set('key3', 'value3');

// ✅ GOOD - Single round trip
const pipeline = redis.pipeline();
pipeline.set('key1', 'value1');
pipeline.set('key2', 'value2');
pipeline.set('key3', 'value3');
await pipeline.exec();
```

### Lua Scripts for Atomic Operations

```typescript
// Define Lua script for atomic rate limiting
const rateLimitScript = `
  local key = KEYS[1]
  local limit = tonumber(ARGV[1])
  local window = tonumber(ARGV[2])

  local current = redis.call('INCR', key)

  if current == 1 then
    redis.call('EXPIRE', key, window)
  end

  return current <= limit
`;

// Execute atomically
const allowed = await redis.eval(
  rateLimitScript,
  1,
  `ratelimit:${userId}`,
  10,  // limit
  60   // window in seconds
);
```

## WebSocket Optimization

### Transport Configuration

```typescript
const io = new Server(server, {
  transports: ['websocket', 'polling'],

  // Upgrade to WebSocket ASAP
  allowUpgrades: true,
  upgradeTimeout: 10000,

  // Ping/pong optimization
  pingTimeout: 60000,
  pingInterval: 25000,

  // Buffer limits
  maxHttpBufferSize: 10240,  // 10KB

  // Connection limits
  perMessageDeflate: false,  // Disable compression (CPU vs bandwidth trade-off)
});
```

### Event Optimization

#### Batch Events

```typescript
// ❌ BAD - Emit each event individually
events.forEach(event => {
  socket.emit('event', event);
});

// ✅ GOOD - Batch events
const BATCH_SIZE = 10;
const BATCH_INTERVAL = 100; // ms

const eventBatcher = {
  queue: [] as Event[],
  timer: null as NodeJS.Timeout | null,

  add(event: Event) {
    this.queue.push(event);

    if (this.queue.length >= BATCH_SIZE) {
      this.flush();
    } else if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), BATCH_INTERVAL);
    }
  },

  flush() {
    if (this.queue.length > 0) {
      socket.emit('events', this.queue);
      this.queue = [];
    }

    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
};
```

#### Binary Data

```typescript
// Use binary data for large payloads
const buffer = Buffer.from(JSON.stringify(largeObject));
socket.emit('data', buffer);

// Client side
socket.on('data', (buffer) => {
  const data = JSON.parse(buffer.toString());
});
```

### Room Optimization

```typescript
// ❌ BAD - Iterate all sockets
io.sockets.sockets.forEach(socket => {
  if (socket.contractId === contractId) {
    socket.emit('event', event);
  }
});

// ✅ GOOD - Use rooms
io.to(`contract:${contractId}`).emit('event', event);
```

## Load Balancing

### Nginx Configuration

```nginx
upstream websocket_backend {
    # IP hash for sticky sessions
    ip_hash;

    server 10.0.1.101:3002 max_fails=3 fail_timeout=30s weight=1;
    server 10.0.1.102:3002 max_fails=3 fail_timeout=30s weight=1;
    server 10.0.1.103:3002 max_fails=3 fail_timeout=30s weight=1;

    # Backup server
    server 10.0.1.104:3002 backup;

    # Health check
    keepalive 64;
    keepalive_timeout 60s;
}

server {
    listen 443 ssl http2;
    server_name ws.adstack.io;

    # Performance tuning
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # Buffer sizes
    client_body_buffer_size 128k;
    client_max_body_size 10m;
    client_header_buffer_size 1k;
    large_client_header_buffers 4 16k;

    location / {
        proxy_pass http://websocket_backend;

        # WebSocket headers
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Performance
        proxy_buffering off;
        proxy_cache off;

        # Timeouts
        proxy_connect_timeout 7d;
        proxy_send_timeout 7d;
        proxy_read_timeout 7d;
    }
}
```

### HAProxy Alternative

```haproxy
# haproxy.cfg
global
    maxconn 50000
    tune.ssl.default-dh-param 2048

defaults
    mode http
    timeout connect 10s
    timeout client 7d
    timeout server 7d

frontend websocket_front
    bind *:443 ssl crt /etc/ssl/certs/adstack.pem
    default_backend websocket_back

backend websocket_back
    balance leastconn  # Or 'source' for sticky sessions
    option httpchk GET /health

    server ws1 10.0.1.101:3002 check inter 5s
    server ws2 10.0.1.102:3002 check inter 5s
    server ws3 10.0.1.103:3002 check inter 5s
```

### Redis Pub/Sub for Multi-Instance

```typescript
// Publisher
const pub = new Redis();
pub.publish('global_events', JSON.stringify(event));

// Subscriber (in each instance)
const sub = new Redis();
sub.subscribe('global_events');

sub.on('message', (channel, message) => {
  const event = JSON.parse(message);

  // Broadcast to local sockets
  io.emit('event', event);
});
```

## Caching Strategies

### Event Caching

```typescript
// Multi-level caching
class EventCache {
  private memoryCache = new Map<string, Event>();
  private redis: Redis;

  async get(key: string): Promise<Event | null> {
    // Level 1: Memory (fastest)
    if (this.memoryCache.has(key)) {
      return this.memoryCache.get(key)!;
    }

    // Level 2: Redis
    const cached = await this.redis.get(key);
    if (cached) {
      const event = JSON.parse(cached);
      this.memoryCache.set(key, event);  // Populate memory cache
      return event;
    }

    return null;
  }

  async set(key: string, event: Event, ttl: number): Promise<void> {
    // Set in both caches
    this.memoryCache.set(key, event);
    await this.redis.setex(key, ttl, JSON.stringify(event));
  }
}
```

### Cache Invalidation

```typescript
// Invalidate on updates
async function updateContract(contractId: string, data: any): Promise<void> {
  // Update database
  await database.update(contractId, data);

  // Invalidate caches
  cache.delete(`contract:${contractId}`);
  await redis.del(`stats:${contractId}`);

  // Notify other instances
  await redis.publish('cache_invalidate', contractId);
}
```

## Monitoring & Profiling

### Performance Monitoring

```typescript
import { performance } from 'perf_hooks';

// Measure operation duration
function measureAsync<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now();

  return fn().finally(() => {
    const duration = performance.now() - start;
    metrics.histogram(`${name}_duration_ms`, duration);

    if (duration > 1000) {
      logger.warn(`Slow operation: ${name} took ${duration}ms`);
    }
  });
}

// Usage
await measureAsync('get_events', () => redis.lrange('events', 0, 50));
```

### Memory Profiling

```bash
# Start with inspector
node --inspect dist/index.js

# Take heap snapshots
kill -USR2 <pid>

# Analyze with Chrome DevTools
chrome://inspect
```

### CPU Profiling

```bash
# CPU profiling
node --prof dist/index.js

# Generate report
node --prof-process isolate-*.log > profile.txt
```

### Custom Metrics

```typescript
class PerformanceMetrics {
  private metrics = new Map<string, number[]>();

  record(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    this.metrics.get(name)!.push(value);

    // Keep only last 1000 values
    const values = this.metrics.get(name)!;
    if (values.length > 1000) {
      values.shift();
    }
  }

  getStats(name: string) {
    const values = this.metrics.get(name) || [];

    if (values.length === 0) {
      return null;
    }

    const sorted = [...values].sort((a, b) => a - b);

    return {
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
    };
  }
}

const metrics = new PerformanceMetrics();

// Record metrics
socket.on('subscribe', async () => {
  const start = Date.now();
  await handleSubscribe();
  metrics.record('subscribe_duration', Date.now() - start);
});
```

## Performance Checklist

### Node.js

- [ ] Appropriate heap size configured
- [ ] No blocking operations in event loop
- [ ] Streams used for large data
- [ ] Memory leaks identified and fixed
- [ ] Object pooling for frequently created objects
- [ ] Cluster mode enabled for multi-core usage
- [ ] Timers and intervals properly cleared

### Redis

- [ ] Memory limit configured
- [ ] Eviction policy set
- [ ] Persistence disabled for cache-only usage
- [ ] Connection pooling configured
- [ ] Pipeline used for bulk operations
- [ ] Lua scripts for atomic operations
- [ ] Key expiration set appropriately

### WebSocket

- [ ] WebSocket-only transport (no long polling)
- [ ] Compression disabled for CPU savings
- [ ] Events batched when possible
- [ ] Rooms used instead of iteration
- [ ] Binary data for large payloads
- [ ] Connection limits enforced
- [ ] Ping/pong timeouts optimized

### Infrastructure

- [ ] Load balancer configured with sticky sessions
- [ ] Multiple server instances running
- [ ] Health checks configured
- [ ] Auto-scaling policies defined
- [ ] CDN for static assets
- [ ] Database indexes optimized
- [ ] Network latency minimized

### Monitoring

- [ ] Performance metrics collected
- [ ] Slow operations logged
- [ ] Memory usage monitored
- [ ] CPU profiling enabled
- [ ] Error rates tracked
- [ ] Alerts configured for anomalies
- [ ] Regular load testing performed

## Troubleshooting Performance Issues

### High Latency

1. **Check Redis latency**
   ```bash
   redis-cli --latency
   ```

2. **Profile Node.js**
   ```bash
   node --inspect dist/index.js
   ```

3. **Check network**
   ```bash
   ping ws.adstack.io
   traceroute ws.adstack.io
   ```

### High Memory Usage

1. **Take heap snapshot**
   ```bash
   kill -USR2 <pid>
   ```

2. **Analyze with heapdump**
   ```typescript
   import heapdump from 'heapdump';
   heapdump.writeSnapshot('./heap-' + Date.now() + '.heapsnapshot');
   ```

3. **Check for leaks**
   ```bash
   node --expose-gc --inspect dist/index.js
   ```

### Low Throughput

1. **Check CPU usage**
   ```bash
   pm2 monit
   ```

2. **Increase instances**
   ```bash
   pm2 scale adstack-websocket 8
   ```

3. **Optimize database queries**
   ```bash
   redis-cli SLOWLOG GET 10
   ```

## Resources

- [Node.js Performance Best Practices](https://nodejs.org/en/docs/guides/simple-profiling/)
- [Redis Performance Tuning](https://redis.io/topics/latency)
- [Socket.IO Performance Tips](https://socket.io/docs/v4/performance-tuning/)
- [PM2 Cluster Mode](https://pm2.keymetrics.io/docs/usage/cluster-mode/)

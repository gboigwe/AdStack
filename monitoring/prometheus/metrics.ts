import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';
import type { Request, Response, NextFunction } from 'express';

const register = new Registry();

register.setDefaultLabels({
  service: 'adstack-backend',
});

collectDefaultMetrics({ register, prefix: 'adstack_' });

export const httpRequestsTotal = new Counter({
  name: 'adstack_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

export const httpRequestDuration = new Histogram({
  name: 'adstack_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
});

export const httpRequestSize = new Histogram({
  name: 'adstack_http_request_size_bytes',
  help: 'Size of HTTP request bodies in bytes',
  labelNames: ['method', 'route'],
  buckets: [100, 1000, 10000, 100000, 1000000],
  registers: [register],
});

export const httpResponseSize = new Histogram({
  name: 'adstack_http_response_size_bytes',
  help: 'Size of HTTP response bodies in bytes',
  labelNames: ['method', 'route'],
  buckets: [100, 1000, 10000, 100000, 1000000],
  registers: [register],
});

export const activeConnections = new Gauge({
  name: 'adstack_active_connections',
  help: 'Number of active connections',
  registers: [register],
});

export const dbQueryDuration = new Histogram({
  name: 'adstack_db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['query_type', 'table'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],
  registers: [register],
});

export const dbConnectionPool = new Gauge({
  name: 'adstack_db_connection_pool_size',
  help: 'Database connection pool size',
  labelNames: ['state'],
  registers: [register],
});

export const cacheHitsTotal = new Counter({
  name: 'adstack_cache_hits_total',
  help: 'Total number of cache hits',
  labelNames: ['operation'],
  registers: [register],
});

export const cacheMissesTotal = new Counter({
  name: 'adstack_cache_misses_total',
  help: 'Total number of cache misses',
  labelNames: ['operation'],
  registers: [register],
});

export const subscriptionsActive = new Gauge({
  name: 'adstack_subscriptions_active',
  help: 'Number of active subscriptions',
  labelNames: ['tier'],
  registers: [register],
});

export const paymentsTotal = new Counter({
  name: 'adstack_payments_total',
  help: 'Total number of payment transactions',
  labelNames: ['status', 'provider'],
  registers: [register],
});

export const paymentAmount = new Histogram({
  name: 'adstack_payment_amount',
  help: 'Payment amounts processed',
  labelNames: ['currency', 'provider'],
  buckets: [1, 10, 50, 100, 500, 1000, 5000, 10000],
  registers: [register],
});

export const campaignsActive = new Gauge({
  name: 'adstack_campaigns_active',
  help: 'Number of active campaigns',
  registers: [register],
});

export const blockchainTxTotal = new Counter({
  name: 'adstack_blockchain_tx_total',
  help: 'Total blockchain transactions submitted',
  labelNames: ['type', 'status'],
  registers: [register],
});

export const blockchainTxDuration = new Histogram({
  name: 'adstack_blockchain_tx_duration_seconds',
  help: 'Duration of blockchain transaction confirmations',
  labelNames: ['type'],
  buckets: [1, 5, 10, 30, 60, 120, 300, 600],
  registers: [register],
});

function normalizeRoute(req: Request): string {
  if (!req.route) {
    const parts = req.path.split('/').filter(Boolean);
    if (parts.length > 2) {
      return '/' + parts.slice(0, 2).join('/') + '/:id';
    }
    return req.path;
  }
  return req.route.path;
}

export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (req.path === '/metrics' || req.path === '/health' || req.path === '/ready') {
    next();
    return;
  }

  activeConnections.inc();
  const start = process.hrtime.bigint();

  const originalEnd = res.end;
  res.end = function (this: Response, ...args: any[]): Response {
    const duration = Number(process.hrtime.bigint() - start) / 1e9;
    const route = normalizeRoute(req);
    const statusCode = res.statusCode.toString();

    httpRequestsTotal.inc({ method: req.method, route, status_code: statusCode });
    httpRequestDuration.observe({ method: req.method, route, status_code: statusCode }, duration);

    const reqSize = parseInt(req.get('content-length') || '0', 10);
    if (reqSize > 0) {
      httpRequestSize.observe({ method: req.method, route }, reqSize);
    }

    const resSize = parseInt(res.get('content-length') || '0', 10);
    if (resSize > 0) {
      httpResponseSize.observe({ method: req.method, route }, resSize);
    }

    activeConnections.dec();
    return originalEnd.apply(this, args as any);
  } as any;

  next();
}

export async function metricsEndpoint(_req: Request, res: Response): Promise<void> {
  try {
    res.set('Content-Type', register.contentType);
    const metrics = await register.metrics();
    res.end(metrics);
  } catch (err) {
    res.status(500).end('Error collecting metrics');
  }
}

export { register };

import { Router, Request, Response } from 'express';
import { testConnection, getPool } from '../lib/database';
import { getRedis } from '../lib/cache';
import { config } from '../config/config';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  return res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: config.app.env,
  });
});

router.get('/ready', async (_req: Request, res: Response) => {
  const checks: Record<string, { status: string; latency?: number }> = {};

  const dbStart = Date.now();
  try {
    const pool = getPool();
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    checks.database = { status: 'ok', latency: Date.now() - dbStart };
  } catch {
    checks.database = { status: 'error', latency: Date.now() - dbStart };
  }

  const redisStart = Date.now();
  try {
    const redis = getRedis();
    await redis.ping();
    checks.redis = { status: 'ok', latency: Date.now() - redisStart };
  } catch {
    checks.redis = { status: 'error', latency: Date.now() - redisStart };
  }

  const allHealthy = Object.values(checks).every((c) => c.status === 'ok');

  return res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'ready' : 'degraded',
    timestamp: new Date().toISOString(),
    checks,
  });
});

router.get('/live', (_req: Request, res: Response) => {
  return res.json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
      heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
    },
  });
});

router.get('/info', (_req: Request, res: Response) => {
  return res.json({
    name: 'AdStack API',
    version: '1.0.0',
    environment: config.app.env,
    node: process.version,
    platform: process.platform,
    uptime: Math.round(process.uptime()),
  });
});

export default router;

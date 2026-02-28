import type { Request, Response, Router } from 'express';
import { createLogger } from '../logging/logger';

const logger = createLogger({ service: 'health-check' });

type CheckStatus = 'healthy' | 'degraded' | 'unhealthy';

interface DependencyCheck {
  name: string;
  check: () => Promise<{ status: CheckStatus; latency: number; details?: Record<string, any> }>;
}

interface HealthResponse {
  status: CheckStatus;
  version: string;
  uptime: number;
  timestamp: string;
  dependencies: Record<string, {
    status: CheckStatus;
    latency: number;
    details?: Record<string, any>;
  }>;
}

const startTime = Date.now();

export function createHealthChecks(dependencies: DependencyCheck[]) {
  async function getHealth(): Promise<HealthResponse> {
    const results: HealthResponse = {
      status: 'healthy',
      version: process.env.npm_package_version || '0.0.0',
      uptime: Math.floor((Date.now() - startTime) / 1000),
      timestamp: new Date().toISOString(),
      dependencies: {},
    };

    const checks = await Promise.allSettled(
      dependencies.map(async (dep) => {
        const start = Date.now();
        try {
          const result = await Promise.race([
            dep.check(),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('Health check timeout')), 5000)
            ),
          ]);
          return { name: dep.name, ...result };
        } catch (err) {
          return {
            name: dep.name,
            status: 'unhealthy' as CheckStatus,
            latency: Date.now() - start,
            details: { error: (err as Error).message },
          };
        }
      })
    );

    for (const check of checks) {
      if (check.status === 'fulfilled') {
        const { name, ...rest } = check.value;
        results.dependencies[name] = rest;
        if (rest.status === 'unhealthy') {
          results.status = 'unhealthy';
        } else if (rest.status === 'degraded' && results.status !== 'unhealthy') {
          results.status = 'degraded';
        }
      }
    }

    return results;
  }

  return {
    health: async (_req: Request, res: Response): Promise<void> => {
      try {
        const health = await getHealth();
        const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;
        res.status(statusCode).json(health);
      } catch (err) {
        logger.error('Health check failed', { error: (err as Error).message });
        res.status(503).json({ status: 'unhealthy', error: 'Health check failed' });
      }
    },

    ready: async (_req: Request, res: Response): Promise<void> => {
      try {
        const health = await getHealth();
        if (health.status === 'unhealthy') {
          res.status(503).json({ ready: false, dependencies: health.dependencies });
        } else {
          res.status(200).json({ ready: true });
        }
      } catch (err) {
        res.status(503).json({ ready: false });
      }
    },

    live: (_req: Request, res: Response): void => {
      res.status(200).json({
        alive: true,
        uptime: Math.floor((Date.now() - startTime) / 1000),
      });
    },
  };
}

export function postgresCheck(pool: any): DependencyCheck {
  return {
    name: 'postgres',
    check: async () => {
      const start = Date.now();
      const result = await pool.query('SELECT 1 as ok');
      return {
        status: result.rows[0]?.ok === 1 ? 'healthy' : 'unhealthy',
        latency: Date.now() - start,
      };
    },
  };
}

export function redisCheck(client: any): DependencyCheck {
  return {
    name: 'redis',
    check: async () => {
      const start = Date.now();
      const pong = await client.ping();
      return {
        status: pong === 'PONG' ? 'healthy' : 'unhealthy',
        latency: Date.now() - start,
      };
    },
  };
}

export function stacksApiCheck(apiUrl: string): DependencyCheck {
  return {
    name: 'stacks-api',
    check: async () => {
      const start = Date.now();
      const axios = (await import('axios')).default;
      const response = await axios.get(`${apiUrl}/v2/info`, { timeout: 5000 });
      const latency = Date.now() - start;
      return {
        status: latency > 3000 ? 'degraded' : 'healthy',
        latency,
        details: {
          blockHeight: response.data.stacks_tip_height,
          network: response.data.network_id,
        },
      };
    },
  };
}

export function externalServiceCheck(name: string, url: string): DependencyCheck {
  return {
    name,
    check: async () => {
      const start = Date.now();
      const axios = (await import('axios')).default;
      await axios.get(url, { timeout: 5000 });
      const latency = Date.now() - start;
      return {
        status: latency > 3000 ? 'degraded' : 'healthy',
        latency,
      };
    },
  };
}

import axios from 'axios';
import { createLogger } from '../logging/logger';

const logger = createLogger({ service: 'uptime-monitor' });

interface ServiceEndpoint {
  name: string;
  url: string;
  interval: number;
  timeout: number;
  expectedStatus?: number;
}

interface UptimeResult {
  service: string;
  status: 'up' | 'down' | 'degraded';
  responseTime: number;
  statusCode: number | null;
  timestamp: string;
  error?: string;
}

const DEFAULT_ENDPOINTS: ServiceEndpoint[] = [
  {
    name: 'backend-api',
    url: 'http://localhost:3000/health',
    interval: 30000,
    timeout: 10000,
    expectedStatus: 200,
  },
  {
    name: 'frontend',
    url: 'http://localhost:3001/api/health',
    interval: 30000,
    timeout: 10000,
    expectedStatus: 200,
  },
  {
    name: 'websocket-server',
    url: 'http://localhost:3002/health',
    interval: 30000,
    timeout: 10000,
    expectedStatus: 200,
  },
  {
    name: 'ml-service',
    url: 'http://localhost:8000/health',
    interval: 60000,
    timeout: 10000,
    expectedStatus: 200,
  },
];

export class UptimeMonitor {
  private endpoints: ServiceEndpoint[];
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private history: Map<string, UptimeResult[]> = new Map();
  private isRunning: boolean = false;
  private onStatusChange?: (result: UptimeResult) => void;

  constructor(endpoints?: ServiceEndpoint[], onStatusChange?: (result: UptimeResult) => void) {
    this.endpoints = endpoints || DEFAULT_ENDPOINTS;
    this.onStatusChange = onStatusChange;
  }

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;

    logger.info('Starting uptime monitor', { endpoints: this.endpoints.length });

    for (const endpoint of this.endpoints) {
      this.history.set(endpoint.name, []);
      this.checkEndpoint(endpoint);
      const id = setInterval(() => this.checkEndpoint(endpoint), endpoint.interval);
      this.intervals.set(endpoint.name, id);
    }
  }

  stop(): void {
    for (const [name, id] of this.intervals) {
      clearInterval(id);
    }
    this.intervals.clear();
    this.isRunning = false;
    logger.info('Uptime monitor stopped');
  }

  private async checkEndpoint(endpoint: ServiceEndpoint): Promise<void> {
    const start = Date.now();
    let result: UptimeResult;

    try {
      const response = await axios.get(endpoint.url, {
        timeout: endpoint.timeout,
        validateStatus: () => true,
      });

      const responseTime = Date.now() - start;
      const expectedStatus = endpoint.expectedStatus || 200;
      let status: 'up' | 'down' | 'degraded' = 'up';

      if (response.status !== expectedStatus) {
        status = 'down';
      } else if (responseTime > endpoint.timeout / 2) {
        status = 'degraded';
      }

      result = {
        service: endpoint.name,
        status,
        responseTime,
        statusCode: response.status,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      result = {
        service: endpoint.name,
        status: 'down',
        responseTime: Date.now() - start,
        statusCode: null,
        timestamp: new Date().toISOString(),
        error: (err as Error).message,
      };
    }

    const history = this.history.get(endpoint.name) || [];
    const previousStatus = history.length > 0 ? history[history.length - 1].status : null;

    history.push(result);
    if (history.length > 1000) {
      history.splice(0, history.length - 1000);
    }
    this.history.set(endpoint.name, history);

    if (previousStatus && previousStatus !== result.status) {
      logger.warn('Service status changed', {
        service: endpoint.name,
        from: previousStatus,
        to: result.status,
        responseTime: result.responseTime,
      });

      if (this.onStatusChange) {
        this.onStatusChange(result);
      }
    }

    if (result.status === 'down') {
      logger.error('Service is down', {
        service: endpoint.name,
        error: result.error,
        statusCode: result.statusCode,
      });
    }
  }

  getStatus(): Record<string, { current: string; uptime: number; avgResponseTime: number }> {
    const status: Record<string, any> = {};

    for (const [name, history] of this.history) {
      if (history.length === 0) {
        status[name] = { current: 'unknown', uptime: 0, avgResponseTime: 0 };
        continue;
      }

      const current = history[history.length - 1].status;
      const upCount = history.filter((r) => r.status === 'up').length;
      const uptime = (upCount / history.length) * 100;
      const avgResponseTime =
        history.reduce((sum, r) => sum + r.responseTime, 0) / history.length;

      status[name] = {
        current,
        uptime: Math.round(uptime * 100) / 100,
        avgResponseTime: Math.round(avgResponseTime),
      };
    }

    return status;
  }
}

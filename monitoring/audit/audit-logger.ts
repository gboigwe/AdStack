import { createLogger } from '../logging/logger';
import type { Request, Response, NextFunction } from 'express';

const logger = createLogger({ service: 'audit' });

type AuditAction =
  | 'user.login'
  | 'user.logout'
  | 'user.login_failed'
  | 'user.created'
  | 'user.updated'
  | 'user.deleted'
  | 'campaign.created'
  | 'campaign.updated'
  | 'campaign.deleted'
  | 'campaign.activated'
  | 'campaign.paused'
  | 'subscription.created'
  | 'subscription.upgraded'
  | 'subscription.cancelled'
  | 'payment.processed'
  | 'payment.refunded'
  | 'payment.failed'
  | 'admin.settings_changed'
  | 'admin.user_role_changed'
  | 'admin.data_export'
  | 'api_key.created'
  | 'api_key.revoked'
  | 'data.accessed'
  | 'data.exported'
  | 'data.deleted';

interface AuditEntry {
  action: AuditAction;
  actor: {
    id: string;
    type: 'user' | 'admin' | 'system' | 'api_key';
    ip?: string;
    userAgent?: string;
  };
  resource: {
    type: string;
    id?: string;
  };
  details?: Record<string, any>;
  timestamp: string;
  requestId?: string;
}

interface AuditStore {
  save(entry: AuditEntry): Promise<void>;
  query(filters: Partial<AuditEntry> & { from?: string; to?: string; limit?: number }): Promise<AuditEntry[]>;
}

class PostgresAuditStore implements AuditStore {
  private pool: any;

  constructor(pool: any) {
    this.pool = pool;
  }

  async save(entry: AuditEntry): Promise<void> {
    try {
      await this.pool.query(
        `INSERT INTO audit_log (action, actor_id, actor_type, actor_ip, actor_user_agent, resource_type, resource_id, details, request_id, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          entry.action,
          entry.actor.id,
          entry.actor.type,
          entry.actor.ip || null,
          entry.actor.userAgent || null,
          entry.resource.type,
          entry.resource.id || null,
          entry.details ? JSON.stringify(entry.details) : null,
          entry.requestId || null,
          entry.timestamp,
        ]
      );
    } catch (err) {
      logger.error('Failed to save audit entry', {
        error: (err as Error).message,
        action: entry.action,
      });
    }
  }

  async query(filters: any): Promise<AuditEntry[]> {
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (filters.action) {
      conditions.push(`action = $${paramIndex++}`);
      params.push(filters.action);
    }
    if (filters.actor?.id) {
      conditions.push(`actor_id = $${paramIndex++}`);
      params.push(filters.actor.id);
    }
    if (filters.resource?.type) {
      conditions.push(`resource_type = $${paramIndex++}`);
      params.push(filters.resource.type);
    }
    if (filters.from) {
      conditions.push(`created_at >= $${paramIndex++}`);
      params.push(filters.from);
    }
    if (filters.to) {
      conditions.push(`created_at <= $${paramIndex++}`);
      params.push(filters.to);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const limit = filters.limit || 100;

    const result = await this.pool.query(
      `SELECT * FROM audit_log ${where} ORDER BY created_at DESC LIMIT $${paramIndex}`,
      [...params, limit]
    );

    return result.rows.map((row: any) => ({
      action: row.action,
      actor: {
        id: row.actor_id,
        type: row.actor_type,
        ip: row.actor_ip,
        userAgent: row.actor_user_agent,
      },
      resource: {
        type: row.resource_type,
        id: row.resource_id,
      },
      details: row.details,
      timestamp: row.created_at,
      requestId: row.request_id,
    }));
  }
}

export class AuditLogger {
  private store: AuditStore;

  constructor(store: AuditStore) {
    this.store = store;
  }

  async log(entry: Omit<AuditEntry, 'timestamp'>): Promise<void> {
    const fullEntry: AuditEntry = {
      ...entry,
      timestamp: new Date().toISOString(),
    };

    logger.info('Audit event', {
      action: fullEntry.action,
      actorId: fullEntry.actor.id,
      resourceType: fullEntry.resource.type,
      resourceId: fullEntry.resource.id,
    });

    await this.store.save(fullEntry);
  }

  async query(filters: any): Promise<AuditEntry[]> {
    return this.store.query(filters);
  }
}

export function auditMiddleware(auditLogger: AuditLogger) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const originalEnd = res.end;

    res.end = function (this: Response, ...args: any[]): Response {
      const user = (req as any).user;
      if (!user) return originalEnd.apply(this, args as any);

      const method = req.method;
      const path = req.path;

      let action: AuditAction | null = null;
      let resourceType = '';

      if (path.startsWith('/api/auth/login') && method === 'POST') {
        action = res.statusCode < 400 ? 'user.login' : 'user.login_failed';
        resourceType = 'auth';
      } else if (path.startsWith('/api/campaigns') && method === 'POST') {
        action = 'campaign.created';
        resourceType = 'campaign';
      } else if (path.startsWith('/api/campaigns') && (method === 'PUT' || method === 'PATCH')) {
        action = 'campaign.updated';
        resourceType = 'campaign';
      } else if (path.startsWith('/api/campaigns') && method === 'DELETE') {
        action = 'campaign.deleted';
        resourceType = 'campaign';
      } else if (path.startsWith('/api/payments') && method === 'POST') {
        action = 'payment.processed';
        resourceType = 'payment';
      } else if (path.startsWith('/api/subscriptions') && method === 'POST') {
        action = 'subscription.created';
        resourceType = 'subscription';
      }

      if (action) {
        const pathParts = path.split('/');
        const resourceId = pathParts.length > 3 ? pathParts[3] : undefined;

        auditLogger.log({
          action,
          actor: {
            id: user.id || user.wallet_address,
            type: user.role === 'admin' ? 'admin' : 'user',
            ip: req.ip,
            userAgent: req.get('user-agent'),
          },
          resource: {
            type: resourceType,
            id: resourceId,
          },
          requestId: (req as any).requestId,
        }).catch(() => {});
      }

      return originalEnd.apply(this, args as any);
    } as any;

    next();
  };
}

export function createAuditLogger(pool: any): AuditLogger {
  const store = new PostgresAuditStore(pool);
  return new AuditLogger(store);
}

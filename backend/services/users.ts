import { query, queryOne, queryMany } from '../lib/database';
import { User, PaginatedResult, AuditLogEntry } from '../types';

export async function listUsers(
  page: number = 1,
  limit: number = 20,
  filters: { search?: string; tier?: string; isVerified?: boolean } = {}
): Promise<PaginatedResult<User>> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (filters.search) {
    conditions.push(
      `(wallet_address ILIKE $${paramIndex} OR email ILIKE $${paramIndex} OR display_name ILIKE $${paramIndex})`
    );
    params.push(`%${filters.search}%`);
    paramIndex++;
  }

  if (filters.tier) {
    conditions.push(`tier = $${paramIndex++}`);
    params.push(filters.tier);
  }

  if (filters.isVerified !== undefined) {
    conditions.push(`is_verified = $${paramIndex++}`);
    params.push(filters.isVerified);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (page - 1) * limit;

  const [users, countResult] = await Promise.all([
    queryMany<User>(
      `SELECT * FROM users ${where} ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
      [...params, limit, offset]
    ),
    queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM users ${where}`,
      params
    ),
  ]);

  const total = parseInt(countResult?.count || '0', 10);

  return {
    data: users,
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  };
}

export async function getUserById(userId: string): Promise<User | null> {
  return queryOne<User>('SELECT * FROM users WHERE id = $1', [userId]);
}

export async function updateUserTier(userId: string, tier: string): Promise<User | null> {
  return queryOne<User>(
    'UPDATE users SET tier = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
    [tier, userId]
  );
}

export async function setAdminStatus(userId: string, isAdmin: boolean): Promise<User | null> {
  return queryOne<User>(
    'UPDATE users SET is_admin = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
    [isAdmin, userId]
  );
}

export async function deleteUser(userId: string): Promise<boolean> {
  const result = await query('DELETE FROM users WHERE id = $1', [userId]);
  return (result.rowCount ?? 0) > 0;
}

export async function getAuditLog(
  entityType?: string,
  entityId?: string,
  page: number = 1,
  limit: number = 50
): Promise<PaginatedResult<AuditLogEntry>> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (entityType) {
    conditions.push(`entity_type = $${paramIndex++}`);
    params.push(entityType);
  }

  if (entityId) {
    conditions.push(`entity_id = $${paramIndex++}`);
    params.push(entityId);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (page - 1) * limit;

  const [entries, countResult] = await Promise.all([
    queryMany<AuditLogEntry>(
      `SELECT * FROM audit_log ${where} ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
      [...params, limit, offset]
    ),
    queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM audit_log ${where}`,
      params
    ),
  ]);

  const total = parseInt(countResult?.count || '0', 10);

  return {
    data: entries,
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  };
}

export async function createAuditEntry(input: {
  entityType: string;
  entityId: string;
  userId: string;
  action: string;
  changes?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  await query(
    `INSERT INTO audit_log (id, entity_type, entity_id, user_id, action, changes, ip_address, user_agent, created_at)
     VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, NOW())`,
    [
      input.entityType,
      input.entityId,
      input.userId,
      input.action,
      input.changes ? JSON.stringify(input.changes) : null,
      input.ipAddress || null,
      input.userAgent || null,
    ]
  );
}

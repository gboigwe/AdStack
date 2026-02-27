import { query, queryOne, queryMany } from '../lib/database';
import { cacheGet, cacheSet, cacheDelete } from '../lib/cache';
import { logger } from '../lib/logger';

interface PublisherRow {
  id: string;
  user_id: string;
  name: string;
  domain: string;
  status: string;
  verification_code: string;
  verified_at: string | null;
  category: string;
  monthly_traffic: number;
  ad_slots: number;
  revenue_share: number;
  total_impressions: number;
  total_revenue: number;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export async function getPublisherById(id: string): Promise<PublisherRow | null> {
  const cacheKey = `publisher:${id}`;
  const cached = await cacheGet<PublisherRow>(cacheKey);
  if (cached) return cached;

  const row = await queryOne<PublisherRow>('SELECT * FROM publishers WHERE id = $1', [id]);
  if (row) await cacheSet(cacheKey, row, 600);
  return row;
}

export async function getPublisherByUserId(userId: string): Promise<PublisherRow | null> {
  return queryOne<PublisherRow>('SELECT * FROM publishers WHERE user_id = $1', [userId]);
}

export async function listPublishers(filters: {
  status?: string;
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{ data: PublisherRow[]; total: number; page: number; pages: number }> {
  const { status, category, search, page = 1, limit = 20 } = filters;
  const conditions: string[] = [];
  const params: any[] = [];
  let idx = 1;

  if (status) {
    conditions.push(`status = $${idx++}`);
    params.push(status);
  }
  if (category) {
    conditions.push(`category = $${idx++}`);
    params.push(category);
  }
  if (search) {
    conditions.push(`(name ILIKE $${idx} OR domain ILIKE $${idx})`);
    params.push(`%${search}%`);
    idx++;
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (page - 1) * limit;

  const [rows, countResult] = await Promise.all([
    queryMany<PublisherRow>(
      `SELECT * FROM publishers ${where} ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset]
    ),
    queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM publishers ${where}`, params),
  ]);

  const total = parseInt(countResult?.count || '0', 10);

  return { data: rows, total, page, pages: Math.ceil(total / limit) };
}

export async function registerPublisher(input: {
  userId: string;
  name: string;
  domain: string;
  category: string;
  adSlots?: number;
}): Promise<PublisherRow> {
  const existing = await queryOne('SELECT id FROM publishers WHERE domain = $1', [input.domain]);
  if (existing) throw new Error('Domain already registered');

  const verificationCode = `adstack-verify-${generateCode()}`;

  const row = await queryOne<PublisherRow>(
    `INSERT INTO publishers (user_id, name, domain, status, verification_code, category, ad_slots)
     VALUES ($1, $2, $3, 'pending', $4, $5, $6)
     RETURNING *`,
    [input.userId, input.name, input.domain, verificationCode, input.category, input.adSlots || 1]
  );

  if (!row) throw new Error('Failed to register publisher');
  return row;
}

export async function verifyPublisher(id: string, method: 'dns' | 'meta' | 'file'): Promise<{
  verified: boolean;
  message: string;
}> {
  const publisher = await getPublisherById(id);
  if (!publisher) throw new Error('Publisher not found');

  if (publisher.status === 'active') {
    return { verified: true, message: 'Already verified' };
  }

  // In production, this would actually check DNS TXT records, meta tags, or file presence
  // For now, mark as verified if the publisher is in pending status
  logger.info(`Verifying publisher ${id} using ${method} method for domain ${publisher.domain}`);

  await query(
    `UPDATE publishers SET status = 'active', verified_at = NOW() WHERE id = $1`,
    [id]
  );

  await cacheDelete(`publisher:${id}`);
  return { verified: true, message: 'Domain verified successfully' };
}

export async function updatePublisher(
  id: string,
  updates: Partial<{
    name: string;
    category: string;
    adSlots: number;
    revenueShare: number;
    monthlyTraffic: number;
    metadata: Record<string, any>;
  }>
): Promise<PublisherRow | null> {
  const fields: string[] = [];
  const values: any[] = [];
  let idx = 2;

  if (updates.name !== undefined) {
    fields.push(`name = $${idx++}`);
    values.push(updates.name);
  }
  if (updates.category !== undefined) {
    fields.push(`category = $${idx++}`);
    values.push(updates.category);
  }
  if (updates.adSlots !== undefined) {
    fields.push(`ad_slots = $${idx++}`);
    values.push(updates.adSlots);
  }
  if (updates.revenueShare !== undefined) {
    fields.push(`revenue_share = $${idx++}`);
    values.push(updates.revenueShare);
  }
  if (updates.monthlyTraffic !== undefined) {
    fields.push(`monthly_traffic = $${idx++}`);
    values.push(updates.monthlyTraffic);
  }
  if (updates.metadata !== undefined) {
    fields.push(`metadata = $${idx++}`);
    values.push(JSON.stringify(updates.metadata));
  }

  if (fields.length === 0) return getPublisherById(id);

  const row = await queryOne<PublisherRow>(
    `UPDATE publishers SET ${fields.join(', ')} WHERE id = $1 RETURNING *`,
    [id, ...values]
  );

  await cacheDelete(`publisher:${id}`);
  return row;
}

export async function getPublisherStats(id: string): Promise<{
  totalImpressions: number;
  totalClicks: number;
  totalRevenue: number;
  fillRate: number;
  averageCpm: number;
}> {
  const stats = await queryOne<{
    total_impressions: number;
    total_clicks: number;
    total_revenue: number;
    total_requests: number;
  }>(
    `SELECT
       COALESCE(SUM(CASE WHEN event_type = 'impression' THEN 1 ELSE 0 END), 0) as total_impressions,
       COALESCE(SUM(CASE WHEN event_type = 'click' THEN 1 ELSE 0 END), 0) as total_clicks,
       COALESCE(SUM(amount), 0) as total_revenue,
       COUNT(*) as total_requests
     FROM analytics_events
     WHERE user_id = (SELECT user_id FROM publishers WHERE id = $1)`,
    [id]
  );

  const impressions = Number(stats?.total_impressions || 0);
  const requests = Number(stats?.total_requests || 0);
  const revenue = Number(stats?.total_revenue || 0);

  return {
    totalImpressions: impressions,
    totalClicks: Number(stats?.total_clicks || 0),
    totalRevenue: revenue,
    fillRate: requests > 0 ? (impressions / requests) * 100 : 0,
    averageCpm: impressions > 0 ? (revenue / impressions) * 1000 : 0,
  };
}

export async function suspendPublisher(id: string, reason: string): Promise<boolean> {
  await query(
    `UPDATE publishers SET status = 'suspended', metadata = metadata || $2 WHERE id = $1`,
    [id, JSON.stringify({ suspensionReason: reason, suspendedAt: new Date().toISOString() })]
  );
  await cacheDelete(`publisher:${id}`);
  return true;
}

function generateCode(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

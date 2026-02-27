import { query, queryOne, queryMany, transaction } from '../lib/database';
import { cacheGet, cacheSet, cacheDelete } from '../lib/cache';
import { v4 as uuidv4 } from 'uuid';
import {
  Campaign,
  CampaignStatus,
  PaginatedResult,
  TargetingRules,
} from '../types';

interface CreateCampaignInput {
  userId: string;
  name: string;
  description?: string;
  budget: number;
  dailyBudget?: number;
  startDate: string;
  endDate?: string;
  targetingRules?: TargetingRules;
}

interface UpdateCampaignInput {
  name?: string;
  description?: string;
  budget?: number;
  dailyBudget?: number;
  endDate?: string;
  targetingRules?: TargetingRules;
}

interface CampaignFilters {
  status?: CampaignStatus;
  search?: string;
  startDateFrom?: string;
  startDateTo?: string;
}

export async function getCampaignById(campaignId: string): Promise<Campaign | null> {
  const cacheKey = `campaign:${campaignId}`;
  const cached = await cacheGet<Campaign>(cacheKey);
  if (cached) return cached;

  const row = await queryOne<Campaign>(
    'SELECT * FROM campaigns WHERE id = $1',
    [campaignId]
  );

  if (row) {
    await cacheSet(cacheKey, row, 300);
  }

  return row;
}

export async function listCampaigns(
  userId: string,
  page: number = 1,
  limit: number = 20,
  filters: CampaignFilters = {}
): Promise<PaginatedResult<Campaign>> {
  const conditions: string[] = ['user_id = $1'];
  const params: unknown[] = [userId];
  let paramIndex = 2;

  if (filters.status) {
    conditions.push(`status = $${paramIndex++}`);
    params.push(filters.status);
  }

  if (filters.search) {
    conditions.push(`(name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`);
    params.push(`%${filters.search}%`);
    paramIndex++;
  }

  if (filters.startDateFrom) {
    conditions.push(`start_date >= $${paramIndex++}`);
    params.push(filters.startDateFrom);
  }

  if (filters.startDateTo) {
    conditions.push(`start_date <= $${paramIndex++}`);
    params.push(filters.startDateTo);
  }

  const where = conditions.join(' AND ');
  const offset = (page - 1) * limit;

  const [campaigns, countResult] = await Promise.all([
    queryMany<Campaign>(
      `SELECT * FROM campaigns WHERE ${where} ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
      [...params, limit, offset]
    ),
    queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM campaigns WHERE ${where}`,
      params
    ),
  ]);

  const total = parseInt(countResult?.count || '0', 10);

  return {
    data: campaigns,
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  };
}

export async function createCampaign(input: CreateCampaignInput): Promise<Campaign> {
  const id = uuidv4();

  const campaign = await queryOne<Campaign>(
    `INSERT INTO campaigns (
      id, user_id, name, description, status, budget, daily_budget,
      start_date, end_date, targeting_rules, spent, impressions, clicks,
      conversions, ctr, cpc, cpm, created_at, updated_at
    ) VALUES (
      $1, $2, $3, $4, 'draft', $5, $6, $7, $8, $9,
      0, 0, 0, 0, 0, 0, 0, NOW(), NOW()
    ) RETURNING *`,
    [
      id,
      input.userId,
      input.name,
      input.description || null,
      input.budget,
      input.dailyBudget || null,
      input.startDate,
      input.endDate || null,
      input.targetingRules ? JSON.stringify(input.targetingRules) : null,
    ]
  );

  if (!campaign) {
    throw new Error('Failed to create campaign');
  }

  return campaign;
}

export async function updateCampaign(
  campaignId: string,
  userId: string,
  updates: UpdateCampaignInput
): Promise<Campaign | null> {
  const existing = await getCampaignById(campaignId);
  if (!existing || existing.userId !== userId) return null;

  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (updates.name !== undefined) {
    fields.push(`name = $${paramIndex++}`);
    values.push(updates.name);
  }
  if (updates.description !== undefined) {
    fields.push(`description = $${paramIndex++}`);
    values.push(updates.description);
  }
  if (updates.budget !== undefined) {
    fields.push(`budget = $${paramIndex++}`);
    values.push(updates.budget);
  }
  if (updates.dailyBudget !== undefined) {
    fields.push(`daily_budget = $${paramIndex++}`);
    values.push(updates.dailyBudget);
  }
  if (updates.endDate !== undefined) {
    fields.push(`end_date = $${paramIndex++}`);
    values.push(updates.endDate);
  }
  if (updates.targetingRules !== undefined) {
    fields.push(`targeting_rules = $${paramIndex++}`);
    values.push(JSON.stringify(updates.targetingRules));
  }

  if (fields.length === 0) return existing;

  fields.push('updated_at = NOW()');
  values.push(campaignId);

  const result = await queryOne<Campaign>(
    `UPDATE campaigns SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );

  await cacheDelete(`campaign:${campaignId}`);

  return result;
}

export async function updateCampaignStatus(
  campaignId: string,
  userId: string,
  status: CampaignStatus
): Promise<Campaign | null> {
  const existing = await getCampaignById(campaignId);
  if (!existing || existing.userId !== userId) return null;

  const validTransitions: Record<CampaignStatus, CampaignStatus[]> = {
    draft: ['pending', 'canceled'],
    pending: ['active', 'canceled'],
    active: ['paused', 'completed', 'canceled'],
    paused: ['active', 'canceled'],
    completed: [],
    canceled: [],
  };

  const allowed = validTransitions[existing.status as CampaignStatus] || [];
  if (!allowed.includes(status)) {
    throw new Error(`Cannot transition from ${existing.status} to ${status}`);
  }

  const result = await queryOne<Campaign>(
    'UPDATE campaigns SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
    [status, campaignId]
  );

  await cacheDelete(`campaign:${campaignId}`);

  return result;
}

export async function deleteCampaign(campaignId: string, userId: string): Promise<boolean> {
  const existing = await getCampaignById(campaignId);
  if (!existing || existing.userId !== userId) return false;

  if (existing.status === 'active') {
    throw new Error('Cannot delete an active campaign. Pause or cancel it first.');
  }

  const result = await query(
    'DELETE FROM campaigns WHERE id = $1 AND user_id = $2',
    [campaignId, userId]
  );

  await cacheDelete(`campaign:${campaignId}`);

  return (result.rowCount ?? 0) > 0;
}

export async function getCampaignStats(campaignId: string): Promise<{
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  ctr: number;
  cpc: number;
  cpm: number;
} | null> {
  const campaign = await getCampaignById(campaignId);
  if (!campaign) return null;

  return {
    impressions: campaign.impressions,
    clicks: campaign.clicks,
    conversions: campaign.conversions,
    spend: campaign.spent,
    ctr: campaign.ctr,
    cpc: campaign.cpc,
    cpm: campaign.cpm,
  };
}

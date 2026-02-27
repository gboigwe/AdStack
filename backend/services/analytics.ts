import { queryOne, queryMany } from '../lib/database';
import { cacheGet, cacheSet } from '../lib/cache';
import { AnalyticsSummary, AnalyticsTimeSeries } from '../types';

interface AnalyticsFilters {
  startDate: string;
  endDate: string;
  campaignId?: string;
  granularity?: 'hour' | 'day' | 'week' | 'month';
}

export async function getSummary(
  userId: string,
  filters: AnalyticsFilters
): Promise<AnalyticsSummary> {
  const cacheKey = `analytics:summary:${userId}:${filters.startDate}:${filters.endDate}:${filters.campaignId || 'all'}`;
  const cached = await cacheGet<AnalyticsSummary>(cacheKey);
  if (cached) return cached;

  const conditions = ['c.user_id = $1', 'c.created_at >= $2', 'c.created_at <= $3'];
  const params: unknown[] = [userId, filters.startDate, filters.endDate];

  if (filters.campaignId) {
    conditions.push('c.id = $4');
    params.push(filters.campaignId);
  }

  const where = conditions.join(' AND ');

  const result = await queryOne<{
    total_impressions: string;
    total_clicks: string;
    total_conversions: string;
    total_spend: string;
  }>(
    `SELECT
      COALESCE(SUM(c.impressions), 0) as total_impressions,
      COALESCE(SUM(c.clicks), 0) as total_clicks,
      COALESCE(SUM(c.conversions), 0) as total_conversions,
      COALESCE(SUM(c.spent), 0) as total_spend
    FROM campaigns c
    WHERE ${where}`,
    params
  );

  const impressions = parseInt(result?.total_impressions || '0', 10);
  const clicks = parseInt(result?.total_clicks || '0', 10);
  const conversions = parseInt(result?.total_conversions || '0', 10);
  const spend = parseFloat(result?.total_spend || '0');

  const summary: AnalyticsSummary = {
    impressions,
    clicks,
    conversions,
    spend,
    ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
    cpc: clicks > 0 ? spend / clicks : 0,
    cpm: impressions > 0 ? (spend / impressions) * 1000 : 0,
    roas: spend > 0 ? (conversions * 10) / spend : 0,
  };

  await cacheSet(cacheKey, summary, 600);

  return summary;
}

export async function getTimeSeries(
  userId: string,
  filters: AnalyticsFilters
): Promise<AnalyticsTimeSeries[]> {
  const granularity = filters.granularity || 'day';
  const cacheKey = `analytics:ts:${userId}:${filters.startDate}:${filters.endDate}:${filters.campaignId || 'all'}:${granularity}`;
  const cached = await cacheGet<AnalyticsTimeSeries[]>(cacheKey);
  if (cached) return cached;

  let dateFormat: string;
  switch (granularity) {
    case 'hour':
      dateFormat = 'YYYY-MM-DD HH24:00';
      break;
    case 'week':
      dateFormat = 'IYYY-IW';
      break;
    case 'month':
      dateFormat = 'YYYY-MM';
      break;
    default:
      dateFormat = 'YYYY-MM-DD';
  }

  const conditions = ['c.user_id = $1', 'c.created_at >= $2', 'c.created_at <= $3'];
  const params: unknown[] = [userId, filters.startDate, filters.endDate];

  if (filters.campaignId) {
    conditions.push('c.id = $4');
    params.push(filters.campaignId);
  }

  const where = conditions.join(' AND ');

  const rows = await queryMany<{
    date: string;
    total_impressions: string;
    total_clicks: string;
    total_conversions: string;
    total_spend: string;
  }>(
    `SELECT
      TO_CHAR(c.created_at, '${dateFormat}') as date,
      COALESCE(SUM(c.impressions), 0) as total_impressions,
      COALESCE(SUM(c.clicks), 0) as total_clicks,
      COALESCE(SUM(c.conversions), 0) as total_conversions,
      COALESCE(SUM(c.spent), 0) as total_spend
    FROM campaigns c
    WHERE ${where}
    GROUP BY TO_CHAR(c.created_at, '${dateFormat}')
    ORDER BY date`,
    params
  );

  const series: AnalyticsTimeSeries[] = rows.map((row) => ({
    date: row.date,
    impressions: parseInt(row.total_impressions, 10),
    clicks: parseInt(row.total_clicks, 10),
    conversions: parseInt(row.total_conversions, 10),
    spend: parseFloat(row.total_spend),
  }));

  await cacheSet(cacheKey, series, 600);

  return series;
}

export async function getTopCampaigns(
  userId: string,
  metric: 'impressions' | 'clicks' | 'conversions' | 'spend' = 'impressions',
  limit: number = 10
): Promise<Array<{ id: string; name: string; value: number }>> {
  const columnMap: Record<string, string> = {
    impressions: 'impressions',
    clicks: 'clicks',
    conversions: 'conversions',
    spend: 'spent',
  };

  const column = columnMap[metric] || 'impressions';

  const rows = await queryMany<{ id: string; name: string; value: string }>(
    `SELECT id, name, ${column} as value
     FROM campaigns
     WHERE user_id = $1 AND status IN ('active', 'completed')
     ORDER BY ${column} DESC
     LIMIT $2`,
    [userId, limit]
  );

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    value: parseFloat(row.value),
  }));
}

export async function getUsageBreakdown(
  userId: string,
  period: string
): Promise<Array<{ usageType: string; amount: number; limit: number; percentage: number }>> {
  const rows = await queryMany<{
    usage_type: string;
    amount: string;
    limit_amount: string;
  }>(
    `SELECT u.usage_type, u.amount, u.limit_amount
     FROM usage u
     JOIN subscriptions s ON u.subscription_id = s.id
     WHERE s.user_id = $1 AND u.period_start <= NOW() AND u.period_end >= NOW()`,
    [userId]
  );

  return rows.map((row) => {
    const amount = parseInt(row.amount, 10);
    const limit = parseInt(row.limit_amount, 10);
    return {
      usageType: row.usage_type,
      amount,
      limit,
      percentage: limit > 0 ? Math.round((amount / limit) * 100) : 0,
    };
  });
}

import { query, queryOne, queryMany, transaction } from '../lib/database';
import { contractCall, contractRead, waitForTransaction } from '../lib/stacks';
import { sendEmail } from '../lib/email';
import { cacheGet, cacheSet, cacheDelete } from '../lib/cache';
import { logger } from '../lib/logger';
import { config } from '../config/config';

interface CreateSubscriptionInput {
  userId: string;
  planId: number;
  paymentMethodId?: string;
  billingInterval: 'monthly' | 'yearly';
}

interface SubscriptionRow {
  id: string;
  user_id: string;
  subscription_id: number;
  plan_id: number;
  plan_name: string;
  tier: string;
  status: string;
  price: number;
  billing_interval: string;
  current_period_start: Date;
  current_period_end: Date;
  auto_renew: boolean;
  cancel_at_period_end: boolean;
  canceled_at: Date | null;
  cancellation_feedback: string | null;
  default_payment_method_id: string | null;
  created_at: Date;
  updated_at: Date;
}

interface PlanRow {
  id: number;
  name: string;
  tier: string;
  description: string;
  price: number;
  billing_interval: string;
  features: string[];
  limits: Record<string, number>;
  is_active: boolean;
  display_order: number;
}

export async function getSubscription(userId: string): Promise<SubscriptionRow | null> {
  const cacheKey = `subscription:user:${userId}`;
  const cached = await cacheGet<SubscriptionRow>(cacheKey);
  if (cached) return cached;

  const row = await queryOne<SubscriptionRow>(
    `SELECT * FROM subscriptions
     WHERE user_id = $1 AND status IN ('active', 'past_due', 'grace_period')
     ORDER BY created_at DESC LIMIT 1`,
    [userId]
  );

  if (!row) return null;

  try {
    const onChainData = await contractRead('subscription-manager', 'get-user-subscription', [userId]);
    if (onChainData) {
      const newStatus = getStatusString(onChainData.status);
      await query(
        `UPDATE subscriptions SET status = $2, auto_renew = $3 WHERE id = $1`,
        [row.id, newStatus, onChainData.autoRenew]
      );
      row.status = newStatus;
      row.auto_renew = onChainData.autoRenew;
    }
  } catch (err) {
    logger.warn('Failed to sync subscription with blockchain, using DB state', err);
  }

  await cacheSet(cacheKey, row, 300);
  return row;
}

export async function getSubscriptionById(id: string): Promise<SubscriptionRow | null> {
  return queryOne<SubscriptionRow>('SELECT * FROM subscriptions WHERE id = $1', [id]);
}

export async function createSubscription(input: CreateSubscriptionInput): Promise<SubscriptionRow> {
  const { userId, planId, paymentMethodId, billingInterval } = input;

  const plan = await queryOne<PlanRow>(
    'SELECT * FROM subscription_plans WHERE id = $1 AND is_active = true',
    [planId]
  );

  if (!plan) {
    throw new Error('Invalid or inactive plan');
  }

  if (paymentMethodId && plan.price > 0) {
    await processInitialPayment(userId, plan.price, paymentMethodId, plan.name);
  }

  let subscriptionId = Date.now();
  try {
    const txId = await contractCall('subscription-manager', 'subscribe', [planId]);
    const txResult = await waitForTransaction(txId);
    if (txResult) {
      subscriptionId = typeof txResult === 'number' ? txResult : subscriptionId;
    }
  } catch (err) {
    logger.warn('Blockchain subscription creation failed, continuing with DB-only', err);
  }

  const periodEnd = calculateNextBillingDate(billingInterval);

  const row = await queryOne<SubscriptionRow>(
    `INSERT INTO subscriptions (
      user_id, subscription_id, plan_id, plan_name, tier, status, price,
      billing_interval, current_period_start, current_period_end,
      auto_renew, cancel_at_period_end, default_payment_method_id
    ) VALUES ($1, $2, $3, $4, $5, 'active', $6, $7, NOW(), $8, true, false, $9)
    RETURNING *`,
    [userId, subscriptionId, plan.id, plan.name, plan.tier, plan.price,
     billingInterval, periodEnd, paymentMethodId || null]
  );

  if (!row) throw new Error('Failed to create subscription record');

  initializeUsageLimits(row.id, userId, plan.limits, periodEnd).catch((err) =>
    logger.error('Failed to initialize usage limits:', err)
  );

  await sendEmail({
    to: userId,
    template: 'subscription-created',
    data: {
      planName: plan.name,
      amount: plan.price.toFixed(2),
      nextBillingDate: periodEnd.toISOString(),
    },
  });

  await cacheDelete(`subscription:user:${userId}`);
  return row;
}

export async function cancelSubscription(
  id: string,
  immediate: boolean,
  feedback?: string
): Promise<boolean> {
  const subscription = await getSubscriptionById(id);
  if (!subscription) throw new Error('Subscription not found');

  try {
    const txId = await contractCall('subscription-manager', 'cancel-subscription', [immediate]);
    await waitForTransaction(txId);
  } catch (err) {
    logger.warn('Blockchain cancellation failed, updating DB only', err);
  }

  if (immediate) {
    await query(
      `UPDATE subscriptions
       SET status = 'canceled', canceled_at = NOW(), cancellation_feedback = $2
       WHERE id = $1`,
      [id, feedback || null]
    );
  } else {
    await query(
      `UPDATE subscriptions
       SET cancel_at_period_end = true, canceled_at = NOW(), cancellation_feedback = $2
       WHERE id = $1`,
      [id, feedback || null]
    );
  }

  const effectiveDate = immediate
    ? new Date().toISOString()
    : subscription.current_period_end.toString();

  await sendEmail({
    to: subscription.user_id,
    template: immediate ? 'subscription-canceled' : 'subscription-cancel-scheduled',
    data: { effectiveDate },
  });

  await cacheDelete(`subscription:user:${subscription.user_id}`);
  return true;
}

export async function changePlan(
  id: string,
  newPlanId: number,
  immediate: boolean
): Promise<{ success: boolean; prorationAmount?: number }> {
  const subscription = await getSubscriptionById(id);
  if (!subscription) throw new Error('Subscription not found');

  const [oldPlan, newPlan] = await Promise.all([
    queryOne<PlanRow>('SELECT * FROM subscription_plans WHERE id = $1', [subscription.plan_id]),
    queryOne<PlanRow>('SELECT * FROM subscription_plans WHERE id = $1 AND is_active = true', [newPlanId]),
  ]);

  if (!newPlan) throw new Error('Invalid or inactive plan');

  let prorationAmount = 0;
  if (oldPlan && immediate) {
    const now = Date.now();
    const periodStart = new Date(subscription.current_period_start).getTime();
    const periodEnd = new Date(subscription.current_period_end).getTime();
    const totalPeriod = periodEnd - periodStart;
    const remaining = periodEnd - now;

    if (totalPeriod > 0 && remaining > 0) {
      const ratio = remaining / totalPeriod;
      const oldCredit = Number(oldPlan.price) * ratio;
      const newCharge = Number(newPlan.price) * ratio;
      prorationAmount = Math.max(0, newCharge - oldCredit);
      prorationAmount = Math.round(prorationAmount * 100) / 100;
    }
  }

  try {
    const txId = await contractCall('subscription-manager', 'change-plan', [newPlanId]);
    await waitForTransaction(txId);
  } catch (err) {
    logger.warn('Blockchain plan change failed, updating DB only', err);
  }

  await query(
    `UPDATE subscriptions SET plan_id = $2, plan_name = $3, tier = $4, price = $5 WHERE id = $1`,
    [id, newPlan.id, newPlan.name, newPlan.tier, newPlan.price]
  );

  if (prorationAmount > 0) {
    await query(
      `INSERT INTO proration_records (
        subscription_id, user_id, old_plan_id, new_plan_id,
        old_price, new_price, credit_amount, charge_amount, net_amount, effective_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
      [
        id, subscription.user_id, subscription.plan_id, newPlan.id,
        oldPlan!.price, newPlan.price,
        Math.round(Number(oldPlan!.price) * 100) / 100,
        Math.round(Number(newPlan.price) * 100) / 100,
        prorationAmount,
      ]
    );
  }

  await sendEmail({
    to: subscription.user_id,
    template: 'plan-changed',
    data: {
      oldPlanName: oldPlan?.name || 'Previous Plan',
      newPlanName: newPlan.name,
      prorationAmount: prorationAmount.toFixed(2),
      effectiveDate: immediate ? new Date().toISOString() : subscription.current_period_end.toString(),
    },
  });

  await cacheDelete(`subscription:user:${subscription.user_id}`);
  return { success: true, prorationAmount };
}

export async function getUsage(subscriptionId: string): Promise<any[]> {
  const rows = await queryMany(
    'SELECT * FROM usage WHERE subscription_id = $1',
    [subscriptionId]
  );
  return rows;
}

export async function trackUsage(
  subscriptionId: string,
  usageType: string,
  amount: number
): Promise<{ success: boolean; limitExceeded?: boolean; limit?: number; currentUsage?: number }> {
  const usage = await queryOne<{
    id: string;
    amount: number;
    limit_amount: number;
  }>(
    'SELECT id, amount, limit_amount FROM usage WHERE subscription_id = $1 AND usage_type = $2',
    [subscriptionId, usageType]
  );

  if (!usage) {
    return { success: false, limitExceeded: false };
  }

  const newAmount = Number(usage.amount) + amount;
  if (Number(usage.limit_amount) > 0 && newAmount > Number(usage.limit_amount)) {
    return {
      success: false,
      limitExceeded: true,
      limit: Number(usage.limit_amount),
      currentUsage: Number(usage.amount),
    };
  }

  await query('UPDATE usage SET amount = $2 WHERE id = $1', [usage.id, newAmount]);

  await query(
    `INSERT INTO usage_events (subscription_id, user_id, usage_type, amount)
     SELECT $1, user_id, $2, $3 FROM subscriptions WHERE id = $1`,
    [subscriptionId, usageType, amount]
  );

  return { success: true };
}

export async function getPlans(): Promise<PlanRow[]> {
  const cacheKey = 'subscription-plans';
  const cached = await cacheGet<PlanRow[]>(cacheKey);
  if (cached) return cached;

  const plans = await queryMany<PlanRow>(
    'SELECT * FROM subscription_plans WHERE is_active = true ORDER BY display_order ASC',
    []
  );

  await cacheSet(cacheKey, plans, 3600);
  return plans;
}

export async function getInvoices(
  subscriptionId: string,
  page: number,
  limit: number
): Promise<{ invoices: any[]; total: number; page: number; pages: number }> {
  const offset = (page - 1) * limit;

  const [invoices, countResult] = await Promise.all([
    queryMany(
      'SELECT * FROM invoices WHERE subscription_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [subscriptionId, limit, offset]
    ),
    queryOne<{ count: string }>('SELECT COUNT(*) as count FROM invoices WHERE subscription_id = $1', [subscriptionId]),
  ]);

  const total = parseInt(countResult?.count || '0', 10);

  return {
    invoices,
    total,
    page,
    pages: Math.ceil(total / limit),
  };
}

export async function addPaymentMethod(
  subscriptionId: string,
  paymentMethodId: string,
  setAsDefault: boolean
): Promise<boolean> {
  const subscription = await getSubscriptionById(subscriptionId);
  if (!subscription) throw new Error('Subscription not found');

  try {
    const txId = await contractCall('recurring-payment', 'add-payment-method', [
      paymentMethodId,
      setAsDefault,
    ]);
    await waitForTransaction(txId);
  } catch (err) {
    logger.warn('Blockchain payment method addition failed, updating DB only', err);
  }

  if (setAsDefault) {
    await query(
      'UPDATE subscriptions SET default_payment_method_id = $2 WHERE id = $1',
      [subscriptionId, paymentMethodId]
    );
    await cacheDelete(`subscription:user:${subscription.user_id}`);
  }

  return true;
}

function getStatusString(statusCode: number): string {
  const statuses: Record<number, string> = {
    1: 'active',
    2: 'past_due',
    3: 'canceled',
    4: 'expired',
    5: 'grace_period',
  };
  return statuses[statusCode] || 'unknown';
}

function calculateNextBillingDate(interval: 'monthly' | 'yearly'): Date {
  const date = new Date();
  if (interval === 'monthly') {
    date.setMonth(date.getMonth() + 1);
  } else {
    date.setFullYear(date.getFullYear() + 1);
  }
  return date;
}

async function processInitialPayment(
  userId: string,
  amount: number,
  paymentMethodId: string,
  planName: string
): Promise<void> {
  if (config.development.mockPaymentProcessor) {
    logger.info(`Mock payment processed: ${amount} for ${planName}`);
    return;
  }

  const Stripe = require('stripe');
  const stripe = new Stripe(config.payment.stripe.secretKey);

  await stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency: 'usd',
    payment_method: paymentMethodId,
    confirm: true,
    metadata: { userId, planName },
  });
}

async function initializeUsageLimits(
  subscriptionId: string,
  userId: string,
  limits: Record<string, number>,
  periodEnd: Date
): Promise<void> {
  const usageTypes = Object.entries(limits);
  for (const [usageType, limitAmount] of usageTypes) {
    await query(
      `INSERT INTO usage (subscription_id, user_id, usage_type, amount, limit_amount, period_start, period_end, last_reset)
       VALUES ($1, $2, $3, 0, $4, NOW(), $5, NOW())
       ON CONFLICT (subscription_id, usage_type) DO UPDATE SET limit_amount = $4, period_end = $5`,
      [subscriptionId, userId, usageType, limitAmount, periodEnd]
    );
  }
}

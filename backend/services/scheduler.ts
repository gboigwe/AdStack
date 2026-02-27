import * as cron from 'node-cron';
import { query, queryMany } from '../lib/database';
import { sendEmail } from '../lib/email';
import { config } from '../config/config';
import { logger } from '../lib/logger';
import { dispatchEvent } from './webhooks';

let scheduledJobs: cron.ScheduledTask[] = [];

export function startScheduler(): void {
  logger.info('Starting background job scheduler');

  scheduledJobs.push(
    cron.schedule('0 */6 * * *', () => {
      processSubscriptionRenewals().catch((err) =>
        logger.error('Subscription renewal job failed:', err)
      );
    })
  );

  scheduledJobs.push(
    cron.schedule('0 8 * * *', () => {
      sendRenewalReminders().catch((err) =>
        logger.error('Renewal reminder job failed:', err)
      );
    })
  );

  scheduledJobs.push(
    cron.schedule('0 */4 * * *', () => {
      retryFailedPayments().catch((err) =>
        logger.error('Payment retry job failed:', err)
      );
    })
  );

  scheduledJobs.push(
    cron.schedule('0 */1 * * *', () => {
      checkUsageLimits().catch((err) =>
        logger.error('Usage limit check job failed:', err)
      );
    })
  );

  scheduledJobs.push(
    cron.schedule('0 2 * * *', () => {
      cleanupExpiredCache().catch((err) =>
        logger.error('Cache cleanup job failed:', err)
      );
    })
  );

  scheduledJobs.push(
    cron.schedule('0 3 1 * *', () => {
      resetMonthlyUsage().catch((err) =>
        logger.error('Monthly usage reset job failed:', err)
      );
    })
  );

  logger.info(`Scheduled ${scheduledJobs.length} background jobs`);
}

export function stopScheduler(): void {
  for (const job of scheduledJobs) {
    job.stop();
  }
  scheduledJobs = [];
  logger.info('Background job scheduler stopped');
}

async function processSubscriptionRenewals(): Promise<void> {
  logger.info('Processing subscription renewals...');

  const expiring = await queryMany<{
    id: string;
    user_id: string;
    plan_id: number;
    plan_name: string;
    price: number;
    billing_interval: string;
    default_payment_method_id: string;
  }>(
    `SELECT * FROM subscriptions
     WHERE status = 'active'
       AND auto_renew = true
       AND current_period_end <= NOW()
       AND current_period_end > NOW() - INTERVAL '1 day'`,
    []
  );

  logger.info(`Found ${expiring.length} subscriptions to renew`);

  for (const sub of expiring) {
    try {
      let nextPeriodEnd: string;
      const now = new Date();

      switch (sub.billing_interval) {
        case 'yearly':
          nextPeriodEnd = new Date(now.setFullYear(now.getFullYear() + 1)).toISOString();
          break;
        case 'quarterly':
          nextPeriodEnd = new Date(now.setMonth(now.getMonth() + 3)).toISOString();
          break;
        default:
          nextPeriodEnd = new Date(now.setMonth(now.getMonth() + 1)).toISOString();
      }

      await query(
        `UPDATE subscriptions
         SET current_period_start = NOW(),
             current_period_end = $2,
             updated_at = NOW()
         WHERE id = $1`,
        [sub.id, nextPeriodEnd]
      );

      await dispatchEvent('subscription.renewed', {
        subscriptionId: sub.id,
        userId: sub.user_id,
        planName: sub.plan_name,
      }, sub.user_id);

      logger.info(`Renewed subscription ${sub.id} for user ${sub.user_id}`);
    } catch (error) {
      logger.error(`Failed to renew subscription ${sub.id}:`, error);
    }
  }
}

async function sendRenewalReminders(): Promise<void> {
  logger.info('Sending renewal reminders...');

  const upcoming = await queryMany<{
    id: string;
    user_id: string;
    plan_name: string;
    price: number;
    current_period_end: Date;
    billing_interval: string;
  }>(
    `SELECT s.* FROM subscriptions s
     WHERE s.status = 'active'
       AND s.auto_renew = true
       AND s.current_period_end BETWEEN NOW() + INTERVAL '3 days' AND NOW() + INTERVAL '4 days'
       AND NOT EXISTS (
         SELECT 1 FROM renewal_reminders r
         WHERE r.subscription_id = s.id
           AND r.reminder_days = 3
           AND r.sent_at > NOW() - INTERVAL '7 days'
       )`,
    []
  );

  for (const sub of upcoming) {
    try {
      const daysUntil = Math.ceil(
        (new Date(sub.current_period_end).getTime() - Date.now()) / 86400000
      );

      await sendEmail({
        to: sub.user_id,
        template: 'renewal-reminder',
        data: {
          planName: sub.plan_name,
          amount: sub.price.toFixed(2),
          renewalDate: sub.current_period_end.toString(),
          daysUntilRenewal: daysUntil.toString(),
          paymentMethod: 'Default payment method',
          manageUrl: `${config.app.frontendUrl}/settings/subscription`,
          upgradeUrl: `${config.app.frontendUrl}/pricing`,
          annualUrl: `${config.app.frontendUrl}/pricing?billing=yearly`,
          cancelUrl: `${config.app.frontendUrl}/settings/subscription/cancel`,
        },
      });

      await query(
        `INSERT INTO renewal_reminders (id, subscription_id, user_id, reminder_days, sent_at, created_at)
         VALUES (gen_random_uuid(), $1, $2, 3, NOW(), NOW())`,
        [sub.id, sub.user_id]
      );

      logger.info(`Sent renewal reminder for subscription ${sub.id}`);
    } catch (error) {
      logger.error(`Failed to send renewal reminder for ${sub.id}:`, error);
    }
  }
}

async function retryFailedPayments(): Promise<void> {
  logger.info('Retrying failed payments...');

  const failed = await queryMany<{
    id: string;
    user_id: string;
    amount: number;
    retry_count: number;
    max_retries: number;
    subscription_id: string;
    payment_method_id: string;
  }>(
    `SELECT * FROM payments
     WHERE status = 'failed'
       AND retry_count < max_retries
       AND (next_retry_at IS NULL OR next_retry_at <= NOW())`,
    []
  );

  logger.info(`Found ${failed.length} payments to retry`);

  for (const payment of failed) {
    try {
      await query(
        `UPDATE payments SET status = 'processing', retry_count = retry_count + 1, updated_at = NOW() WHERE id = $1`,
        [payment.id]
      );

      if (config.development.mockPaymentProcessor) {
        await query(
          `UPDATE payments SET status = 'success', executed_at = NOW(), updated_at = NOW() WHERE id = $1`,
          [payment.id]
        );
        logger.info(`Payment ${payment.id} retried successfully (mock)`);
      } else {
        const nextRetry = new Date(Date.now() + config.payment.retryDelay * (payment.retry_count + 1));
        await query(
          `UPDATE payments SET status = 'failed', next_retry_at = $2, updated_at = NOW() WHERE id = $1`,
          [payment.id, nextRetry]
        );
      }
    } catch (error) {
      logger.error(`Failed to retry payment ${payment.id}:`, error);
    }
  }
}

async function checkUsageLimits(): Promise<void> {
  const thresholds = config.usage.alertThresholds || [75, 90, 100];

  for (const threshold of thresholds) {
    const overLimit = await queryMany<{
      subscription_id: string;
      user_id: string;
      usage_type: string;
      amount: number;
      limit_amount: number;
    }>(
      `SELECT u.* FROM usage u
       WHERE u.limit_amount > 0
         AND (u.amount::float / u.limit_amount::float) * 100 >= $1
         AND NOT EXISTS (
           SELECT 1 FROM usage_alerts a
           WHERE a.subscription_id = u.subscription_id
             AND a.usage_type = u.usage_type
             AND a.threshold = $1
             AND a.triggered_at > NOW() - INTERVAL '24 hours'
         )`,
      [threshold]
    );

    for (const usage of overLimit) {
      try {
        await query(
          `INSERT INTO usage_alerts (id, subscription_id, user_id, usage_type, threshold, triggered_at, created_at)
           VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW())`,
          [usage.subscription_id, usage.user_id, usage.usage_type, threshold]
        );

        if (threshold >= 90) {
          await sendEmail({
            to: usage.user_id,
            template: 'usage-limit-warning',
            data: {
              warningLevel: threshold.toString(),
              usageType: usage.usage_type,
              usedAmount: usage.amount.toString(),
              limitAmount: usage.limit_amount.toString(),
              remaining: (usage.limit_amount - usage.amount).toString(),
              percentage: Math.round((usage.amount / usage.limit_amount) * 100).toString(),
              dashboardUrl: `${config.app.frontendUrl}/dashboard`,
              upgradeUrl: `${config.app.frontendUrl}/pricing`,
            },
          });
        }
      } catch (error) {
        logger.error(`Failed to create usage alert for ${usage.subscription_id}:`, error);
      }
    }
  }
}

async function cleanupExpiredCache(): Promise<void> {
  logger.info('Cleaning up expired cache entries...');

  const result = await query('DELETE FROM cache WHERE expires_at < NOW()', []);
  logger.info(`Cleaned up ${result.rowCount} expired cache entries`);
}

async function resetMonthlyUsage(): Promise<void> {
  logger.info('Resetting monthly usage counters...');

  const result = await query(
    `UPDATE usage
     SET amount = 0,
         overage_amount = 0,
         overage_fee = 0,
         period_start = NOW(),
         period_end = NOW() + INTERVAL '1 month',
         last_reset = NOW(),
         updated_at = NOW()
     WHERE period_end <= NOW()`,
    []
  );

  logger.info(`Reset ${result.rowCount} usage records`);
}

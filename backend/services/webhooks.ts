import { query, queryOne } from '../lib/database';
import { config } from '../config/config';
import { logger } from '../lib/logger';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';
import { WebhookEvent } from '../types';

interface WebhookTarget {
  id: string;
  userId: string;
  url: string;
  events: string[];
  secret: string;
  isActive: boolean;
}

export async function registerWebhook(
  userId: string,
  url: string,
  events: string[]
): Promise<WebhookTarget> {
  const id = uuidv4();
  const secret = crypto.randomBytes(32).toString('hex');

  const target = await queryOne<WebhookTarget>(
    `INSERT INTO webhook_targets (id, user_id, url, events, secret, is_active, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())
     RETURNING *`,
    [id, userId, url, JSON.stringify(events), secret]
  );

  if (!target) throw new Error('Failed to register webhook');

  return target;
}

export async function listWebhooks(userId: string): Promise<WebhookTarget[]> {
  const rows = await query<WebhookTarget>(
    'SELECT * FROM webhook_targets WHERE user_id = $1 AND is_active = true ORDER BY created_at DESC',
    [userId]
  );
  return rows.rows;
}

export async function deleteWebhook(userId: string, webhookId: string): Promise<boolean> {
  const result = await query(
    'UPDATE webhook_targets SET is_active = false, updated_at = NOW() WHERE id = $1 AND user_id = $2',
    [webhookId, userId]
  );
  return (result.rowCount ?? 0) > 0;
}

export async function dispatchEvent(
  eventType: string,
  payload: Record<string, unknown>,
  userId?: string
): Promise<void> {
  const eventId = uuidv4();

  await query(
    `INSERT INTO webhook_events (id, type, payload, status, attempts, created_at)
     VALUES ($1, $2, $3, 'pending', 0, NOW())`,
    [eventId, eventType, JSON.stringify(payload)]
  );

  const conditions = ['is_active = true'];
  const params: unknown[] = [];

  if (userId) {
    conditions.push('user_id = $1');
    params.push(userId);
  }

  const targets = await query<WebhookTarget>(
    `SELECT * FROM webhook_targets WHERE ${conditions.join(' AND ')}`,
    params
  );

  for (const target of targets.rows) {
    const events = typeof target.events === 'string' ? JSON.parse(target.events as string) : target.events;
    if (!events.includes(eventType) && !events.includes('*')) continue;

    deliverWebhook(target, eventId, eventType, payload).catch((error) => {
      logger.error(`Webhook delivery failed for target ${target.id}:`, error);
    });
  }
}

async function deliverWebhook(
  target: WebhookTarget,
  eventId: string,
  eventType: string,
  payload: Record<string, unknown>
): Promise<void> {
  const body = JSON.stringify({
    id: eventId,
    type: eventType,
    payload,
    timestamp: new Date().toISOString(),
  });

  const signature = crypto
    .createHmac('sha256', target.secret)
    .update(body)
    .digest('hex');

  const maxAttempts = config.webhooks.retryAttempts;
  const timeout = config.webhooks.timeout;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(target.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': eventType,
          'X-Webhook-ID': eventId,
        },
        body,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        await query(
          `UPDATE webhook_events SET status = 'delivered', attempts = $2, last_attempt_at = NOW() WHERE id = $1`,
          [eventId, attempt]
        );
        return;
      }

      logger.warn(`Webhook delivery attempt ${attempt}/${maxAttempts} failed: HTTP ${response.status}`);
    } catch (error) {
      logger.warn(`Webhook delivery attempt ${attempt}/${maxAttempts} error:`, error);
    }

    if (attempt < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
    }
  }

  await query(
    `UPDATE webhook_events SET status = 'failed', attempts = $2, last_attempt_at = NOW() WHERE id = $1`,
    [eventId, maxAttempts]
  );
}

export function verifyStripeSignature(payload: Buffer, signature: string): boolean {
  try {
    const secret = config.payment.stripe.webhookSecret;
    const elements = signature.split(',');
    const timestampPart = elements.find((e) => e.startsWith('t='));
    const signaturePart = elements.find((e) => e.startsWith('v1='));

    if (!timestampPart || !signaturePart) return false;

    const timestamp = timestampPart.split('=')[1];
    const sig = signaturePart.split('=')[1];

    const signedPayload = `${timestamp}.${payload.toString()}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(signedPayload)
      .digest('hex');

    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSignature));
  } catch {
    return false;
  }
}

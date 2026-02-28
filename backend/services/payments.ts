import Stripe from 'stripe';
import { query, queryOne, queryMany, transaction, TransactionClient } from '../lib/database';
import { sendEmail } from '../lib/email';
import { config } from '../config/config';
import { v4 as uuidv4 } from 'uuid';
import { Payment, PaymentMethod, Invoice, PaymentStatus } from '../types';

const stripe = new Stripe(config.payment.stripe.secretKey, {
  apiVersion: '2024-06-20' as Stripe.LatestApiVersion,
});

export async function processPayment(input: {
  userId: string;
  subscriptionId: string;
  amount: number;
  currency?: string;
  paymentMethodId: string;
  description: string;
}): Promise<Payment> {
  const { userId, subscriptionId, amount, currency, paymentMethodId, description } = input;

  return transaction(async (client: TransactionClient) => {
    const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const invoice = await client.queryOne<Invoice>(
      `INSERT INTO invoices (
        id, invoice_number, subscription_id, user_id, amount, tax, total,
        currency, status, due_date, line_items, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, 0, $5, $6, 'open', NOW(), $7, NOW(), NOW())
      RETURNING *`,
      [
        uuidv4(),
        invoiceNumber,
        subscriptionId,
        userId,
        amount,
        currency || 'USD',
        JSON.stringify([{ description, quantity: 1, unitPrice: amount, amount }]),
      ]
    );

    const paymentId = Math.floor(Math.random() * 1000000);

    const payment = await client.queryOne<Payment>(
      `INSERT INTO payments (
        id, payment_id, subscription_id, invoice_id, user_id, amount, currency,
        status, payment_method_id, payment_method_type, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8, 'stx', NOW(), NOW())
      RETURNING *`,
      [
        uuidv4(),
        paymentId,
        subscriptionId,
        invoice?.id,
        userId,
        amount,
        currency || 'USD',
        paymentMethodId,
      ]
    );

    if (!payment) throw new Error('Failed to create payment record');

    try {
      if (config.development.mockPaymentProcessor) {
        await client.query(
          `UPDATE payments SET status = 'success', executed_at = NOW(), updated_at = NOW() WHERE id = $1`,
          [payment.id]
        );
        await client.query(
          `UPDATE invoices SET status = 'paid', paid_at = NOW(), updated_at = NOW() WHERE id = $1`,
          [invoice?.id]
        );
      } else {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(amount * 100),
          currency: currency || 'usd',
          payment_method: paymentMethodId,
          confirm: true,
          metadata: {
            userId,
            subscriptionId,
            invoiceId: invoice?.id || '',
          },
          automatic_payment_methods: {
            enabled: true,
            allow_redirects: 'never',
          },
        });

        if (paymentIntent.status === 'succeeded') {
          await client.query(
            `UPDATE payments SET status = 'success', executed_at = NOW(), updated_at = NOW() WHERE id = $1`,
            [payment.id]
          );
          await client.query(
            `UPDATE invoices SET status = 'paid', paid_at = NOW(), updated_at = NOW() WHERE id = $1`,
            [invoice?.id]
          );
        } else {
          await client.query(
            `UPDATE payments SET status = 'failed', failure_reason = $2, updated_at = NOW() WHERE id = $1`,
            [payment.id, `Payment intent status: ${paymentIntent.status}`]
          );
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown payment error';
      await client.query(
        `UPDATE payments SET status = 'failed', failure_reason = $2, updated_at = NOW() WHERE id = $1`,
        [payment.id, message]
      );

      await sendEmail({
        to: userId,
        template: 'payment-failed',
        data: {
          amount: amount.toFixed(2),
          billingPeriod: description,
          paymentMethod: paymentMethodId,
          failureReason: message,
          updatePaymentUrl: `${config.app.frontendUrl}/settings/billing`,
        },
      });

      throw error;
    }

    return (await client.queryOne<Payment>('SELECT * FROM payments WHERE id = $1', [payment.id]))!;
  });
}

export async function getPaymentsBySubscription(
  subscriptionId: string,
  page: number = 1,
  limit: number = 20
): Promise<{ payments: Payment[]; total: number; page: number; pages: number }> {
  const offset = (page - 1) * limit;

  const [payments, countResult] = await Promise.all([
    queryMany<Payment>(
      `SELECT * FROM payments WHERE subscription_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [subscriptionId, limit, offset]
    ),
    queryOne<{ count: string }>(
      'SELECT COUNT(*) as count FROM payments WHERE subscription_id = $1',
      [subscriptionId]
    ),
  ]);

  const total = parseInt(countResult?.count || '0', 10);

  return {
    payments,
    total,
    page,
    pages: Math.ceil(total / limit),
  };
}

export async function getPaymentMethods(userId: string): Promise<PaymentMethod[]> {
  return queryMany<PaymentMethod>(
    'SELECT * FROM payment_methods WHERE user_id = $1 AND is_active = true ORDER BY is_default DESC, created_at DESC',
    [userId]
  );
}

export async function addPaymentMethod(
  userId: string,
  methodType: string,
  walletAddress?: string,
  setAsDefault: boolean = false
): Promise<PaymentMethod> {
  const methodId = `pm_${uuidv4().replace(/-/g, '').substring(0, 24)}`;

  if (setAsDefault) {
    await query(
      'UPDATE payment_methods SET is_default = false, updated_at = NOW() WHERE user_id = $1',
      [userId]
    );
  }

  const method = await queryOne<PaymentMethod>(
    `INSERT INTO payment_methods (
      id, user_id, method_id, method_type, is_default, wallet_address,
      is_active, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, true, NOW(), NOW())
    RETURNING *`,
    [uuidv4(), userId, methodId, methodType, setAsDefault, walletAddress || null]
  );

  if (!method) throw new Error('Failed to add payment method');

  return method;
}

export async function removePaymentMethod(userId: string, methodId: string): Promise<boolean> {
  const result = await query(
    'UPDATE payment_methods SET is_active = false, updated_at = NOW() WHERE user_id = $1 AND method_id = $2',
    [userId, methodId]
  );
  return (result.rowCount ?? 0) > 0;
}

export async function setDefaultPaymentMethod(userId: string, methodId: string): Promise<boolean> {
  await query(
    'UPDATE payment_methods SET is_default = false, updated_at = NOW() WHERE user_id = $1',
    [userId]
  );

  const result = await query(
    'UPDATE payment_methods SET is_default = true, updated_at = NOW() WHERE user_id = $1 AND method_id = $2 AND is_active = true',
    [userId, methodId]
  );

  return (result.rowCount ?? 0) > 0;
}

export async function retryFailedPayment(paymentId: string): Promise<Payment | null> {
  const payment = await queryOne<Payment>(
    'SELECT * FROM payments WHERE id = $1 AND status = $2',
    [paymentId, 'failed']
  );

  if (!payment) return null;

  if (payment.retryCount >= payment.maxRetries) {
    throw new Error('Maximum retry attempts reached');
  }

  await query(
    `UPDATE payments SET retry_count = retry_count + 1, status = 'processing', updated_at = NOW() WHERE id = $1`,
    [paymentId]
  );

  try {
    const result = await processPayment({
      userId: payment.userId,
      subscriptionId: payment.subscriptionId,
      amount: payment.amount,
      currency: payment.currency,
      paymentMethodId: payment.paymentMethodId || '',
      description: `Retry payment #${payment.paymentId}`,
    });

    return result;
  } catch (error) {
    const nextRetry = new Date(Date.now() + config.payment.retryDelay * (payment.retryCount + 1));

    await query(
      `UPDATE payments SET status = 'failed', next_retry_at = $2, updated_at = NOW() WHERE id = $1`,
      [paymentId, nextRetry]
    );

    return queryOne<Payment>('SELECT * FROM payments WHERE id = $1', [paymentId]);
  }
}

export async function getInvoices(
  userId: string,
  page: number = 1,
  limit: number = 20
): Promise<{ invoices: Invoice[]; total: number; page: number; pages: number }> {
  const offset = (page - 1) * limit;

  const [invoices, countResult] = await Promise.all([
    queryMany<Invoice>(
      'SELECT * FROM invoices WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [userId, limit, offset]
    ),
    queryOne<{ count: string }>(
      'SELECT COUNT(*) as count FROM invoices WHERE user_id = $1',
      [userId]
    ),
  ]);

  const total = parseInt(countResult?.count || '0', 10);

  return {
    invoices,
    total,
    page,
    pages: Math.ceil(total / limit),
  };
}

export async function getInvoiceById(invoiceId: string): Promise<Invoice | null> {
  return queryOne<Invoice>('SELECT * FROM invoices WHERE id = $1', [invoiceId]);
}

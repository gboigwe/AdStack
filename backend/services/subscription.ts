/**
 * Subscription Service
 *
 * Business logic for subscription management
 */

import { db } from '../lib/database';
import { contractCall, contractRead } from '../lib/stacks';
import { sendEmail } from '../lib/email';
import { calculateProration } from '../../frontend/src/lib/subscription';

interface CreateSubscriptionInput {
  userId: string;
  planId: number;
  paymentMethodId?: string;
  billingInterval: 'monthly' | 'yearly';
}

interface Subscription {
  id: string;
  userId: string;
  subscriptionId: number;
  planId: number;
  status: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  autoRenew: boolean;
  cancelAtPeriodEnd: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Get user's subscription
 */
export async function getSubscription(userId: string): Promise<Subscription | null> {
  try {
    // First check database
    const dbSubscription = await db.subscriptions.findOne({
      userId,
      status: { $in: ['active', 'past_due', 'grace_period'] }
    });

    if (!dbSubscription) {
      return null;
    }

    // Sync with blockchain
    const onChainData = await contractRead('subscription-manager', 'get-user-subscription', [
      userId
    ]);

    if (!onChainData) {
      return dbSubscription;
    }

    // Update database with on-chain data
    await db.subscriptions.updateOne(
      { id: dbSubscription.id },
      {
        $set: {
          status: getStatusString(onChainData.status),
          currentPeriodEnd: new Date(onChainData.currentPeriodEnd * 1000),
          autoRenew: onChainData.autoRenew,
          updatedAt: new Date()
        }
      }
    );

    return { ...dbSubscription, ...onChainData };
  } catch (error) {
    console.error('Error getting subscription:', error);
    throw error;
  }
}

/**
 * Get subscription by ID
 */
export async function getSubscriptionById(id: string): Promise<Subscription | null> {
  try {
    return await db.subscriptions.findOne({ id });
  } catch (error) {
    console.error('Error getting subscription by ID:', error);
    throw error;
  }
}

/**
 * Create new subscription
 */
export async function createSubscription(
  input: CreateSubscriptionInput
): Promise<Subscription> {
  try {
    const { userId, planId, paymentMethodId, billingInterval } = input;

    // Get plan details
    const plan = await contractRead('subscription-manager', 'get-plan', [planId]);

    if (!plan || !plan.isActive) {
      throw new Error('Invalid or inactive plan');
    }

    // Process initial payment
    if (paymentMethodId) {
      await processPayment({
        userId,
        amount: plan.price,
        paymentMethodId,
        description: `Initial payment for ${plan.name} subscription`
      });
    }

    // Create subscription on blockchain
    const txId = await contractCall('subscription-manager', 'subscribe', [planId]);

    // Wait for transaction confirmation
    await waitForTransaction(txId);

    // Get subscription ID from transaction result
    const subscriptionId = await getSubscriptionIdFromTx(txId);

    // Create in database
    const subscription = await db.subscriptions.create({
      userId,
      subscriptionId,
      planId,
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: calculateNextBillingDate(billingInterval),
      autoRenew: true,
      cancelAtPeriodEnd: false,
      billingInterval
    });

    // Send confirmation email
    await sendEmail({
      to: userId,
      template: 'subscription-created',
      data: {
        planName: plan.name,
        amount: plan.price,
        nextBillingDate: subscription.currentPeriodEnd
      }
    });

    return subscription;
  } catch (error) {
    console.error('Error creating subscription:', error);
    throw error;
  }
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(
  id: string,
  immediate: boolean,
  feedback?: string
): Promise<boolean> {
  try {
    const subscription = await getSubscriptionById(id);

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    // Cancel on blockchain
    const txId = await contractCall('subscription-manager', 'cancel-subscription', [
      immediate
    ]);

    await waitForTransaction(txId);

    // Update database
    await db.subscriptions.updateOne(
      { id },
      {
        $set: {
          status: immediate ? 'canceled' : subscription.status,
          cancelAtPeriodEnd: !immediate,
          canceledAt: new Date(),
          cancellationFeedback: feedback,
          updatedAt: new Date()
        }
      }
    );

    // Send cancellation email
    await sendEmail({
      to: subscription.userId,
      template: immediate ? 'subscription-canceled' : 'subscription-cancel-scheduled',
      data: {
        effectiveDate: immediate ? new Date() : subscription.currentPeriodEnd
      }
    });

    return true;
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw error;
  }
}

/**
 * Change subscription plan
 */
export async function changePlan(
  id: string,
  newPlanId: number,
  immediate: boolean
): Promise<{ success: boolean; prorationAmount?: number }> {
  try {
    const subscription = await getSubscriptionById(id);

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    // Get both plans
    const oldPlan = await contractRead('subscription-manager', 'get-plan', [
      subscription.planId
    ]);
    const newPlan = await contractRead('subscription-manager', 'get-plan', [newPlanId]);

    if (!newPlan || !newPlan.isActive) {
      throw new Error('Invalid or inactive plan');
    }

    // Calculate proration
    const proration = calculateProration(
      oldPlan.price,
      newPlan.price,
      subscription.currentPeriodStart,
      subscription.currentPeriodEnd
    );

    // Process proration charge/credit if needed
    if (proration.amountDue > 0) {
      await processPayment({
        userId: subscription.userId,
        amount: proration.amountDue,
        paymentMethodId: subscription.defaultPaymentMethodId,
        description: `Proration for plan change from ${oldPlan.name} to ${newPlan.name}`
      });
    }

    // Change plan on blockchain
    const txId = await contractCall('subscription-manager', 'change-plan', [newPlanId]);

    await waitForTransaction(txId);

    // Update database
    await db.subscriptions.updateOne(
      { id },
      {
        $set: {
          planId: newPlanId,
          updatedAt: new Date()
        }
      }
    );

    // Send confirmation email
    await sendEmail({
      to: subscription.userId,
      template: 'plan-changed',
      data: {
        oldPlanName: oldPlan.name,
        newPlanName: newPlan.name,
        prorationAmount: proration.amountDue,
        effectiveDate: immediate ? new Date() : subscription.currentPeriodEnd
      }
    });

    return {
      success: true,
      prorationAmount: proration.amountDue
    };
  } catch (error) {
    console.error('Error changing plan:', error);
    throw error;
  }
}

/**
 * Get subscription usage
 */
export async function getUsage(subscriptionId: string): Promise<any> {
  try {
    // Get from blockchain
    const onChainUsage = await contractRead('subscription-benefits', 'get-user-usage', [
      subscriptionId
    ]);

    // Get from database for caching
    const dbUsage = await db.usage.findOne({ subscriptionId });

    return {
      ...dbUsage,
      ...onChainUsage
    };
  } catch (error) {
    console.error('Error getting usage:', error);
    throw error;
  }
}

/**
 * Track usage event
 */
export async function trackUsage(
  subscriptionId: string,
  usageType: number,
  amount: number
): Promise<{ success: boolean; limitExceeded?: boolean; limit?: number; currentUsage?: number }> {
  try {
    // Check limit on blockchain
    const canUse = await contractRead('subscription-benefits', 'check-usage-limit', [
      subscriptionId,
      usageType,
      amount
    ]);

    if (!canUse) {
      const usage = await getUsage(subscriptionId);
      return {
        success: false,
        limitExceeded: true,
        limit: usage[usageType]?.limit,
        currentUsage: usage[usageType]?.used
      };
    }

    // Track on blockchain
    const txId = await contractCall('subscription-benefits', 'track-usage', [
      subscriptionId,
      usageType,
      amount
    ]);

    await waitForTransaction(txId);

    // Update database cache
    await db.usage.updateOne(
      { subscriptionId },
      {
        $inc: { [`${usageType}.used`]: amount },
        $set: { updatedAt: new Date() }
      },
      { upsert: true }
    );

    return { success: true };
  } catch (error) {
    console.error('Error tracking usage:', error);
    throw error;
  }
}

/**
 * Get all subscription plans
 */
export async function getPlans(): Promise<any[]> {
  try {
    // Get from cache
    const cached = await db.cache.findOne({ key: 'subscription-plans' });

    if (cached && cached.expiresAt > new Date()) {
      return cached.value;
    }

    // Fetch from blockchain
    const plans = [];
    for (let i = 1; i <= 10; i++) {
      const plan = await contractRead('subscription-manager', 'get-plan', [i]);
      if (plan && plan.isActive) {
        plans.push(plan);
      }
    }

    // Cache for 1 hour
    await db.cache.updateOne(
      { key: 'subscription-plans' },
      {
        $set: {
          value: plans,
          expiresAt: new Date(Date.now() + 3600000)
        }
      },
      { upsert: true }
    );

    return plans;
  } catch (error) {
    console.error('Error getting plans:', error);
    throw error;
  }
}

/**
 * Get subscription invoices
 */
export async function getInvoices(
  subscriptionId: string,
  page: number,
  limit: number
): Promise<{ invoices: any[]; total: number; page: number; pages: number }> {
  try {
    const skip = (page - 1) * limit;

    const [invoices, total] = await Promise.all([
      db.invoices.find({ subscriptionId }).skip(skip).limit(limit).sort({ createdAt: -1 }),
      db.invoices.countDocuments({ subscriptionId })
    ]);

    return {
      invoices,
      total,
      page,
      pages: Math.ceil(total / limit)
    };
  } catch (error) {
    console.error('Error getting invoices:', error);
    throw error;
  }
}

/**
 * Add payment method
 */
export async function addPaymentMethod(
  subscriptionId: string,
  paymentMethodId: string,
  setAsDefault: boolean
): Promise<boolean> {
  try {
    const subscription = await getSubscriptionById(subscriptionId);

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    // Add to blockchain
    const txId = await contractCall('recurring-payment', 'add-payment-method', [
      paymentMethodId,
      setAsDefault
    ]);

    await waitForTransaction(txId);

    // Update database
    if (setAsDefault) {
      await db.subscriptions.updateOne(
        { id: subscriptionId },
        {
          $set: {
            defaultPaymentMethodId: paymentMethodId,
            updatedAt: new Date()
          }
        }
      );
    }

    return true;
  } catch (error) {
    console.error('Error adding payment method:', error);
    throw error;
  }
}

// Helper functions

function getStatusString(statusCode: number): string {
  const statuses = {
    1: 'active',
    2: 'past_due',
    3: 'canceled',
    4: 'expired',
    5: 'grace_period'
  };
  return statuses[statusCode] || 'unknown';
}

function calculateNextBillingDate(interval: 'monthly' | 'yearly'): Date {
  const now = new Date();
  if (interval === 'monthly') {
    return new Date(now.setMonth(now.getMonth() + 1));
  } else {
    return new Date(now.setFullYear(now.getFullYear() + 1));
  }
}

async function processPayment(input: {
  userId: string;
  amount: number;
  paymentMethodId: string;
  description: string;
}): Promise<void> {
  // Implementation would integrate with payment processor (Stripe, etc.)
  console.log('Processing payment:', input);
}

async function waitForTransaction(txId: string): Promise<void> {
  // Implementation would wait for transaction confirmation
  console.log('Waiting for transaction:', txId);
}

async function getSubscriptionIdFromTx(txId: string): Promise<number> {
  // Implementation would extract subscription ID from transaction result
  return 1;
}

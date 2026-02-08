/**
 * Subscription API Routes
 *
 * RESTful API endpoints for subscription management
 */

import { Request, Response, NextFunction } from 'express';
import { validateRequest } from '../middleware/validation';
import { auth } from '../middleware/auth';
import * as subscriptionService from '../services/subscription';

/**
 * GET /api/subscription/:userId
 * Get user's active subscription
 */
export async function getSubscription(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { userId } = req.params;

    // Verify user authorization
    if (req.user?.id !== userId && !req.user?.isAdmin) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only access your own subscription'
      });
    }

    const subscription = await subscriptionService.getSubscription(userId);

    if (!subscription) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'No active subscription found'
      });
    }

    return res.json({ subscription });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/subscription
 * Create new subscription
 */
export async function createSubscription(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { planId, paymentMethodId, billingInterval } = req.body;
    const userId = req.user!.id;

    // Validate input
    if (!planId || !billingInterval) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'planId and billingInterval are required'
      });
    }

    // Check if user already has active subscription
    const existingSubscription = await subscriptionService.getSubscription(userId);
    if (existingSubscription && existingSubscription.status === 'active') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'You already have an active subscription'
      });
    }

    const subscription = await subscriptionService.createSubscription({
      userId,
      planId,
      paymentMethodId,
      billingInterval
    });

    return res.status(201).json({ subscription });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/subscription/:id/cancel
 * Cancel subscription
 */
export async function cancelSubscription(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;
    const { immediate, feedback } = req.body;
    const userId = req.user!.id;

    // Get subscription
    const subscription = await subscriptionService.getSubscriptionById(id);

    if (!subscription) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Subscription not found'
      });
    }

    // Verify ownership
    if (subscription.userId !== userId && !req.user?.isAdmin) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only cancel your own subscription'
      });
    }

    const result = await subscriptionService.cancelSubscription(
      id,
      immediate || false,
      feedback
    );

    return res.json({ result });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/subscription/:id/change-plan
 * Change subscription plan
 */
export async function changePlan(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;
    const { newPlanId, immediate } = req.body;
    const userId = req.user!.id;

    if (!newPlanId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'newPlanId is required'
      });
    }

    // Get subscription
    const subscription = await subscriptionService.getSubscriptionById(id);

    if (!subscription) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Subscription not found'
      });
    }

    // Verify ownership
    if (subscription.userId !== userId && !req.user?.isAdmin) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only modify your own subscription'
      });
    }

    const result = await subscriptionService.changePlan(
      id,
      newPlanId,
      immediate || true
    );

    return res.json({ result });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/subscription/:id/usage
 * Get subscription usage metrics
 */
export async function getUsage(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Get subscription
    const subscription = await subscriptionService.getSubscriptionById(id);

    if (!subscription) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Subscription not found'
      });
    }

    // Verify ownership
    if (subscription.userId !== userId && !req.user?.isAdmin) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only view your own usage'
      });
    }

    const usage = await subscriptionService.getUsage(id);

    return res.json({ usage });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/subscription/:id/usage
 * Track usage event
 */
export async function trackUsage(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;
    const { usageType, amount } = req.body;
    const userId = req.user!.id;

    if (!usageType || amount === undefined) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'usageType and amount are required'
      });
    }

    // Get subscription
    const subscription = await subscriptionService.getSubscriptionById(id);

    if (!subscription) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Subscription not found'
      });
    }

    // Verify ownership
    if (subscription.userId !== userId && !req.user?.isAdmin) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only track your own usage'
      });
    }

    const result = await subscriptionService.trackUsage(id, usageType, amount);

    if (!result.success && result.limitExceeded) {
      return res.status(429).json({
        error: 'Usage Limit Exceeded',
        message: `You have reached your ${usageType} limit`,
        limit: result.limit,
        currentUsage: result.currentUsage
      });
    }

    return res.json({ result });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/subscription/plans
 * Get all available subscription plans
 */
export async function getPlans(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const plans = await subscriptionService.getPlans();
    return res.json({ plans });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/subscription/:id/invoices
 * Get subscription invoices
 */
export async function getInvoices(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const userId = req.user!.id;

    // Get subscription
    const subscription = await subscriptionService.getSubscriptionById(id);

    if (!subscription) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Subscription not found'
      });
    }

    // Verify ownership
    if (subscription.userId !== userId && !req.user?.isAdmin) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only view your own invoices'
      });
    }

    const result = await subscriptionService.getInvoices(
      id,
      parseInt(page as string),
      parseInt(limit as string)
    );

    return res.json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/subscription/:id/payment-method
 * Add payment method to subscription
 */
export async function addPaymentMethod(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;
    const { paymentMethodId, setAsDefault } = req.body;
    const userId = req.user!.id;

    if (!paymentMethodId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'paymentMethodId is required'
      });
    }

    // Get subscription
    const subscription = await subscriptionService.getSubscriptionById(id);

    if (!subscription) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Subscription not found'
      });
    }

    // Verify ownership
    if (subscription.userId !== userId && !req.user?.isAdmin) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only modify your own payment methods'
      });
    }

    const result = await subscriptionService.addPaymentMethod(
      id,
      paymentMethodId,
      setAsDefault || false
    );

    return res.json({ result });
  } catch (error) {
    next(error);
  }
}

/**
 * Error handler middleware
 */
export function handleSubscriptionError(
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('Subscription API Error:', error);

  if (error.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      message: error.message,
      details: error.details
    });
  }

  if (error.name === 'ContractError') {
    return res.status(422).json({
      error: 'Contract Error',
      message: 'Smart contract operation failed',
      details: error.message
    });
  }

  return res.status(500).json({
    error: 'Internal Server Error',
    message: 'An unexpected error occurred'
  });
}

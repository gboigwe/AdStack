/**
 * Rate Limiting Middleware
 *
 * Implements rate limiting based on subscription tier
 */

import { Request, Response, NextFunction } from 'express';
import { RateLimiterMemory, RateLimiterRes } from 'rate-limiter-flexible';
import * as subscriptionService from '../services/subscription';

// Rate limiter configurations by tier
const rateLimiters = {
  free: new RateLimiterMemory({
    points: 100, // Number of requests
    duration: 3600, // Per hour
  }),
  basic: new RateLimiterMemory({
    points: 1000,
    duration: 3600,
  }),
  pro: new RateLimiterMemory({
    points: 10000,
    duration: 3600,
  }),
  enterprise: new RateLimiterMemory({
    points: 100000,
    duration: 3600,
  }),
};

// Default rate limiter for unauthenticated requests
const defaultLimiter = new RateLimiterMemory({
  points: 50,
  duration: 3600,
});

interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: Date;
}

/**
 * Rate limiting middleware based on subscription tier
 */
export async function rateLimitByTier(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    const ip = req.ip || req.socket.remoteAddress || 'unknown';

    let limiter = defaultLimiter;
    let tier = 'anonymous';

    // If user is authenticated, get their subscription tier
    if (userId) {
      const subscription = await subscriptionService.getSubscription(userId);

      if (subscription && subscription.status === 'active') {
        tier = subscription.tier;
        limiter = rateLimiters[tier] || defaultLimiter;
      }
    }

    // Use userId if available, otherwise use IP
    const key = userId || ip;

    try {
      const rateLimiterRes = await limiter.consume(key);

      // Add rate limit headers
      res.setHeader('X-RateLimit-Limit', limiter.points);
      res.setHeader('X-RateLimit-Remaining', rateLimiterRes.remainingPoints);
      res.setHeader(
        'X-RateLimit-Reset',
        new Date(Date.now() + rateLimiterRes.msBeforeNext).toISOString()
      );
      res.setHeader('X-RateLimit-Tier', tier);

      next();
    } catch (rateLimiterRes) {
      // Rate limit exceeded
      const resetDate = new Date(Date.now() + (rateLimiterRes as RateLimiterRes).msBeforeNext);

      res.setHeader('X-RateLimit-Limit', limiter.points);
      res.setHeader('X-RateLimit-Remaining', 0);
      res.setHeader('X-RateLimit-Reset', resetDate.toISOString());
      res.setHeader('Retry-After', Math.ceil((rateLimiterRes as RateLimiterRes).msBeforeNext / 1000));

      return res.status(429).json({
        error: 'Too Many Requests',
        message: `Rate limit exceeded for ${tier} tier. Please upgrade your plan or try again later.`,
        retryAfter: resetDate,
        upgradeUrl: tier === 'free' || tier === 'anonymous' ? '/plans' : undefined,
      }) as any;
    }
  } catch (error) {
    console.error('Rate limiter error:', error);
    // In case of error, allow the request to proceed
    next();
  }
}

/**
 * Strict rate limiter for sensitive endpoints (e.g., authentication)
 */
export const strictRateLimiter = new RateLimiterMemory({
  points: 5, // 5 requests
  duration: 900, // Per 15 minutes
});

export async function strictRateLimit(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';

  try {
    await strictRateLimiter.consume(ip);
    next();
  } catch (rateLimiterRes) {
    const resetDate = new Date(Date.now() + (rateLimiterRes as RateLimiterRes).msBeforeNext);

    res.setHeader('Retry-After', Math.ceil((rateLimiterRes as RateLimiterRes).msBeforeNext / 1000));

    return res.status(429).json({
      error: 'Too Many Requests',
      message: 'Too many attempts. Please try again later.',
      retryAfter: resetDate,
    }) as any;
  }
}

/**
 * Custom rate limiter factory
 */
export function createRateLimiter(
  points: number,
  duration: number
): RateLimiterMemory {
  return new RateLimiterMemory({ points, duration });
}

/**
 * Get rate limit info for a user
 */
export async function getRateLimitInfo(
  userId: string
): Promise<RateLimitInfo | null> {
  try {
    const subscription = await subscriptionService.getSubscription(userId);

    if (!subscription || subscription.status !== 'active') {
      return {
        limit: defaultLimiter.points,
        remaining: defaultLimiter.points,
        reset: new Date(Date.now() + 3600000),
      };
    }

    const limiter = rateLimiters[subscription.tier];
    const res = await limiter.get(userId);

    return {
      limit: limiter.points,
      remaining: res ? res.remainingPoints : limiter.points,
      reset: new Date(Date.now() + (res?.msBeforeNext || 3600000)),
    };
  } catch (error) {
    console.error('Error getting rate limit info:', error);
    return null;
  }
}

/**
 * Reset rate limit for a user (admin function)
 */
export async function resetRateLimit(userId: string): Promise<boolean> {
  try {
    const subscription = await subscriptionService.getSubscription(userId);

    if (subscription && subscription.status === 'active') {
      const limiter = rateLimiters[subscription.tier];
      await limiter.delete(userId);
    } else {
      await defaultLimiter.delete(userId);
    }

    return true;
  } catch (error) {
    console.error('Error resetting rate limit:', error);
    return false;
  }
}

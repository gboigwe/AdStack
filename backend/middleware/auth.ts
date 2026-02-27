import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/config';
import * as subscriptionService from '../services/subscription';

export interface User {
  id: string;
  walletAddress: string;
  email?: string;
  isAdmin: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export async function auth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No authorization token provided',
      }) as any;
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, config.auth.jwtSecret) as User;
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired token',
      }) as any;
    }
  } catch (error) {
    next(error);
  }
}

export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      try {
        const decoded = jwt.verify(token, config.auth.jwtSecret) as User;
        req.user = decoded;
      } catch (error) {
        // Invalid token, but continue without user
      }
    }

    next();
  } catch (error) {
    next(error);
  }
}

export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Admin access required',
    }) as any;
  }

  next();
}

export async function requireActiveSubscription(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      }) as any;
    }

    const subscription = await subscriptionService.getSubscription(req.user.id);

    if (!subscription || subscription.status !== 'active') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Active subscription required',
        upgradeUrl: '/plans',
      }) as any;
    }

    next();
  } catch (error) {
    next(error);
  }
}

export function requireTier(minimumTier: 'basic' | 'pro' | 'enterprise') {
  const tierHierarchy = {
    free: 0,
    basic: 1,
    pro: 2,
    enterprise: 3,
  };

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required',
        }) as any;
      }

      const subscription = await subscriptionService.getSubscription(req.user.id);

      if (!subscription || subscription.status !== 'active') {
        return res.status(403).json({
          error: 'Forbidden',
          message: `${minimumTier} subscription required`,
          currentTier: subscription?.tier || 'none',
          requiredTier: minimumTier,
          upgradeUrl: '/plans',
        }) as any;
      }

      const userTierLevel = tierHierarchy[subscription.tier];
      const requiredTierLevel = tierHierarchy[minimumTier];

      if (userTierLevel < requiredTierLevel) {
        return res.status(403).json({
          error: 'Forbidden',
          message: `${minimumTier} subscription or higher required`,
          currentTier: subscription.tier,
          requiredTier: minimumTier,
          upgradeUrl: '/plans',
        }) as any;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

export function requireFeature(featureName: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required',
        }) as any;
      }

      const subscription = await subscriptionService.getSubscription(req.user.id);

      if (!subscription || subscription.status !== 'active') {
        return res.status(403).json({
          error: 'Forbidden',
          message: `Feature '${featureName}' requires an active subscription`,
          upgradeUrl: '/plans',
        }) as any;
      }

      // Check if user has access to the feature
      // This would integrate with the subscription-benefits contract
      const hasAccess = await checkFeatureAccess(req.user.id, featureName);

      if (!hasAccess) {
        return res.status(403).json({
          error: 'Forbidden',
          message: `Feature '${featureName}' not available in your plan`,
          currentTier: subscription.tier,
          upgradeUrl: '/plans',
        }) as any;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

async function checkFeatureAccess(
  userId: string,
  featureName: string
): Promise<boolean> {
  // This would call the subscription-benefits smart contract
  // For now, return true as a placeholder
  return true;
}

export function generateToken(user: User): string {
  return jwt.sign(user, config.auth.jwtSecret, {
    expiresIn: config.auth.jwtExpiration,
  });
}

export function verifyToken(token: string): User | null {
  try {
    return jwt.verify(token, config.auth.jwtSecret) as User;
  } catch (error) {
    return null;
  }
}

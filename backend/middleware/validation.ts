import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

export function validateRequest(schema: {
  body?: Joi.ObjectSchema;
  query?: Joi.ObjectSchema;
  params?: Joi.ObjectSchema;
}) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: { [key: string]: string } = {};

    // Validate body
    if (schema.body) {
      const { error } = schema.body.validate(req.body, { abortEarly: false });
      if (error) {
        errors.body = error.details.map((d) => d.message).join(', ');
      }
    }

    // Validate query
    if (schema.query) {
      const { error } = schema.query.validate(req.query, { abortEarly: false });
      if (error) {
        errors.query = error.details.map((d) => d.message).join(', ');
      }
    }

    // Validate params
    if (schema.params) {
      const { error } = schema.params.validate(req.params, { abortEarly: false });
      if (error) {
        errors.params = error.details.map((d) => d.message).join(', ');
      }
    }

    // If validation errors, return 400
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Request validation failed',
        details: errors,
      }) as any;
    }

    next();
  };
}

// Common validation schemas

export const subscriptionSchemas = {
  createSubscription: Joi.object({
    planId: Joi.number().integer().positive().required(),
    paymentMethodId: Joi.string().optional(),
    billingInterval: Joi.string().valid('monthly', 'quarterly', 'yearly').required(),
  }),

  cancelSubscription: Joi.object({
    immediate: Joi.boolean().optional(),
    feedback: Joi.string().max(500).optional(),
  }),

  changePlan: Joi.object({
    newPlanId: Joi.number().integer().positive().required(),
    immediate: Joi.boolean().optional(),
  }),

  trackUsage: Joi.object({
    usageType: Joi.string()
      .valid('campaigns', 'impressions', 'clicks', 'conversions', 'api_calls', 'team_members', 'storage', 'reports')
      .required(),
    amount: Joi.number().integer().positive().required(),
  }),

  addPaymentMethod: Joi.object({
    paymentMethodId: Joi.string().required(),
    setAsDefault: Joi.boolean().optional(),
  }),
};

export const authSchemas = {
  walletAuth: Joi.object({
    walletAddress: Joi.string().required(),
    signature: Joi.string().optional(),
    message: Joi.string().optional(),
  }),

  updateProfile: Joi.object({
    displayName: Joi.string().max(100).optional(),
    email: Joi.string().email().optional(),
    avatarUrl: Joi.string().uri().optional(),
  }),
};

export const campaignSchemas = {
  createCampaign: Joi.object({
    name: Joi.string().min(1).max(255).required(),
    description: Joi.string().max(2000).optional(),
    budget: Joi.number().positive().required(),
    dailyBudget: Joi.number().positive().optional(),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional(),
    targetingRules: Joi.object().optional(),
    adContent: Joi.object().optional(),
  }),

  updateCampaign: Joi.object({
    name: Joi.string().min(1).max(255).optional(),
    description: Joi.string().max(2000).optional(),
    budget: Joi.number().positive().optional(),
    dailyBudget: Joi.number().positive().optional(),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional(),
    targetingRules: Joi.object().optional(),
    adContent: Joi.object().optional(),
  }),

  updateStatus: Joi.object({
    status: Joi.string().valid('active', 'paused', 'completed', 'cancelled').required(),
  }),
};

export const webhookSchemas = {
  registerWebhook: Joi.object({
    url: Joi.string().uri().required(),
    events: Joi.array().items(Joi.string()).min(1).required(),
  }),
};

export const paginationSchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
  }),
};

export const idSchema = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
};

export function sanitizeInput(req: Request, res: Response, next: NextFunction): void {
  // Remove any potentially dangerous characters from string inputs
  const sanitize = (obj: any): any => {
    if (typeof obj === 'string') {
      return obj.trim().replace(/[<>]/g, '');
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    if (typeof obj === 'object' && obj !== null) {
      const sanitized: any = {};
      for (const key in obj) {
        sanitized[key] = sanitize(obj[key]);
      }
      return sanitized;
    }
    return obj;
  };

  req.body = sanitize(req.body);
  req.query = sanitize(req.query);
  req.params = sanitize(req.params);

  next();
}

export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

export function isValidStacksAddress(address: string): boolean {
  // Stacks addresses start with SP or SM for mainnet, ST for testnet
  const stacksRegex = /^(SP|SM|ST)[0-9A-Z]{38,41}$/;
  return stacksRegex.test(address);
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidAmount(amount: number): boolean {
  return amount > 0 && Number.isFinite(amount) && /^\d+(\.\d{1,2})?$/.test(amount.toString());
}

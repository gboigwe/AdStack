/**
 * Application Configuration
 *
 * Centralized configuration management
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

interface Config {
  app: {
    env: string;
    port: number;
    apiUrl: string;
    frontendUrl: string;
  };
  database: {
    url: string;
    poolMin: number;
    poolMax: number;
    ssl: boolean;
  };
  stacks: {
    network: 'mainnet' | 'testnet' | 'devnet';
    apiUrl: string;
    contracts: {
      subscriptionManager: string;
      recurringPayment: string;
      subscriptionBenefits: string;
    };
    deployer: {
      mnemonic: string;
      walletIndex: number;
    };
  };
  auth: {
    jwtSecret: string;
    jwtExpiration: string;
  };
  rateLimit: {
    free: number;
    basic: number;
    pro: number;
    enterprise: number;
    window: number;
  };
  email: {
    provider: string;
    apiKey: string;
    from: string;
    fromName: string;
    smtp?: {
      host: string;
      port: number;
      user: string;
      password: string;
      secure: boolean;
    };
  };
  payment: {
    stripe: {
      secretKey: string;
      publishableKey: string;
      webhookSecret: string;
    };
    maxRetries: number;
    retryDelay: number;
    gracePeriodDays: number;
  };
  subscription: {
    defaultTier: 'free' | 'basic' | 'pro' | 'enterprise';
    enableProration: boolean;
    prorationBehavior: string;
    cancelAtPeriodEndDefault: boolean;
    requireCancellationReason: boolean;
  };
  usage: {
    syncInterval: number;
    alertThresholds: number[];
  };
  cache: {
    redisUrl?: string;
    ttl: number;
    maxItems: number;
  };
  logging: {
    level: string;
    format: string;
  };
  monitoring: {
    sentryDsn?: string;
    sentryEnvironment: string;
  };
  analytics: {
    enabled: boolean;
    provider: string;
    token?: string;
  };
  webhooks: {
    secret: string;
    retryAttempts: number;
    timeout: number;
  };
  features: {
    subscription: boolean;
    usageTracking: boolean;
    invoicing: boolean;
    paymentRetry: boolean;
    emailNotifications: boolean;
    webhooks: boolean;
  };
  security: {
    corsOrigin: string;
    corsCredentials: boolean;
    apiKeyHeader: string;
    apiKeyRequired: boolean;
    sessionSecret: string;
    sessionMaxAge: number;
  };
  integrations: {
    kyc: {
      provider: string;
      apiKey?: string;
    };
    ipfs: {
      gateway: string;
      apiUrl: string;
    };
  };
  development: {
    debug: boolean;
    enableApiDocs: boolean;
    enableSeedData: boolean;
    mockPaymentProcessor: boolean;
    mockEmailService: boolean;
    mockBlockchain: boolean;
  };
}

const config: Config = {
  app: {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
    apiUrl: process.env.API_URL || 'http://localhost:3000',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3001',
  },

  database: {
    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/adstack_db',
    poolMin: parseInt(process.env.DATABASE_POOL_MIN || '2', 10),
    poolMax: parseInt(process.env.DATABASE_POOL_MAX || '10', 10),
    ssl: process.env.DATABASE_SSL === 'true',
  },

  stacks: {
    network: (process.env.STACKS_NETWORK as any) || 'testnet',
    apiUrl: process.env.STACKS_API_URL || 'https://stacks-node-api.testnet.stacks.co',
    contracts: {
      subscriptionManager: process.env.CONTRACT_SUBSCRIPTION_MANAGER || '',
      recurringPayment: process.env.CONTRACT_RECURRING_PAYMENT || '',
      subscriptionBenefits: process.env.CONTRACT_SUBSCRIPTION_BENEFITS || '',
    },
    deployer: {
      mnemonic: process.env.DEPLOYER_MNEMONIC || '',
      walletIndex: parseInt(process.env.DEPLOYER_WALLET_INDEX || '0', 10),
    },
  },

  auth: {
    jwtSecret: process.env.JWT_SECRET || 'change-this-secret-in-production',
    jwtExpiration: process.env.JWT_EXPIRATION || '7d',
  },

  rateLimit: {
    free: parseInt(process.env.RATE_LIMIT_FREE_TIER || '100', 10),
    basic: parseInt(process.env.RATE_LIMIT_BASIC_TIER || '1000', 10),
    pro: parseInt(process.env.RATE_LIMIT_PRO_TIER || '10000', 10),
    enterprise: parseInt(process.env.RATE_LIMIT_ENTERPRISE_TIER || '100000', 10),
    window: parseInt(process.env.RATE_LIMIT_WINDOW || '3600', 10),
  },

  email: {
    provider: process.env.EMAIL_PROVIDER || 'sendgrid',
    apiKey: process.env.EMAIL_API_KEY || '',
    from: process.env.EMAIL_FROM || 'noreply@adstack.io',
    fromName: process.env.EMAIL_FROM_NAME || 'AdStack',
    smtp: process.env.SMTP_HOST
      ? {
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587', 10),
          user: process.env.SMTP_USER || '',
          password: process.env.SMTP_PASSWORD || '',
          secure: process.env.SMTP_SECURE === 'true',
        }
      : undefined,
  },

  payment: {
    stripe: {
      secretKey: process.env.STRIPE_SECRET_KEY || '',
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    },
    maxRetries: parseInt(process.env.PAYMENT_MAX_RETRIES || '3', 10),
    retryDelay: parseInt(process.env.PAYMENT_RETRY_DELAY || '86400', 10),
    gracePeriodDays: parseInt(process.env.GRACE_PERIOD_DAYS || '7', 10),
  },

  subscription: {
    defaultTier: (process.env.DEFAULT_TIER as any) || 'free',
    enableProration: process.env.ENABLE_PRORATION !== 'false',
    prorationBehavior: process.env.PRORATION_BEHAVIOR || 'create_prorations',
    cancelAtPeriodEndDefault: process.env.CANCEL_AT_PERIOD_END_DEFAULT === 'true',
    requireCancellationReason: process.env.REQUIRE_CANCELLATION_REASON !== 'false',
  },

  usage: {
    syncInterval: parseInt(process.env.USAGE_SYNC_INTERVAL || '3600', 10),
    alertThresholds: [
      parseInt(process.env.USAGE_ALERT_THRESHOLD_1 || '75', 10),
      parseInt(process.env.USAGE_ALERT_THRESHOLD_2 || '90', 10),
      parseInt(process.env.USAGE_ALERT_THRESHOLD_3 || '100', 10),
    ],
  },

  cache: {
    redisUrl: process.env.REDIS_URL,
    ttl: parseInt(process.env.CACHE_TTL || '3600', 10),
    maxItems: parseInt(process.env.CACHE_MAX_ITEMS || '1000', 10),
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
  },

  monitoring: {
    sentryDsn: process.env.SENTRY_DSN,
    sentryEnvironment: process.env.SENTRY_ENVIRONMENT || 'development',
  },

  analytics: {
    enabled: process.env.ANALYTICS_ENABLED === 'true',
    provider: process.env.ANALYTICS_PROVIDER || 'mixpanel',
    token: process.env.ANALYTICS_TOKEN,
  },

  webhooks: {
    secret: process.env.WEBHOOK_SECRET || 'change-this-webhook-secret',
    retryAttempts: parseInt(process.env.WEBHOOK_RETRY_ATTEMPTS || '3', 10),
    timeout: parseInt(process.env.WEBHOOK_TIMEOUT || '10000', 10),
  },

  features: {
    subscription: process.env.FEATURE_SUBSCRIPTION_ENABLED !== 'false',
    usageTracking: process.env.FEATURE_USAGE_TRACKING_ENABLED !== 'false',
    invoicing: process.env.FEATURE_INVOICING_ENABLED !== 'false',
    paymentRetry: process.env.FEATURE_PAYMENT_RETRY_ENABLED !== 'false',
    emailNotifications: process.env.FEATURE_EMAIL_NOTIFICATIONS_ENABLED !== 'false',
    webhooks: process.env.FEATURE_WEBHOOKS_ENABLED !== 'false',
  },

  security: {
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3001',
    corsCredentials: process.env.CORS_CREDENTIALS !== 'false',
    apiKeyHeader: process.env.API_KEY_HEADER || 'X-API-Key',
    apiKeyRequired: process.env.API_KEY_REQUIRED === 'true',
    sessionSecret: process.env.SESSION_SECRET || 'change-this-session-secret',
    sessionMaxAge: parseInt(process.env.SESSION_MAX_AGE || '86400000', 10),
  },

  integrations: {
    kyc: {
      provider: process.env.KYC_PROVIDER || 'onfido',
      apiKey: process.env.KYC_API_KEY,
    },
    ipfs: {
      gateway: process.env.IPFS_GATEWAY || 'https://ipfs.io',
      apiUrl: process.env.IPFS_API_URL || 'https://api.pinata.cloud',
    },
  },

  development: {
    debug: process.env.DEBUG === 'true',
    enableApiDocs: process.env.ENABLE_API_DOCS !== 'false',
    enableSeedData: process.env.ENABLE_SEED_DATA === 'true',
    mockPaymentProcessor: process.env.MOCK_PAYMENT_PROCESSOR === 'true',
    mockEmailService: process.env.MOCK_EMAIL_SERVICE === 'true',
    mockBlockchain: process.env.MOCK_BLOCKCHAIN === 'true',
  },
};

// Validate required environment variables in production
if (config.app.env === 'production') {
  const requiredVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'EMAIL_API_KEY',
    'STRIPE_SECRET_KEY',
  ];

  const missing = requiredVars.filter((varName) => !process.env[varName]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables in production: ${missing.join(', ')}`
    );
  }

  // Warn about insecure secrets
  if (config.auth.jwtSecret.includes('change-this')) {
    console.warn('WARNING: Using default JWT secret in production!');
  }

  if (config.webhooks.secret.includes('change-this')) {
    console.warn('WARNING: Using default webhook secret in production!');
  }
}

export default config;

import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';

const spec = {
  openapi: '3.0.3',
  info: {
    title: 'AdStack API',
    version: '1.0.0',
    description: 'REST API for the AdStack decentralized advertising platform on Stacks blockchain.',
  },
  servers: [
    { url: '/api', description: 'API base path' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string' },
          message: { type: 'string' },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          wallet_address: { type: 'string' },
          email: { type: 'string' },
          display_name: { type: 'string' },
          tier: { type: 'string', enum: ['free', 'basic', 'pro', 'enterprise'] },
          is_admin: { type: 'boolean' },
          is_verified: { type: 'boolean' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      Campaign: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          user_id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          description: { type: 'string' },
          status: { type: 'string', enum: ['draft', 'pending', 'active', 'paused', 'completed', 'cancelled'] },
          budget: { type: 'number' },
          spent: { type: 'number' },
          impressions: { type: 'integer' },
          clicks: { type: 'integer' },
          conversions: { type: 'integer' },
          start_date: { type: 'string', format: 'date-time' },
          end_date: { type: 'string', format: 'date-time' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      Subscription: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          user_id: { type: 'string' },
          plan_id: { type: 'integer' },
          plan_name: { type: 'string' },
          tier: { type: 'string' },
          status: { type: 'string', enum: ['active', 'past_due', 'canceled', 'expired', 'grace_period'] },
          price: { type: 'number' },
          billing_interval: { type: 'string', enum: ['monthly', 'quarterly', 'yearly'] },
          current_period_start: { type: 'string', format: 'date-time' },
          current_period_end: { type: 'string', format: 'date-time' },
          auto_renew: { type: 'boolean' },
        },
      },
      Plan: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
          tier: { type: 'string' },
          description: { type: 'string' },
          price: { type: 'number' },
          billing_interval: { type: 'string' },
          features: { type: 'array', items: { type: 'string' } },
          limits: { type: 'object' },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/auth/wallet': {
      post: {
        tags: ['Auth'],
        summary: 'Authenticate with Stacks wallet',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['walletAddress'],
                properties: {
                  walletAddress: { type: 'string' },
                  signature: { type: 'string' },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Authentication successful' },
          '400': { description: 'Invalid wallet address' },
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Get current user profile',
        responses: {
          '200': { description: 'User profile' },
          '401': { description: 'Not authenticated' },
        },
      },
    },
    '/auth/profile': {
      put: {
        tags: ['Auth'],
        summary: 'Update user profile',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  displayName: { type: 'string' },
                  email: { type: 'string' },
                  avatarUrl: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Profile updated' },
        },
      },
    },
    '/campaigns': {
      get: {
        tags: ['Campaigns'],
        summary: 'List campaigns',
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: {
          '200': { description: 'List of campaigns' },
        },
      },
      post: {
        tags: ['Campaigns'],
        summary: 'Create a new campaign',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'budget'],
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                  budget: { type: 'number' },
                  dailyBudget: { type: 'number' },
                  startDate: { type: 'string', format: 'date-time' },
                  endDate: { type: 'string', format: 'date-time' },
                  targetingRules: { type: 'object' },
                  adContent: { type: 'object' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Campaign created' },
          '400': { description: 'Validation error' },
        },
      },
    },
    '/campaigns/{id}': {
      get: {
        tags: ['Campaigns'],
        summary: 'Get campaign by ID',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': { description: 'Campaign details' },
          '404': { description: 'Campaign not found' },
        },
      },
      put: {
        tags: ['Campaigns'],
        summary: 'Update campaign',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': { description: 'Campaign updated' },
        },
      },
      delete: {
        tags: ['Campaigns'],
        summary: 'Delete campaign',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '204': { description: 'Campaign deleted' },
        },
      },
    },
    '/campaigns/{id}/status': {
      put: {
        tags: ['Campaigns'],
        summary: 'Update campaign status',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: {
                  status: { type: 'string', enum: ['active', 'paused', 'completed', 'cancelled'] },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Status updated' },
        },
      },
    },
    '/subscriptions/plans': {
      get: {
        tags: ['Subscriptions'],
        summary: 'List available subscription plans',
        security: [],
        responses: {
          '200': { description: 'List of plans' },
        },
      },
    },
    '/subscriptions': {
      post: {
        tags: ['Subscriptions'],
        summary: 'Create subscription',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['planId', 'billingInterval'],
                properties: {
                  planId: { type: 'integer' },
                  billingInterval: { type: 'string', enum: ['monthly', 'yearly'] },
                  paymentMethodId: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Subscription created' },
        },
      },
    },
    '/subscriptions/{id}/cancel': {
      post: {
        tags: ['Subscriptions'],
        summary: 'Cancel subscription',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  immediate: { type: 'boolean' },
                  feedback: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Subscription cancelled' },
        },
      },
    },
    '/analytics/summary': {
      get: {
        tags: ['Analytics'],
        summary: 'Get analytics summary',
        parameters: [
          { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'campaignId', in: 'query', schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': { description: 'Analytics summary data' },
        },
      },
    },
    '/analytics/timeseries': {
      get: {
        tags: ['Analytics'],
        summary: 'Get time series analytics data',
        parameters: [
          { name: 'startDate', in: 'query', required: true, schema: { type: 'string', format: 'date' } },
          { name: 'endDate', in: 'query', required: true, schema: { type: 'string', format: 'date' } },
          { name: 'interval', in: 'query', schema: { type: 'string', enum: ['hour', 'day', 'week', 'month'] } },
          { name: 'campaignId', in: 'query', schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': { description: 'Time series data' },
        },
      },
    },
    '/payments/methods': {
      get: {
        tags: ['Payments'],
        summary: 'List payment methods',
        responses: {
          '200': { description: 'Payment methods list' },
        },
      },
      post: {
        tags: ['Payments'],
        summary: 'Add payment method',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['type'],
                properties: {
                  type: { type: 'string', enum: ['stx', 'escrow', 'auto_debit'] },
                  walletAddress: { type: 'string' },
                  setAsDefault: { type: 'boolean' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Payment method added' },
        },
      },
    },
    '/payments/invoices': {
      get: {
        tags: ['Payments'],
        summary: 'List invoices',
        parameters: [
          { name: 'subscriptionId', in: 'query', schema: { type: 'string', format: 'uuid' } },
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
        ],
        responses: {
          '200': { description: 'Invoice list' },
        },
      },
    },
    '/users': {
      get: {
        tags: ['Users (Admin)'],
        summary: 'List all users',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
          { name: 'tier', in: 'query', schema: { type: 'string' } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'User list' },
          '403': { description: 'Admin access required' },
        },
      },
    },
    '/webhooks': {
      get: {
        tags: ['Webhooks'],
        summary: 'List registered webhooks',
        responses: {
          '200': { description: 'Webhook list' },
        },
      },
    },
    '/webhooks/register': {
      post: {
        tags: ['Webhooks'],
        summary: 'Register webhook endpoint',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['url', 'events'],
                properties: {
                  url: { type: 'string', format: 'uri' },
                  events: { type: 'array', items: { type: 'string' } },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Webhook registered' },
        },
      },
    },
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Basic health check',
        security: [],
        responses: {
          '200': { description: 'Service is healthy' },
        },
      },
    },
    '/health/ready': {
      get: {
        tags: ['Health'],
        summary: 'Readiness check including DB and Redis',
        security: [],
        responses: {
          '200': { description: 'Service is ready' },
          '503': { description: 'Service not ready' },
        },
      },
    },
  },
  tags: [
    { name: 'Auth', description: 'Authentication and user management' },
    { name: 'Campaigns', description: 'Campaign CRUD and lifecycle' },
    { name: 'Subscriptions', description: 'Subscription management' },
    { name: 'Analytics', description: 'Analytics and reporting' },
    { name: 'Payments', description: 'Payment processing and invoicing' },
    { name: 'Users (Admin)', description: 'Admin user management' },
    { name: 'Webhooks', description: 'Webhook configuration and delivery' },
    { name: 'Health', description: 'Service health checks' },
  ],
};

const router = Router();
router.use('/', swaggerUi.serve);
router.get('/', swaggerUi.setup(spec, { customSiteTitle: 'AdStack API Docs' }));

export default router;

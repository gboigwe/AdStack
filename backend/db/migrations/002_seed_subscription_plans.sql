-- Migration: 002_seed_subscription_plans
-- Description: Seed default subscription plans
-- Created: 2024-01-01
-- Author: AdStack Team

BEGIN;

INSERT INTO subscription_plans (name, tier, description, price, billing_interval, features, limits, display_order)
VALUES
  -- Monthly Plans
  ('Free', 'free', 'Get started with basic features', 0.00, 'monthly',
   '["1 Campaign", "10K Impressions/month", "Basic Analytics", "Community Support"]',
   '{"campaigns": 1, "impressions": 10000, "apiCalls": 100, "storage": 1, "users": 1}', 1),

  ('Basic Monthly', 'basic', 'Perfect for small businesses', 29.00, 'monthly',
   '["5 Campaigns", "100K Impressions/month", "Advanced Analytics", "Email Support", "API Access"]',
   '{"campaigns": 5, "impressions": 100000, "apiCalls": 1000, "storage": 10, "users": 3}', 2),

  ('Pro Monthly', 'pro', 'For growing businesses', 99.00, 'monthly',
   '["20 Campaigns", "1M Impressions/month", "Advanced Analytics", "Priority Support", "API Access", "Custom Targeting", "White Label"]',
   '{"campaigns": 20, "impressions": 1000000, "apiCalls": 10000, "storage": 100, "users": 10}', 3),

  ('Enterprise Monthly', 'enterprise', 'For large organizations', 299.00, 'monthly',
   '["Unlimited Campaigns", "Unlimited Impressions", "Advanced Analytics", "Dedicated Support", "API Access", "Custom Targeting", "White Label", "Custom Integrations", "SLA"]',
   '{"campaigns": -1, "impressions": -1, "apiCalls": -1, "storage": -1, "users": -1}', 4),

  -- Yearly Plans (20% discount)
  ('Basic Yearly', 'basic', 'Save 20% with annual billing', 278.40, 'yearly',
   '["5 Campaigns", "100K Impressions/month", "Advanced Analytics", "Email Support", "API Access"]',
   '{"campaigns": 5, "impressions": 100000, "apiCalls": 1000, "storage": 10, "users": 3}', 5),

  ('Pro Yearly', 'pro', 'Save 20% with annual billing', 950.40, 'yearly',
   '["20 Campaigns", "1M Impressions/month", "Advanced Analytics", "Priority Support", "API Access", "Custom Targeting", "White Label"]',
   '{"campaigns": 20, "impressions": 1000000, "apiCalls": 10000, "storage": 100, "users": 10}', 6),

  ('Enterprise Yearly', 'enterprise', 'Save 20% with annual billing', 2870.40, 'yearly',
   '["Unlimited Campaigns", "Unlimited Impressions", "Advanced Analytics", "Dedicated Support", "API Access", "Custom Targeting", "White Label", "Custom Integrations", "SLA"]',
   '{"campaigns": -1, "impressions": -1, "apiCalls": -1, "storage": -1, "users": -1}', 7)
ON CONFLICT (tier, billing_interval) DO NOTHING;

COMMIT;

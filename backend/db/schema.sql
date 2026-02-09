-- AdStack Subscription System Database Schema
-- PostgreSQL Schema for Subscription and Payment Management
-- Version: 1.0.0

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- SUBSCRIPTIONS
-- ============================================

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id VARCHAR(255) NOT NULL,
  subscription_id BIGINT NOT NULL,
  plan_id INTEGER NOT NULL,
  plan_name VARCHAR(100) NOT NULL,
  tier VARCHAR(50) NOT NULL CHECK (tier IN ('free', 'basic', 'pro', 'enterprise')),
  status VARCHAR(50) NOT NULL CHECK (status IN ('active', 'past_due', 'canceled', 'expired', 'grace_period')),
  price DECIMAL(10, 2) NOT NULL,
  billing_interval VARCHAR(20) NOT NULL CHECK (billing_interval IN ('monthly', 'quarterly', 'yearly')),
  current_period_start TIMESTAMP NOT NULL,
  current_period_end TIMESTAMP NOT NULL,
  auto_renew BOOLEAN NOT NULL DEFAULT true,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  canceled_at TIMESTAMP,
  cancellation_feedback TEXT,
  grace_period_end TIMESTAMP,
  default_payment_method_id VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, subscription_id)
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_period_end ON subscriptions(current_period_end);

-- ============================================
-- SUBSCRIPTION PLANS
-- ============================================

CREATE TABLE IF NOT EXISTS subscription_plans (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  tier VARCHAR(50) NOT NULL CHECK (tier IN ('free', 'basic', 'pro', 'enterprise')),
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  billing_interval VARCHAR(20) NOT NULL CHECK (billing_interval IN ('monthly', 'quarterly', 'yearly')),
  features JSONB NOT NULL DEFAULT '[]',
  limits JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(tier, billing_interval)
);

CREATE INDEX idx_plans_tier ON subscription_plans(tier);
CREATE INDEX idx_plans_active ON subscription_plans(is_active);

-- ============================================
-- USAGE TRACKING
-- ============================================

CREATE TABLE IF NOT EXISTS usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL,
  usage_type VARCHAR(50) NOT NULL CHECK (usage_type IN (
    'campaigns', 'impressions', 'clicks', 'conversions',
    'api_calls', 'team_members', 'storage', 'reports'
  )),
  amount BIGINT NOT NULL DEFAULT 0,
  limit_amount BIGINT NOT NULL,
  soft_limit BIGINT,
  overage_amount BIGINT NOT NULL DEFAULT 0,
  overage_fee DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  period_start TIMESTAMP NOT NULL,
  period_end TIMESTAMP NOT NULL,
  last_reset TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(subscription_id, usage_type)
);

CREATE INDEX idx_usage_subscription ON usage(subscription_id);
CREATE INDEX idx_usage_user ON usage(user_id);
CREATE INDEX idx_usage_type ON usage(usage_type);
CREATE INDEX idx_usage_period ON usage(period_start, period_end);

-- ============================================
-- USAGE EVENTS LOG
-- ============================================

CREATE TABLE IF NOT EXISTS usage_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL,
  usage_type VARCHAR(50) NOT NULL,
  amount INTEGER NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_usage_events_subscription ON usage_events(subscription_id);
CREATE INDEX idx_usage_events_user ON usage_events(user_id);
CREATE INDEX idx_usage_events_type ON usage_events(usage_type);
CREATE INDEX idx_usage_events_created ON usage_events(created_at DESC);

-- ============================================
-- INVOICES
-- ============================================

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number VARCHAR(50) NOT NULL UNIQUE,
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  tax DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  total DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  status VARCHAR(50) NOT NULL CHECK (status IN ('draft', 'open', 'paid', 'void', 'uncollectible')),
  due_date TIMESTAMP NOT NULL,
  paid_at TIMESTAMP,
  line_items JSONB NOT NULL DEFAULT '[]',
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invoices_subscription ON invoices(subscription_id);
CREATE INDEX idx_invoices_user ON invoices(user_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_invoices_number ON invoices(invoice_number);

-- ============================================
-- PAYMENTS
-- ============================================

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_id BIGINT NOT NULL,
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  user_id VARCHAR(255) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'processing', 'success', 'failed', 'refunded', 'canceled')),
  payment_method_id VARCHAR(255),
  payment_method_type VARCHAR(50) NOT NULL CHECK (payment_method_type IN ('stx', 'escrow', 'auto_debit')),
  failure_reason TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  next_retry_at TIMESTAMP,
  executed_at TIMESTAMP,
  refunded_at TIMESTAMP,
  refund_amount DECIMAL(10, 2),
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_subscription ON payments(subscription_id);
CREATE INDEX idx_payments_invoice ON payments(invoice_id);
CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_next_retry ON payments(next_retry_at);

-- ============================================
-- PAYMENT METHODS
-- ============================================

CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id VARCHAR(255) NOT NULL,
  method_id VARCHAR(255) NOT NULL UNIQUE,
  method_type VARCHAR(50) NOT NULL CHECK (method_type IN ('stx', 'escrow', 'auto_debit')),
  is_default BOOLEAN NOT NULL DEFAULT false,
  wallet_address VARCHAR(255),
  details JSONB,
  auto_recharge_enabled BOOLEAN NOT NULL DEFAULT false,
  auto_recharge_threshold DECIMAL(10, 2),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payment_methods_user ON payment_methods(user_id);
CREATE INDEX idx_payment_methods_default ON payment_methods(user_id, is_default);
CREATE INDEX idx_payment_methods_active ON payment_methods(is_active);

-- ============================================
-- SUBSCRIPTION BENEFITS
-- ============================================

CREATE TABLE IF NOT EXISTS subscription_benefits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL,
  feature_name VARCHAR(100) NOT NULL,
  feature_enabled BOOLEAN NOT NULL DEFAULT true,
  access_level VARCHAR(50),
  expires_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(subscription_id, feature_name)
);

CREATE INDEX idx_benefits_subscription ON subscription_benefits(subscription_id);
CREATE INDEX idx_benefits_user ON subscription_benefits(user_id);
CREATE INDEX idx_benefits_feature ON subscription_benefits(feature_name);

-- ============================================
-- USAGE ALERTS
-- ============================================

CREATE TABLE IF NOT EXISTS usage_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL,
  usage_type VARCHAR(50) NOT NULL,
  threshold INTEGER NOT NULL CHECK (threshold IN (75, 90, 100)),
  triggered_at TIMESTAMP NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_alerts_subscription ON usage_alerts(subscription_id);
CREATE INDEX idx_alerts_user ON usage_alerts(user_id);
CREATE INDEX idx_alerts_read ON usage_alerts(is_read);

-- ============================================
-- RENEWAL REMINDERS
-- ============================================

CREATE TABLE IF NOT EXISTS renewal_reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL,
  reminder_days INTEGER NOT NULL,
  sent_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reminders_subscription ON renewal_reminders(subscription_id);
CREATE INDEX idx_reminders_user ON renewal_reminders(user_id);

-- ============================================
-- PRORATION RECORDS
-- ============================================

CREATE TABLE IF NOT EXISTS proration_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL,
  old_plan_id INTEGER NOT NULL,
  new_plan_id INTEGER NOT NULL,
  old_price DECIMAL(10, 2) NOT NULL,
  new_price DECIMAL(10, 2) NOT NULL,
  credit_amount DECIMAL(10, 2) NOT NULL,
  charge_amount DECIMAL(10, 2) NOT NULL,
  net_amount DECIMAL(10, 2) NOT NULL,
  effective_date TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_proration_subscription ON proration_records(subscription_id);
CREATE INDEX idx_proration_user ON proration_records(user_id);

-- ============================================
-- CACHE TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS cache (
  key VARCHAR(255) PRIMARY KEY,
  value JSONB NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cache_expires ON cache(expires_at);

-- ============================================
-- AUDIT LOG
-- ============================================

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(255) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  action VARCHAR(50) NOT NULL,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_action ON audit_log(action);
CREATE INDEX idx_audit_created ON audit_log(created_at DESC);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update timestamp trigger to all relevant tables
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON subscription_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usage_updated_at BEFORE UPDATE ON usage
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON payment_methods
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscription_benefits_updated_at BEFORE UPDATE ON subscription_benefits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SEED DATA
-- ============================================

-- Insert default subscription plans
INSERT INTO subscription_plans (name, tier, description, price, billing_interval, features, limits, display_order)
VALUES
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

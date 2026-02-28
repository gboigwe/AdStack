CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'active', 'paused', 'completed', 'cancelled')),
  budget DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  spent DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  daily_budget DECIMAL(12, 2),
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  targeting_rules JSONB DEFAULT '{}',
  ad_content JSONB DEFAULT '{}',
  impressions BIGINT NOT NULL DEFAULT 0,
  clicks BIGINT NOT NULL DEFAULT 0,
  conversions BIGINT NOT NULL DEFAULT 0,
  ctr DECIMAL(8, 4) NOT NULL DEFAULT 0.0000,
  cpc DECIMAL(10, 4) NOT NULL DEFAULT 0.0000,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_campaigns_user ON campaigns(user_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_dates ON campaigns(start_date, end_date);
CREATE INDEX idx_campaigns_created ON campaigns(created_at DESC);

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS publishers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(255) NOT NULL UNIQUE,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'rejected')),
  verification_code VARCHAR(255) NOT NULL,
  verified_at TIMESTAMP,
  category VARCHAR(100) NOT NULL,
  monthly_traffic BIGINT NOT NULL DEFAULT 0,
  ad_slots INTEGER NOT NULL DEFAULT 1,
  revenue_share DECIMAL(5, 2) NOT NULL DEFAULT 70.00,
  total_impressions BIGINT NOT NULL DEFAULT 0,
  total_revenue DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_publishers_user ON publishers(user_id);
CREATE INDEX idx_publishers_domain ON publishers(domain);
CREATE INDEX idx_publishers_status ON publishers(status);
CREATE INDEX idx_publishers_category ON publishers(category);

CREATE TRIGGER update_publishers_updated_at BEFORE UPDATE ON publishers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

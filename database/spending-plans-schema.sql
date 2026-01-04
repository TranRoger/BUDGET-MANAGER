-- Spending Plans table
CREATE TABLE IF NOT EXISTS spending_plans (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  monthly_income DECIMAL(15, 2) NOT NULL,
  target_date DATE NOT NULL,
  notes TEXT,
  plan_content TEXT NOT NULL,
  summary JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster queries
CREATE INDEX idx_spending_plans_user_id ON spending_plans(user_id);
CREATE INDEX idx_spending_plans_active ON spending_plans(user_id, is_active);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_spending_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_spending_plans_updated_at
BEFORE UPDATE ON spending_plans
FOR EACH ROW
EXECUTE FUNCTION update_spending_plans_updated_at();

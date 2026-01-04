-- Create Debt Transactions Table
CREATE TABLE IF NOT EXISTS debt_transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  debt_id INTEGER REFERENCES debts(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  type VARCHAR(20) CHECK (type IN ('payment', 'increase')) NOT NULL,
  description TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Index for better performance
CREATE INDEX idx_debt_transactions_debt_id ON debt_transactions(debt_id);
CREATE INDEX idx_debt_transactions_user_id ON debt_transactions(user_id);
CREATE INDEX idx_debt_transactions_date ON debt_transactions(date);

-- Add trigger for updated_at
CREATE TRIGGER update_debt_transactions_updated_at 
BEFORE UPDATE ON debt_transactions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add paid_amount column to debts table to track total paid
ALTER TABLE debts ADD COLUMN IF NOT EXISTS paid_amount DECIMAL(10, 2) DEFAULT 0;

-- Create function to update debt when transaction is added/updated/deleted
CREATE OR REPLACE FUNCTION update_debt_from_transaction()
RETURNS TRIGGER AS $$
DECLARE
  payment_total DECIMAL(10, 2);
BEGIN
  IF TG_OP = 'DELETE' THEN
    -- If deleting an increase, reduce the total debt amount
    IF OLD.type = 'increase' THEN
      UPDATE debts 
      SET amount = amount - OLD.amount
      WHERE id = OLD.debt_id;
    END IF;
    
    -- Recalculate paid_amount
    SELECT COALESCE(SUM(amount), 0)
    INTO payment_total
    FROM debt_transactions 
    WHERE debt_id = OLD.debt_id AND type = 'payment';
    
    UPDATE debts 
    SET paid_amount = payment_total
    WHERE id = OLD.debt_id;
    
    RETURN OLD;
    
  ELSIF TG_OP = 'UPDATE' THEN
    -- Handle type change
    IF OLD.type = 'increase' AND NEW.type = 'payment' THEN
      -- Changed from increase to payment: reduce amount, add to paid
      UPDATE debts 
      SET amount = amount - OLD.amount
      WHERE id = NEW.debt_id;
    ELSIF OLD.type = 'payment' AND NEW.type = 'increase' THEN
      -- Changed from payment to increase: add to amount
      UPDATE debts 
      SET amount = amount + NEW.amount
      WHERE id = NEW.debt_id;
    ELSIF OLD.type = 'increase' AND NEW.type = 'increase' THEN
      -- Amount changed for increase type
      UPDATE debts 
      SET amount = amount - OLD.amount + NEW.amount
      WHERE id = NEW.debt_id;
    END IF;
    
    -- Recalculate paid_amount
    SELECT COALESCE(SUM(amount), 0)
    INTO payment_total
    FROM debt_transactions 
    WHERE debt_id = NEW.debt_id AND type = 'payment';
    
    UPDATE debts 
    SET paid_amount = payment_total
    WHERE id = NEW.debt_id;
    
    RETURN NEW;
    
  ELSE -- INSERT
    -- If this is an increase, add to the total debt amount
    IF NEW.type = 'increase' THEN
      UPDATE debts 
      SET amount = amount + NEW.amount
      WHERE id = NEW.debt_id;
    END IF;
    
    -- Recalculate paid_amount
    SELECT COALESCE(SUM(amount), 0)
    INTO payment_total
    FROM debt_transactions 
    WHERE debt_id = NEW.debt_id AND type = 'payment';
    
    UPDATE debts 
    SET paid_amount = payment_total
    WHERE id = NEW.debt_id;
    
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update debt
DROP TRIGGER IF EXISTS debt_transactions_update_paid_amount ON debt_transactions;
DROP TRIGGER IF EXISTS debt_transactions_update_debt ON debt_transactions;
CREATE TRIGGER debt_transactions_update_debt
AFTER INSERT OR UPDATE OR DELETE ON debt_transactions
FOR EACH ROW EXECUTE FUNCTION update_debt_from_transaction();

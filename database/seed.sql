-- Sample Users
INSERT INTO users (email, password, name) VALUES
  ('demo@example.com', '$2b$10$YourHashedPasswordHere', 'Demo User');

-- Get the demo user id
DO $$
DECLARE
  demo_user_id INTEGER;
BEGIN
  SELECT id INTO demo_user_id FROM users WHERE email = 'demo@example.com';

  -- Sample Transactions
  INSERT INTO transactions (user_id, amount, type, category_id, description, date) VALUES
    (demo_user_id, 5000.00, 'income', 1, 'Monthly salary', CURRENT_DATE - INTERVAL '5 days'),
    (demo_user_id, 150.50, 'expense', 4, 'Grocery shopping', CURRENT_DATE - INTERVAL '4 days'),
    (demo_user_id, 50.00, 'expense', 5, 'Gas', CURRENT_DATE - INTERVAL '3 days'),
    (demo_user_id, 200.00, 'expense', 6, 'New shoes', CURRENT_DATE - INTERVAL '2 days'),
    (demo_user_id, 100.00, 'expense', 7, 'Movie tickets', CURRENT_DATE - INTERVAL '1 day');

  -- Sample Budgets
  INSERT INTO budgets (user_id, category_id, amount, period, start_date, end_date) VALUES
    (demo_user_id, 4, 600.00, 'monthly', DATE_TRUNC('month', CURRENT_DATE), DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day'),
    (demo_user_id, 5, 200.00, 'monthly', DATE_TRUNC('month', CURRENT_DATE), DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day'),
    (demo_user_id, 7, 300.00, 'monthly', DATE_TRUNC('month', CURRENT_DATE), DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day');

  -- Sample Assets
  INSERT INTO assets (user_id, name, type, value, description) VALUES
    (demo_user_id, 'Savings Account', 'Bank Account', 15000.00, 'Emergency fund'),
    (demo_user_id, 'Car', 'Vehicle', 20000.00, 'Toyota Camry 2020');

  -- Sample Debts
  INSERT INTO debts (user_id, name, amount, interest_rate, due_date, description) VALUES
    (demo_user_id, 'Student Loan', 10000.00, 5.5, CURRENT_DATE + INTERVAL '5 years', 'Education loan'),
    (demo_user_id, 'Credit Card', 2000.00, 18.0, CURRENT_DATE + INTERVAL '1 month', 'Credit card balance');
END $$;

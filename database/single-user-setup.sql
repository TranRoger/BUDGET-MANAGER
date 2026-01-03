-- Ensure default user exists for single user mode
-- This user will be used for all operations (no authentication)

INSERT INTO users (id, email, name, password, created_at, updated_at)
VALUES (
  1,
  'user@budgetmanager.local',
  'Budget Manager User',
  '$2b$10$dummyhashedpasswordnotneededforsingleusermode',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  updated_at = NOW();

-- Reset sequence to start from 2 (in case we want to add more users later)
SELECT setval('users_id_seq', GREATEST(1, (SELECT MAX(id) FROM users)), true);

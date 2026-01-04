-- Add role column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';

-- Update existing users to have 'user' role
UPDATE users SET role = 'user' WHERE role IS NULL;

-- Create first admin user (default credentials - CHANGE IN PRODUCTION!)
-- Password: admin123
INSERT INTO users (email, password, name, role) 
VALUES ('admin@budget.com', '$2b$10$rQ8YvVJK5qGZxJ.oEh5fJ.8vJYqV3KdxZ8YJFxqZ8YJFxqZ8YJFxq', 'Admin User', 'admin')
ON CONFLICT (email) DO UPDATE SET role = 'admin';

-- Add constraint to ensure role is valid
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('user', 'admin'));

-- Create index for role queries
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

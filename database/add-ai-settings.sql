-- Add AI settings columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS ai_api_key VARCHAR(255),
ADD COLUMN IF NOT EXISTS ai_model VARCHAR(50) DEFAULT 'gemini-2.0-flash-exp';

-- Add index for faster lookup
CREATE INDEX IF NOT EXISTS idx_users_ai_settings ON users(id) WHERE ai_api_key IS NOT NULL;

-- Show updated structure
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

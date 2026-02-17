-- Migration: 010_add_cognito_user_id
-- Add cognito_user_id column to users table for Cognito authentication integration

ALTER TABLE users ADD COLUMN IF NOT EXISTS cognito_user_id VARCHAR(255);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_users_cognito_user_id ON users(cognito_user_id);

-- Add comment for documentation
COMMENT ON COLUMN users.cognito_user_id IS 'AWS Cognito User Pool sub ID for authentication';

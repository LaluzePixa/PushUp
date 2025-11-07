-- Migration: Add account lockout fields to users table
-- Description: Add fields to track failed login attempts and account lockout status
-- Created: 2025-11-07

ALTER TABLE users
ADD COLUMN IF NOT EXISTS login_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP,
ADD COLUMN IF NOT EXISTS last_login_attempt TIMESTAMP;

-- Index for faster lookups of locked accounts
CREATE INDEX IF NOT EXISTS idx_users_locked_until ON users(locked_until) WHERE locked_until IS NOT NULL;

-- Comments
COMMENT ON COLUMN users.login_attempts IS 'Number of consecutive failed login attempts';
COMMENT ON COLUMN users.locked_until IS 'Timestamp until which the account is locked (NULL if not locked)';
COMMENT ON COLUMN users.last_login_attempt IS 'Timestamp of the last login attempt (successful or failed)';

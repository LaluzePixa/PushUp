-- Migration: Create password reset tokens table
-- Description: Store tokens for password reset functionality
-- Created: 2025-11-07

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(50),
    user_agent TEXT,

    -- Constraints
    CONSTRAINT valid_expiration CHECK (expires_at > created_at)
);

-- Indexes
CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

-- Auto-cleanup function for expired tokens (optional, can be run as cron job)
CREATE OR REPLACE FUNCTION cleanup_expired_password_reset_tokens()
RETURNS void AS $$
BEGIN
    DELETE FROM password_reset_tokens
    WHERE expires_at < NOW() OR used_at IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE password_reset_tokens IS 'Tokens for password reset requests';
COMMENT ON COLUMN password_reset_tokens.token IS 'Unique token sent to user via email';
COMMENT ON COLUMN password_reset_tokens.expires_at IS 'Token expiration timestamp (typically 1 hour from creation)';
COMMENT ON COLUMN password_reset_tokens.used_at IS 'Timestamp when the token was used (NULL if unused)';
COMMENT ON COLUMN password_reset_tokens.ip_address IS 'IP address from which the reset was requested';

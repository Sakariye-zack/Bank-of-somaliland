-- Refresh token store, needed for server-side rotation/invalidation
-- (spec left storage mechanism unspecified — Database_API_Auth_Specification.md Section 4)
CREATE TABLE admin_refresh_tokens (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_user_id UUID NOT NULL REFERENCES admin_users(id),
  token_hash    VARCHAR(255) NOT NULL,
  expires_at    TIMESTAMPTZ NOT NULL,
  revoked_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_admin_refresh_tokens_user ON admin_refresh_tokens(admin_user_id);

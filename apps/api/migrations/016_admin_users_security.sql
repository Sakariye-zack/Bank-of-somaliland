-- Password reset tokens and TOTP-based 2FA fields for admin accounts.
ALTER TABLE admin_users ADD COLUMN reset_token VARCHAR(255);
ALTER TABLE admin_users ADD COLUMN reset_token_expires TIMESTAMPTZ;
ALTER TABLE admin_users ADD COLUMN totp_secret VARCHAR(255);
ALTER TABLE admin_users ADD COLUMN totp_enabled BOOLEAN NOT NULL DEFAULT false;

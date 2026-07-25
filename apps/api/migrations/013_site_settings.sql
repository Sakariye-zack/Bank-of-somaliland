-- Singleton row holding site-wide branding/contact settings, editable from
-- the admin panel instead of being hardcoded in the frontend.
CREATE TABLE site_settings (
  id            INT PRIMARY KEY DEFAULT 1,
  site_name     VARCHAR(200) NOT NULL DEFAULT 'Bank of Somaliland',
  logo_url      VARCHAR(500),
  watermark_url VARCHAR(500),
  phone         VARCHAR(50),
  email         VARCHAR(255),
  social_x          VARCHAR(500),
  social_facebook   VARCHAR(500),
  social_youtube    VARCHAR(500),
  social_linkedin   VARCHAR(500),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by    UUID REFERENCES admin_users(id),
  CONSTRAINT single_row CHECK (id = 1)
);
INSERT INTO site_settings (id, site_name) VALUES (1, 'Bank of Somaliland');

-- Email subscribers for rate/press-release alerts. Public self-signup via
-- POST /v1/newsletter/subscribe, exportable by admins from the dashboard.
CREATE TABLE newsletter_subscribers (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email        VARCHAR(255) NOT NULL UNIQUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

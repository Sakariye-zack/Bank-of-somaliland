-- Contact form submissions (PRD Section 3: "rate-limited and sanitized")
-- Not in the original DDL spec — added because the PRD requires the feature to exist.
CREATE TABLE contact_messages (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       VARCHAR(150) NOT NULL,
  email      VARCHAR(255) NOT NULL,
  subject    VARCHAR(200) NOT NULL,
  message    TEXT NOT NULL,
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_contact_messages_created ON contact_messages(created_at DESC);

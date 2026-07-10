-- Bank of Somaliland — initial schema
-- Source: Database_API_Auth_Specification.md Section 1
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================================
-- 1. admin_users
-- =========================================================
CREATE TABLE admin_users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(150) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(30)  NOT NULL CHECK (role IN (
                  'super_admin', 'content_editor',
                  'supervision_data_officer', 'exchange_rate_officer'
                )),
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by    UUID REFERENCES admin_users(id)
);
CREATE INDEX idx_admin_users_email ON admin_users(email);

-- =========================================================
-- 2. content_pages
-- =========================================================
CREATE TABLE content_pages (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug        VARCHAR(120) NOT NULL UNIQUE,
  page_type   VARCHAR(50) NOT NULL,
  status      VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  updated_by  UUID REFERENCES admin_users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================================================
-- 3. content_translations
-- =========================================================
CREATE TABLE content_translations (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_id       UUID NOT NULL,
  content_table    VARCHAR(50) NOT NULL,
  language_code    VARCHAR(2)  NOT NULL CHECK (language_code IN ('en','so','ar')),
  title            VARCHAR(300),
  body             TEXT,
  meta_description VARCHAR(300),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (content_id, content_table, language_code)
);
CREATE INDEX idx_content_translations_lookup
  ON content_translations(content_id, content_table, language_code);

-- =========================================================
-- 4. exchange_rates
-- =========================================================
CREATE TABLE exchange_rates (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  currency_code VARCHAR(3) NOT NULL,
  rate_to_ssh  NUMERIC(14,4) NOT NULL,
  rate_date    DATE NOT NULL,
  entered_by   UUID NOT NULL REFERENCES admin_users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (currency_code, rate_date)
);
CREATE INDEX idx_exchange_rates_date ON exchange_rates(rate_date DESC);

-- =========================================================
-- 5. press_releases
-- =========================================================
CREATE TABLE press_releases (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  publish_date DATE NOT NULL,
  content_id   UUID NOT NULL,
  status       VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  featured     BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_press_releases_date ON press_releases(publish_date DESC);

-- =========================================================
-- 6. publications
-- =========================================================
CREATE TABLE publications (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title_content_id UUID NOT NULL,
  file_url         VARCHAR(500) NOT NULL,
  category         VARCHAR(50) NOT NULL CHECK (category IN (
                     'annual_report','circular','stability_report'
                   )),
  publish_date     DATE NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_publications_category ON publications(category);

-- =========================================================
-- 7. laws_regulations
-- =========================================================
CREATE TABLE laws_regulations (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title_content_id UUID NOT NULL,
  file_url         VARCHAR(500) NOT NULL,
  law_number       VARCHAR(50),
  effective_date   DATE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================================================
-- 8. licensed_institutions
-- =========================================================
CREATE TABLE licensed_institutions (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name             VARCHAR(200) NOT NULL,
  institution_type VARCHAR(30) NOT NULL CHECK (institution_type IN (
                     'bank','remit','mm','mfi','pay','takaful','fx'
                   )),
  license_number   VARCHAR(50),
  status           VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active','revoked')),
  license_date     DATE,
  headquarters     VARCHAR(120),
  updated_by       UUID REFERENCES admin_users(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_institutions_type_status ON licensed_institutions(institution_type, status);
CREATE INDEX idx_institutions_name ON licensed_institutions USING gin (to_tsvector('simple', name));

-- =========================================================
-- 9. board_members
-- =========================================================
CREATE TABLE board_members (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(150) NOT NULL,
  title         VARCHAR(150) NOT NULL,
  bio_content_id UUID,
  photo_url     VARCHAR(500),
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================================================
-- 10. job_postings
-- =========================================================
CREATE TABLE job_postings (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title_content_id UUID NOT NULL,
  department       VARCHAR(150),
  closing_date     DATE NOT NULL,
  status           VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================================================
-- 11. tenders
-- =========================================================
CREATE TABLE tenders (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title_content_id  UUID NOT NULL,
  reference_number  VARCHAR(50) NOT NULL UNIQUE,
  closing_date      DATE NOT NULL,
  file_url          VARCHAR(500),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================================================
-- 12. audit_log
-- =========================================================
CREATE TABLE audit_log (
  id            BIGSERIAL PRIMARY KEY,
  admin_user_id UUID NOT NULL REFERENCES admin_users(id),
  action        VARCHAR(50) NOT NULL,
  table_name    VARCHAR(50) NOT NULL,
  record_id     UUID,
  before_value  JSONB,
  after_value   JSONB,
  ip_address    INET,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_log_user ON audit_log(admin_user_id);
CREATE INDEX idx_audit_log_table_record ON audit_log(table_name, record_id);

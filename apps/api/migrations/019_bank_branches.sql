-- Central Bank of Somaliland branch office directory, shown on the homepage
-- below the Licensed Institutions register. Admin-manageable like hero_slides.
CREATE TABLE bank_branches (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name             VARCHAR(150) NOT NULL,
  name_so          VARCHAR(150),
  name_ar          VARCHAR(150),
  city             VARCHAR(100) NOT NULL,
  city_so          VARCHAR(100),
  city_ar          VARCHAR(100),
  address          VARCHAR(300),
  address_so       VARCHAR(300),
  address_ar       VARCHAR(300),
  phone            VARCHAR(50),
  is_headquarters  BOOLEAN NOT NULL DEFAULT false,
  sort_order       INTEGER NOT NULL DEFAULT 0,
  is_active        BOOLEAN NOT NULL DEFAULT true,
  updated_by       UUID REFERENCES admin_users(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_bank_branches_active_sort ON bank_branches(is_active, sort_order);

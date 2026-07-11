-- Admin-manageable navigation bar (not in the original spec DDL — added so the
-- Bank's content team can add/reorder nav links and point them at any page
-- without a code deploy).
CREATE TABLE nav_items (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  label      VARCHAR(100) NOT NULL,
  path       VARCHAR(300) NOT NULL,          -- e.g. '/institutions' or 'https://external.example'
  parent_id  UUID REFERENCES nav_items(id),  -- NULL = top-level nav item; set = dropdown child
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active  BOOLEAN NOT NULL DEFAULT true,
  updated_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_nav_items_parent_sort ON nav_items(parent_id, sort_order);

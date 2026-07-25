-- Replace the fixed category CHECK constraint with a manageable table so
-- admins can add new publication categories without a code deploy.
CREATE TABLE publication_categories (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug       VARCHAR(60) NOT NULL UNIQUE,
  name       VARCHAR(100) NOT NULL,
  name_so    VARCHAR(100),
  name_ar    VARCHAR(100),
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO publication_categories (slug, name, name_so, name_ar, sort_order) VALUES
  ('annual_report', 'Annual Report', 'Warbixin Sannadle', 'التقرير السنوي', 1),
  ('circular', 'Circular', 'Wareegto', 'تعميم', 2),
  ('stability_report', 'Stability Report', 'Warbixinta Xasillooni', 'تقرير الاستقرار', 3);

ALTER TABLE publications DROP CONSTRAINT publications_category_check;
ALTER TABLE publications ALTER COLUMN category TYPE VARCHAR(60);

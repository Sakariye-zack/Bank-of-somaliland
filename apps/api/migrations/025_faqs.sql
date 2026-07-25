-- Frequently Asked Questions shown on the public /faq page. Admin-manageable
-- accordion entries, same translation-column pattern as bank_branches.
CREATE TABLE faqs (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question     VARCHAR(300) NOT NULL,
  question_so  VARCHAR(300),
  question_ar  VARCHAR(300),
  answer       TEXT NOT NULL,
  answer_so    TEXT,
  answer_ar    TEXT,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  updated_by   UUID REFERENCES admin_users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_faqs_active_sort ON faqs(is_active, sort_order);

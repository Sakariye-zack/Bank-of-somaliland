-- Dedicated homepage slider content, independent of press releases — the
-- admin should be able to curate exactly what appears in the hero slider
-- (upload an image directly, hide/show a slide) without it being tied to
-- publishing a press release.
CREATE TABLE hero_slides (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       VARCHAR(300) NOT NULL,
  title_so    VARCHAR(300),
  subtitle    VARCHAR(300),
  subtitle_so VARCHAR(300),
  image_url   VARCHAR(500),
  video_url   VARCHAR(500),
  link_url    VARCHAR(500),
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  updated_by  UUID REFERENCES admin_users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_hero_slides_active_sort ON hero_slides(is_active, sort_order);

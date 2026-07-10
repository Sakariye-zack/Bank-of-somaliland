-- Real uploaded media for press releases: one optional video, any number of images.
-- (Not in the original DDL spec — added because the admin panel needs to upload
-- actual files, not just paste a URL.)
ALTER TABLE press_releases ADD COLUMN video_url VARCHAR(500);

CREATE TABLE press_release_images (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  press_release_id UUID NOT NULL REFERENCES press_releases(id),
  image_url        VARCHAR(500) NOT NULL,
  sort_order       INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_press_release_images_release ON press_release_images(press_release_id, sort_order);

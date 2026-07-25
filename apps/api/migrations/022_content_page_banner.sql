-- Optional per-page hero banner (image or short video) so each content page
-- can look visually distinct instead of sharing one plain heading layout.
ALTER TABLE content_pages ADD COLUMN banner_image_url VARCHAR(500);
ALTER TABLE content_pages ADD COLUMN banner_video_url VARCHAR(500);

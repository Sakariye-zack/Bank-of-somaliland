-- Short lede/standfirst shown under the H1 in a content page's hero banner.
-- Lives on the translation row (not the page) so it can be written per language.
ALTER TABLE content_translations ADD COLUMN IF NOT EXISTS subtitle TEXT;

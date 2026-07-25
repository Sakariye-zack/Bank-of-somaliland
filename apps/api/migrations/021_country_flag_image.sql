-- Optional uploaded image for the country masthead (falls back to the
-- built-in SVG flag icon in the frontend if not set).
ALTER TABLE site_settings ADD COLUMN country_flag_url VARCHAR(500);

-- Logo and website link for licensed institutions, so the public site can
-- show a real institutions showcase (not in the original DDL spec).
ALTER TABLE licensed_institutions ADD COLUMN logo_url VARCHAR(500);
ALTER TABLE licensed_institutions ADD COLUMN website_url VARCHAR(500);

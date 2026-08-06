-- Editable "Central Monetary Authority" tagline shown under the site name in
-- the public header. Previously hardcoded in the public app's i18n dictionary.
ALTER TABLE site_settings ADD COLUMN tagline_en VARCHAR(150) NOT NULL DEFAULT 'Central Monetary Authority';
ALTER TABLE site_settings ADD COLUMN tagline_so VARCHAR(150) NOT NULL DEFAULT 'Maamulaha Dhexe ee Lacagta';
ALTER TABLE site_settings ADD COLUMN tagline_ar VARCHAR(150) NOT NULL DEFAULT 'السلطة النقدية المركزية';

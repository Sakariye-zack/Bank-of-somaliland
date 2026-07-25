-- Bilingual "Republic of Somaliland" masthead shown above the utility bar,
-- editable/hideable from Website Settings.
ALTER TABLE site_settings ADD COLUMN country_label_en VARCHAR(150) NOT NULL DEFAULT 'Republic of Somaliland';
ALTER TABLE site_settings ADD COLUMN country_label_so VARCHAR(150) NOT NULL DEFAULT 'Jamhuuriyadda Somaliland';
ALTER TABLE site_settings ADD COLUMN show_country_label BOOLEAN NOT NULL DEFAULT true;

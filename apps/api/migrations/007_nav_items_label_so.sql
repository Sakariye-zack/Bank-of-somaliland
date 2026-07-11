-- Somali label for nav items (Phase 5 localization). Simple nullable column
-- rather than routing through content_translations, since nav_items are a
-- handful of short labels, not long-form content.
ALTER TABLE nav_items ADD COLUMN label_so VARCHAR(100);

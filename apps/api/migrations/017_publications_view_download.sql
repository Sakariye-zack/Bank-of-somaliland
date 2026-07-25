-- Lets a publication/law be uploaded with a real cover thumbnail and either
-- allow direct download or be view-only (opens the PDF in the browser
-- without forcing a save-as download).
ALTER TABLE publications ADD COLUMN thumbnail_url VARCHAR(500);
ALTER TABLE publications ADD COLUMN is_downloadable BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE laws_regulations ADD COLUMN thumbnail_url VARCHAR(500);
ALTER TABLE laws_regulations ADD COLUMN is_downloadable BOOLEAN NOT NULL DEFAULT true;

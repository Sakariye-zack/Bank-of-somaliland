-- Lets admins mark a tender open/closed (and edit it) instead of it only ever
-- being publishable, mirroring job_postings.status.
ALTER TABLE tenders ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed'));

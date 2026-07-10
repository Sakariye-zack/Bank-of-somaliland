-- license_number is the natural business key for an institution even though
-- the original DDL didn't mark it UNIQUE. Needed so seeding/re-seeding is idempotent.
CREATE UNIQUE INDEX idx_institutions_license_number_unique
  ON licensed_institutions (license_number) WHERE license_number IS NOT NULL;

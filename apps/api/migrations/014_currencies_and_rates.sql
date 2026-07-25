-- Managed currency list (code/name/flag) so exchange rate entry isn't tied
-- to a hardcoded set of currencies, and buy/sell rate columns so the public
-- rate table can show both, matching real bureau-de-change conventions.
CREATE TABLE currencies (
  code       VARCHAR(3) PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  name_so    VARCHAR(100),
  name_ar    VARCHAR(100),
  flag_url   VARCHAR(500),
  sort_order INT NOT NULL DEFAULT 0,
  is_active  BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO currencies (code, name, name_so, name_ar, sort_order) VALUES
  ('USD', 'US Dollar', 'Doolar Mareykan', 'دولار أمريكي', 1),
  ('SAR', 'Saudi Riyal', 'Riyal Sacuudi', 'ريال سعودي', 2),
  ('ETB', 'Ethiopian Birr', 'Birta Itoobiya', 'بير إثيوبي', 3),
  ('AED', 'UAE Dirham', 'Dirham Imaaraat', 'درهم إماراتي', 4);

ALTER TABLE exchange_rates ADD COLUMN buying_rate NUMERIC(14,4);
ALTER TABLE exchange_rates ADD COLUMN selling_rate NUMERIC(14,4);
UPDATE exchange_rates SET buying_rate = rate_to_ssh, selling_rate = rate_to_ssh;
ALTER TABLE exchange_rates ALTER COLUMN buying_rate SET NOT NULL;
ALTER TABLE exchange_rates ALTER COLUMN selling_rate SET NOT NULL;

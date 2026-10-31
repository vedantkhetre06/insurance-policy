-- Additive + idempotent: safe to run repeatedly, never drops or rewrites existing rows' data.
CREATE SEQUENCE IF NOT EXISTS policy_number_seq;
CREATE SEQUENCE IF NOT EXISTS claim_number_seq;

ALTER TABLE policies ADD COLUMN IF NOT EXISTS policy_number VARCHAR(32);
ALTER TABLE policies ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE policies ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE policies ADD COLUMN IF NOT EXISTS age INTEGER;
ALTER TABLE policies ADD COLUMN IF NOT EXISTS sum_assured NUMERIC(14, 2);
ALTER TABLE policies ADD COLUMN IF NOT EXISTS annual_premium NUMERIC(14, 2);
ALTER TABLE policies ADD COLUMN IF NOT EXISTS payment_frequency VARCHAR(20) DEFAULT 'annual';
ALTER TABLE policies ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE policies ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE policies ADD COLUMN IF NOT EXISTS details JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE policies ALTER COLUMN premium TYPE NUMERIC(14, 2);

ALTER TABLE claims ADD COLUMN IF NOT EXISTS claim_number VARCHAR(32);
ALTER TABLE claims ADD COLUMN IF NOT EXISTS settled_date DATE;
ALTER TABLE claims ALTER COLUMN amount TYPE NUMERIC(14, 2);

-- Backfill numbers for rows created by the original IPMS code (only where missing)
UPDATE policies SET policy_number = 'POL-' || to_char(created_at, 'YYYY') || '-' || lpad(nextval('policy_number_seq')::text, 3, '0')
  WHERE policy_number IS NULL;
UPDATE claims SET claim_number = 'CLM-' || to_char(created_at, 'YYYY') || '-' || lpad(nextval('claim_number_seq')::text, 3, '0')
  WHERE claim_number IS NULL;
UPDATE policies SET annual_premium = premium WHERE annual_premium IS NULL;
UPDATE policies SET start_date = created_at::date WHERE start_date IS NULL;
UPDATE policies SET end_date = (created_at + interval '1 year')::date WHERE end_date IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS policies_policy_number_key ON policies (policy_number);
CREATE UNIQUE INDEX IF NOT EXISTS claims_claim_number_key ON claims (claim_number);
CREATE INDEX IF NOT EXISTS policies_user_id_idx ON policies (user_id);
CREATE INDEX IF NOT EXISTS claims_policy_id_idx ON claims (policy_id);

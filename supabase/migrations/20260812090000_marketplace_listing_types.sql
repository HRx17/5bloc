-- Marketplace listing types
--
-- `contractors` is the only listing table but it has to carry two different kinds of
-- business: contractors who sell services/trades, and vendors who sell supplies/materials.
-- This adds the distinction plus the contact/location fields that the public signup forms
-- (/list-your-business and /join-as-vendor) already capture but had nowhere to land.

ALTER TABLE contractors
  ADD COLUMN IF NOT EXISTS listing_type      TEXT NOT NULL DEFAULT 'contractor',
  ADD COLUMN IF NOT EXISTS supply_categories TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS contact_name      TEXT,
  ADD COLUMN IF NOT EXISTS contact_email     TEXT,
  ADD COLUMN IF NOT EXISTS phone             TEXT,
  ADD COLUMN IF NOT EXISTS city              TEXT,
  ADD COLUMN IF NOT EXISTS state             TEXT,
  ADD COLUMN IF NOT EXISTS country           TEXT,
  ADD COLUMN IF NOT EXISTS team_size_label   TEXT,
  ADD COLUMN IF NOT EXISTS source            TEXT,
  ADD COLUMN IF NOT EXISTS source_table      TEXT,
  ADD COLUMN IF NOT EXISTS source_signup_id  UUID;

DO $$
BEGIN
  ALTER TABLE contractors
    ADD CONSTRAINT contractors_listing_type_check
    CHECK (listing_type IN ('contractor', 'vendor'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

-- Lets the backfill script re-run without duplicating listings.
CREATE UNIQUE INDEX IF NOT EXISTS idx_contractors_source_signup
  ON contractors (source_table, source_signup_id)
  WHERE source_signup_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_contractors_listing_type ON contractors (listing_type);
CREATE INDEX IF NOT EXISTS idx_contractors_supply_cats  ON contractors USING GIN (supply_categories);

-- Everything already in the table is a trade contractor.
UPDATE contractors SET listing_type = 'contractor' WHERE listing_type IS NULL;

COMMENT ON COLUMN contractors.listing_type IS
  'contractor = sells services/trades, vendor = sells supplies/materials';
COMMENT ON COLUMN contractors.supply_categories IS
  'Vendor supply categories as captured on /join-as-vendor';
COMMENT ON COLUMN contractors.team_size_label IS
  'Free-text band from the signup forms (e.g. "2-10"); team_size stays numeric';
COMMENT ON COLUMN contractors.source_signup_id IS
  'Row id in contractor_signups / vendor_signups this listing was backfilled from';

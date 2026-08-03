-- Fix: "Remote migration versions not found in local migration directory"
--
-- Run this in Supabase → SQL Editor (NOT as an auto-migration).
-- Your catalog tables are already created; this only syncs the history ledger.

-- 1) See what remote thinks is applied:
select *
from supabase_migrations.schema_migrations
order by version;

-- 2) Drop orphan remote versions that have no matching file in this repo.
--    Keep only versions that exist under supabase/migrations/*.sql
delete from supabase_migrations.schema_migrations
where version not in (
  '20260802120000'  -- vendor_catalog
);

-- 3) Record the vendor catalog migration as applied (you already ran its SQL):
insert into supabase_migrations.schema_migrations (version, name)
values ('20260802120000', 'vendor_catalog')
on conflict (version) do nothing;

-- 4) Confirm history is clean:
select *
from supabase_migrations.schema_migrations
order by version;

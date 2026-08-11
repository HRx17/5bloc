-- ONE-SHOT FIX for GitHub "Remote migration versions not found in local migrations directory"
--
-- Run ONLY this in Supabase → SQL Editor, then tell the agent / push again.
-- This does NOT delete any of your app tables or data — only the migration ledger.

truncate table supabase_migrations.schema_migrations;

-- Optional confirm (should return 0):
select count(*) as remaining_history_rows
from supabase_migrations.schema_migrations;

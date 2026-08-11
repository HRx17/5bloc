# Supabase migrations

**Migrations in this folder are the source of truth** for the production database schema.

## Important

- Files under `supabase/migrations/` are applied in filename order.
- A checked-in `schema.sql` (if present) may be **stale** — do not treat it as authoritative for prod.
- Prefer creating new timestamped migration files over editing old ones that may already have been applied.

## Apply to production

From the app root (with the Supabase CLI linked to your project):

```bash
npx supabase db push
```

Or apply SQL manually in the Supabase SQL editor in the same order as the filenames.

After pushing, verify critical objects (e.g. `get_portal_payload`, storage RLS policies) match what the app expects.

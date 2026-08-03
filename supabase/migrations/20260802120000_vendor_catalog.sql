-- Vendor catalog for large SKU lists (10k+).
-- Filename must be YYYYMMDDHHMMSS_name.sql for Supabase CLI / GitHub integration.
-- Safe to re-run (IF NOT EXISTS).

-- Optional columns on waitlist signups
alter table if exists public.vendor_signups
  add column if not exists catalog_method text,
  add column if not exists catalog_item_count integer,
  add column if not exists catalog_file_url text,
  add column if not exists catalog_notes text;

create table if not exists public.vendor_catalog_imports (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  vendor_signup_id uuid references public.vendor_signups(id) on delete set null,
  org_id uuid,
  owner_email text not null,
  method text not null check (method in ('csv', 'url', 'sheet', 'later')),
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'ready', 'failed', 'partial')),
  source_url text,
  file_url text,
  file_name text,
  total_rows integer not null default 0,
  processed_rows integer not null default 0,
  error_message text,
  sample jsonb not null default '[]'::jsonb
);

create index if not exists vendor_catalog_imports_email_idx
  on public.vendor_catalog_imports (owner_email);

create table if not exists public.vendor_catalog_items (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  import_id uuid references public.vendor_catalog_imports(id) on delete cascade,
  org_id uuid,
  owner_email text not null,
  sku text not null,
  name text not null,
  category text,
  unit text,
  price numeric,
  currency text default 'INR',
  brand text,
  description text,
  is_active boolean not null default true
);

create index if not exists vendor_catalog_items_email_idx
  on public.vendor_catalog_items (owner_email);

create index if not exists vendor_catalog_items_sku_idx
  on public.vendor_catalog_items (owner_email, sku);

-- Public waitlist inserts (anon) — tighten in production with RLS policies as needed
alter table public.vendor_catalog_imports enable row level security;
alter table public.vendor_catalog_items enable row level security;

drop policy if exists "anon insert catalog imports" on public.vendor_catalog_imports;
create policy "anon insert catalog imports"
  on public.vendor_catalog_imports for insert
  to anon, authenticated
  with check (true);

drop policy if exists "anon insert catalog items" on public.vendor_catalog_items;
create policy "anon insert catalog items"
  on public.vendor_catalog_items for insert
  to anon, authenticated
  with check (true);

drop policy if exists "auth read own catalog imports" on public.vendor_catalog_imports;
create policy "auth read own catalog imports"
  on public.vendor_catalog_imports for select
  to authenticated
  using (
    owner_email = (auth.jwt() ->> 'email')
    or org_id in (select org_id from public.profiles where auth_id = auth.uid())
  );

drop policy if exists "auth read own catalog items" on public.vendor_catalog_items;
create policy "auth read own catalog items"
  on public.vendor_catalog_items for select
  to authenticated
  using (
    owner_email = (auth.jwt() ->> 'email')
    or org_id in (select org_id from public.profiles where auth_id = auth.uid())
  );

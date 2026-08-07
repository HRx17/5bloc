-- Allow public waitlist / partner signup inserts (anon browser client).
-- Fixes: new row violates row-level security policy for table "vendor_signups"

-- vendor_signups
alter table if exists public.vendor_signups enable row level security;

drop policy if exists "anon insert vendor_signups" on public.vendor_signups;
create policy "anon insert vendor_signups"
  on public.vendor_signups
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "auth read vendor_signups" on public.vendor_signups;
create policy "auth read vendor_signups"
  on public.vendor_signups
  for select
  to authenticated
  using (true);

-- contractor_signups (same public form pattern)
alter table if exists public.contractor_signups enable row level security;

drop policy if exists "anon insert contractor_signups" on public.contractor_signups;
create policy "anon insert contractor_signups"
  on public.contractor_signups
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "auth read contractor_signups" on public.contractor_signups;
create policy "auth read contractor_signups"
  on public.contractor_signups
  for select
  to authenticated
  using (true);

-- waitlist
alter table if exists public.waitlist enable row level security;

drop policy if exists "anon insert waitlist" on public.waitlist;
create policy "anon insert waitlist"
  on public.waitlist
  for insert
  to anon, authenticated
  with check (true);

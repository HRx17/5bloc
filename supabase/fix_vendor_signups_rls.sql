-- RUN THIS NOW in Supabase → SQL Editor
-- Fixes: new row violates row-level security policy for table "vendor_signups"
-- (CSV preview can succeed while waitlist submit fails)

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

alter table if exists public.waitlist enable row level security;

drop policy if exists "anon insert waitlist" on public.waitlist;
create policy "anon insert waitlist"
  on public.waitlist
  for insert
  to anon, authenticated
  with check (true);

-- Confirm policies exist:
select schemaname, tablename, policyname, roles, cmd
from pg_policies
where tablename in ('vendor_signups', 'contractor_signups', 'waitlist')
order by tablename, policyname;

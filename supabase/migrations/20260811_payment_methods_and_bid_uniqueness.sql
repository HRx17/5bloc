-- Saved payment methods per user + one live bid per contractor per tender
create table if not exists public.payment_methods (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  org_id uuid references public.organisations(id) on delete cascade,
  kind text not null default 'card' check (kind in ('card','upi','netbanking')),
  label text,
  brand text,
  last4 text,
  upi_vpa text,
  exp_month int,
  exp_year int,
  provider text default 'razorpay',
  provider_token text,
  is_default boolean not null default false,
  created_at timestamptz default now()
);

create index if not exists payment_methods_profile_idx on public.payment_methods(profile_id);

alter table public.payment_methods enable row level security;

drop policy if exists payment_methods_owner on public.payment_methods;
create policy payment_methods_owner on public.payment_methods
  for all using (profile_id = current_user_id()) with check (profile_id = current_user_id());

create unique index if not exists bids_tender_contractor_uniq
  on public.bids(tender_id, contractor_id);

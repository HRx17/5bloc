-- OAuth token storage for third-party integrations (Google Workspace, Autodesk APS).
-- Previously only documented as a comment in lib/integrations/token-store.ts and applied
-- by hand, so fresh environments came up without the table. Idempotent so it is safe to
-- run against databases where the table was already created manually.

create table if not exists public.user_integrations (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  provider        text not null,
  access_token    text not null,
  refresh_token   text,
  expires_at      timestamptz,
  scope           text,
  provider_email  text,
  provider_name   text,
  metadata        jsonb default '{}'::jsonb,
  connected_at    timestamptz default now()
);

-- Columns added defensively for databases created from the original hand-run DDL.
alter table public.user_integrations add column if not exists scope text;
alter table public.user_integrations add column if not exists provider_email text;
alter table public.user_integrations add column if not exists provider_name text;
alter table public.user_integrations add column if not exists metadata jsonb default '{}'::jsonb;
alter table public.user_integrations add column if not exists connected_at timestamptz default now();

-- One connection per provider per user; token-store upserts on this constraint.
-- Skip if an equivalent unique index already exists (the hand-run DDL used a table
-- level `unique(user_id, provider)` constraint, which creates its own index).
do $$
begin
  if not exists (
    select 1
    from pg_index i
    join pg_class c on c.oid = i.indrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'user_integrations'
      and i.indisunique
      and (
        select array_agg(a.attname order by a.attname)
        from unnest(i.indkey) as k(attnum)
        join pg_attribute a on a.attrelid = c.oid and a.attnum = k.attnum
      ) = array['provider', 'user_id']
  ) then
    create unique index user_integrations_user_provider_key
      on public.user_integrations (user_id, provider);
  end if;
end $$;

create index if not exists user_integrations_user_id_idx
  on public.user_integrations (user_id);

alter table public.user_integrations enable row level security;

drop policy if exists "Users manage own integrations" on public.user_integrations;
create policy "Users manage own integrations"
  on public.user_integrations for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

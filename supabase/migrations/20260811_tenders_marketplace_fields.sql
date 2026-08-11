-- Denormalized marketplace card fields so contractors can see open bids
-- without needing SELECT on private projects.
alter table public.tenders add column if not exists project_name text;
alter table public.tenders add column if not exists city text;
alter table public.tenders add column if not exists services text[] default '{}';

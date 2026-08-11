-- Optional photo references for site visit inspection logs
ALTER TABLE public.site_visits
  ADD COLUMN IF NOT EXISTS photo_urls text[];

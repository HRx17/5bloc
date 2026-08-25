-- Transmittals recorded only a free-text list of what was sent. Store the actual
-- file alongside it so the shared document can be retrieved later.
ALTER TABLE public.transmittals
  ADD COLUMN IF NOT EXISTS attachment_url text;

COMMENT ON COLUMN public.transmittals.attachment_url IS
  'Storage key of the shared file, wrapped in a [[5bloc-file|key|name]] marker so the original filename survives.';

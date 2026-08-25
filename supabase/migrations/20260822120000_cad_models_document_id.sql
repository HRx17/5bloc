-- Persist Autodesk translation per vault drawing so the in-document
-- viewer can reopen the real model without re-uploading every time.
ALTER TABLE public.cad_models
  ADD COLUMN IF NOT EXISTS document_id uuid REFERENCES public.documents(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS cad_models_document_id_uidx
  ON public.cad_models (document_id)
  WHERE document_id IS NOT NULL;

COMMENT ON COLUMN public.cad_models.document_id IS
  'Vault document this translated model was generated from.';

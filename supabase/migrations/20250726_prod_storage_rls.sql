-- Own-folder storage RLS for the `documents` bucket.
-- Objects must live under `{auth.uid()}/...` so users only access their prefix.
-- Replaces broader authenticated-only policies from earlier migrations.

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('documents', 'documents', false, 52428800)
ON CONFLICT (id) DO NOTHING;

-- Drop legacy broad policies if present
DROP POLICY IF EXISTS "documents_storage_auth_read" ON storage.objects;
DROP POLICY IF EXISTS "documents_storage_auth_insert" ON storage.objects;
DROP POLICY IF EXISTS "documents_storage_auth_update" ON storage.objects;

DROP POLICY IF EXISTS "documents_storage_own_read" ON storage.objects;
CREATE POLICY "documents_storage_own_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = (auth.uid())::text
  );

DROP POLICY IF EXISTS "documents_storage_own_insert" ON storage.objects;
CREATE POLICY "documents_storage_own_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = (auth.uid())::text
  );

DROP POLICY IF EXISTS "documents_storage_own_update" ON storage.objects;
CREATE POLICY "documents_storage_own_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = (auth.uid())::text
  )
  WITH CHECK (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = (auth.uid())::text
  );

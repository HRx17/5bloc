CREATE POLICY "signup_photos_public_insert"
ON storage.objects FOR INSERT TO anon, authenticated
WITH CHECK (bucket_id = 'signup-photos' AND (storage.foldername(name))[1] = 'contractor-signups');
-- Allow reading profiles of people who share a conversation with you (for chat UI).

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles'
      AND policyname = 'profiles: read conversation peers'
  ) THEN
    CREATE POLICY "profiles: read conversation peers" ON public.profiles
      FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM public.conversation_members mine
          JOIN public.conversation_members peer
            ON peer.conversation_id = mine.conversation_id
          WHERE mine.profile_id = public.my_profile_id()
            AND peer.profile_id = profiles.id
        )
      );
  END IF;
END $$;

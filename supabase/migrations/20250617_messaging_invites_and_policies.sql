-- Messaging invites, search RPC, and conversation create policy
-- Applied via Supabase migration: messaging_invites_and_policies

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'conversations' AND policyname = 'conversations: auth create'
  ) THEN
    CREATE POLICY "conversations: auth create" ON public.conversations
      FOR INSERT TO authenticated
      WITH CHECK (created_by = public.my_profile_id());
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.search_messaging_profiles(search_query text, result_limit int DEFAULT 10)
RETURNS TABLE (id uuid, full_name text, email text, role text, avatar_url text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO public
AS $$
  SELECT p.id, p.full_name, p.email, p.role, p.avatar_url
  FROM public.profiles p
  WHERE auth.uid() IS NOT NULL
    AND p.id <> public.my_profile_id()
    AND (p.email ILIKE '%' || search_query || '%' OR p.full_name ILIKE '%' || search_query || '%')
  ORDER BY CASE WHEN lower(p.email) = lower(search_query) THEN 0 ELSE 1 END, p.full_name NULLS LAST
  LIMIT GREATEST(1, LEAST(result_limit, 20));
$$;

CREATE TABLE IF NOT EXISTS public.conversation_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  email text NOT NULL,
  invited_by uuid NOT NULL REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz,
  UNIQUE (conversation_id, email)
);

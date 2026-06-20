-- Fix infinite recursion in profiles RLS ("read same org" subquery re-reads profiles).
-- Also add a SECURITY DEFINER helper for reliable client profile lookup.

CREATE OR REPLACE FUNCTION public.current_user_org_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO public
AS $$
  SELECT org_id FROM public.profiles WHERE auth_id = auth.uid() LIMIT 1;
$$;

DROP POLICY IF EXISTS "profiles: read same org" ON public.profiles;

CREATE POLICY "profiles: read same org" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    org_id IS NOT NULL
    AND org_id = public.current_user_org_id()
  );

CREATE OR REPLACE FUNCTION public.get_my_messaging_profile()
RETURNS TABLE (id uuid, full_name text, email text, role text, avatar_url text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO public
AS $$
  SELECT p.id, p.full_name, p.email, p.role, p.avatar_url
  FROM public.profiles p
  WHERE p.auth_id = auth.uid()
  LIMIT 1;
$$;

-- Fix organisations RLS recursion (same pattern as profiles).
DROP POLICY IF EXISTS "organisations: read own" ON public.organisations;
CREATE POLICY "organisations: read own" ON public.organisations
  FOR SELECT TO authenticated
  USING (id = public.current_user_org_id());

DROP POLICY IF EXISTS "organisations: owner update" ON public.organisations;
CREATE POLICY "organisations: owner update" ON public.organisations
  FOR UPDATE TO authenticated
  USING (id = public.current_user_org_id());

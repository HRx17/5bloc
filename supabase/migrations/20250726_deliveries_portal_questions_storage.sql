-- Vendor deliveries, portal questions, document annotations, storage bucket

CREATE TABLE IF NOT EXISTS public.deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  vendor_profile_id uuid REFERENCES public.profiles(id),
  vendor_name text,
  vendor_email text,
  item text NOT NULL,
  quantity text,
  scheduled_date date,
  status text NOT NULL DEFAULT 'scheduled',
  notes text,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.portal_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  question text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.document_annotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  document_id uuid REFERENCES public.documents(id) ON DELETE CASCADE,
  note text NOT NULL,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_annotations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS deliveries_org ON public.deliveries;
CREATE POLICY deliveries_org ON public.deliveries FOR ALL TO authenticated
  USING (public.is_org_member(org_id) OR vendor_profile_id = public.my_profile_id())
  WITH CHECK (public.is_org_member(org_id) OR vendor_profile_id = public.my_profile_id());

DROP POLICY IF EXISTS deliveries_vendor_self ON public.deliveries;
CREATE POLICY deliveries_vendor_self ON public.deliveries FOR SELECT TO authenticated
  USING (
    vendor_profile_id = public.my_profile_id()
    OR lower(coalesce(vendor_email, '')) = lower(coalesce((SELECT email FROM public.profiles WHERE id = public.my_profile_id()), ''))
  );

DROP POLICY IF EXISTS deliveries_vendor_update ON public.deliveries;
CREATE POLICY deliveries_vendor_update ON public.deliveries FOR UPDATE TO authenticated
  USING (
    vendor_profile_id = public.my_profile_id()
    OR lower(coalesce(vendor_email, '')) = lower(coalesce((SELECT email FROM public.profiles WHERE id = public.my_profile_id()), ''))
  )
  WITH CHECK (
    vendor_profile_id = public.my_profile_id()
    OR lower(coalesce(vendor_email, '')) = lower(coalesce((SELECT email FROM public.profiles WHERE id = public.my_profile_id()), ''))
  );

DROP POLICY IF EXISTS portal_questions_org ON public.portal_questions;
CREATE POLICY portal_questions_org ON public.portal_questions FOR ALL TO authenticated
  USING (public.is_org_member(org_id))
  WITH CHECK (public.is_org_member(org_id));

DROP POLICY IF EXISTS document_annotations_org ON public.document_annotations;
CREATE POLICY document_annotations_org ON public.document_annotations FOR ALL TO authenticated
  USING (public.is_org_member(org_id))
  WITH CHECK (public.is_org_member(org_id));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.deliveries TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.portal_questions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.document_annotations TO authenticated;

CREATE OR REPLACE FUNCTION public.submit_portal_question(p_token text, p_question text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  proj public.projects%ROWTYPE;
  qid uuid;
BEGIN
  IF p_token IS NULL OR length(trim(p_token)) < 8 THEN
    RETURN json_build_object('ok', false, 'error', 'Invalid token');
  END IF;
  IF p_question IS NULL OR length(trim(p_question)) < 3 THEN
    RETURN json_build_object('ok', false, 'error', 'Question required');
  END IF;

  SELECT * INTO proj FROM public.projects
  WHERE portal_token = p_token AND COALESCE(portal_enabled, true) = true
  LIMIT 1;
  IF NOT FOUND THEN
    RETURN json_build_object('ok', false, 'error', 'Portal not found');
  END IF;

  INSERT INTO public.portal_questions (org_id, project_id, question, status)
  VALUES (proj.org_id, proj.id, trim(p_question), 'open')
  RETURNING id INTO qid;

  INSERT INTO public.issues (org_id, project_id, title, description, severity, status, issue_number)
  VALUES (
    proj.org_id,
    proj.id,
    left('Client portal: ' || trim(p_question), 120),
    trim(p_question),
    'medium',
    'open',
    COALESCE((SELECT MAX(issue_number) + 1 FROM public.issues WHERE project_id = proj.id), 1)
  );

  RETURN json_build_object('ok', true, 'id', qid);
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_portal_question(text, text) TO anon, authenticated;

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('documents', 'documents', false, 52428800)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "documents_storage_auth_read" ON storage.objects;
CREATE POLICY "documents_storage_auth_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'documents');

DROP POLICY IF EXISTS "documents_storage_auth_insert" ON storage.objects;
CREATE POLICY "documents_storage_auth_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documents');

DROP POLICY IF EXISTS "documents_storage_auth_update" ON storage.objects;
CREATE POLICY "documents_storage_auth_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'documents');

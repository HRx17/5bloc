-- Project expenses, CAD models, notification preferences

CREATE TABLE IF NOT EXISTS public.project_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  category text NOT NULL DEFAULT 'general',
  description text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  expense_date date,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.project_expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS project_expenses_org ON public.project_expenses;
CREATE POLICY project_expenses_org ON public.project_expenses FOR ALL TO authenticated
  USING (public.is_org_member(org_id)) WITH CHECK (public.is_org_member(org_id));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_expenses TO authenticated;

CREATE TABLE IF NOT EXISTS public.cad_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  name text NOT NULL,
  urn text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cad_models ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cad_models_org ON public.cad_models;
CREATE POLICY cad_models_org ON public.cad_models FOR ALL TO authenticated
  USING (public.is_org_member(org_id)) WITH CHECK (public.is_org_member(org_id));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cad_models TO authenticated;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS notification_preferences jsonb NOT NULL DEFAULT '{"email_project":true,"email_rfi":true,"email_invoice":true,"email_marketing":false}'::jsonb;

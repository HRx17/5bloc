CREATE OR REPLACE FUNCTION public.my_profile_id() RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT id FROM public.profiles WHERE auth_id = auth.uid() LIMIT 1 $$;
CREATE OR REPLACE FUNCTION public.current_user_id() RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT id FROM public.profiles WHERE auth_id = auth.uid() LIMIT 1 $$;
CREATE OR REPLACE FUNCTION public.my_org_id() RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT org_id FROM public.profiles WHERE auth_id = auth.uid() LIMIT 1 $$;
CREATE OR REPLACE FUNCTION public.current_user_org_id() RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT org_id FROM public.profiles WHERE auth_id = auth.uid() LIMIT 1 $$;
CREATE OR REPLACE FUNCTION public.is_org_member(org uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT org IS NOT NULL AND (
    org = (SELECT org_id FROM public.profiles WHERE auth_id = auth.uid() LIMIT 1)
    OR EXISTS (SELECT 1 FROM public.organisation_members m JOIN public.profiles p ON p.id = m.profile_id WHERE m.org_id = org AND p.auth_id = auth.uid())
  ) $$;
CREATE OR REPLACE FUNCTION public.is_org_admin(org uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS (SELECT 1 FROM public.organisations o JOIN public.profiles p ON p.id = o.owner_id WHERE o.id = org AND p.auth_id = auth.uid())
      OR EXISTS (SELECT 1 FROM public.organisation_members m JOIN public.profiles p ON p.id = m.profile_id WHERE m.org_id = org AND p.auth_id = auth.uid() AND m.member_role IN ('owner','admin')) $$;
CREATE OR REPLACE FUNCTION public.can_access_project(proj uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS (SELECT 1 FROM public.projects pr WHERE pr.id = proj AND public.is_org_member(pr.org_id))
      OR EXISTS (SELECT 1 FROM public.project_members pm WHERE pm.project_id = proj AND pm.profile_id = (SELECT id FROM public.profiles WHERE auth_id = auth.uid() LIMIT 1)) $$;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_auth_id_uniq ON public.profiles(auth_id);
CREATE UNIQUE INDEX IF NOT EXISTS projects_portal_token_uniq ON public.projects(portal_token) WHERE portal_token IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS bids_tender_contractor_uniq ON public.bids(tender_id, contractor_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id, created_at DESC);

ALTER TABLE public.activity_log ADD CONSTRAINT fk_activity_log_org_id FOREIGN KEY (org_id) REFERENCES public.organisations(id) ON DELETE SET NULL;
ALTER TABLE public.activity_log ADD CONSTRAINT fk_activity_log_project_id FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL;
ALTER TABLE public.activity_log ADD CONSTRAINT fk_activity_log_user_id FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.ai_estimates ADD CONSTRAINT fk_ai_estimates_org_id FOREIGN KEY (org_id) REFERENCES public.organisations(id) ON DELETE SET NULL;
ALTER TABLE public.ai_estimates ADD CONSTRAINT fk_ai_estimates_profile_id FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.ai_estimates ADD CONSTRAINT fk_ai_estimates_project_id FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL;
ALTER TABLE public.ai_estimates ADD CONSTRAINT fk_ai_estimates_user_id FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.bids ADD CONSTRAINT fk_bids_contractor_id FOREIGN KEY (contractor_id) REFERENCES public.contractors(id) ON DELETE CASCADE;
ALTER TABLE public.bids ADD CONSTRAINT fk_bids_tender_id FOREIGN KEY (tender_id) REFERENCES public.tenders(id) ON DELETE CASCADE;
ALTER TABLE public.cad_models ADD CONSTRAINT fk_cad_models_created_by FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.cad_models ADD CONSTRAINT fk_cad_models_org_id FOREIGN KEY (org_id) REFERENCES public.organisations(id) ON DELETE CASCADE;
ALTER TABLE public.cad_models ADD CONSTRAINT fk_cad_models_project_id FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL;
ALTER TABLE public.client_interactions ADD CONSTRAINT fk_client_interactions_client_id FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;
ALTER TABLE public.client_interactions ADD CONSTRAINT fk_client_interactions_created_by FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.client_interactions ADD CONSTRAINT fk_client_interactions_org_id FOREIGN KEY (org_id) REFERENCES public.organisations(id) ON DELETE CASCADE;
ALTER TABLE public.client_portal_settings ADD CONSTRAINT fk_client_portal_settings_project_id FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;
ALTER TABLE public.clients ADD CONSTRAINT fk_clients_org_id FOREIGN KEY (org_id) REFERENCES public.organisations(id) ON DELETE CASCADE;
ALTER TABLE public.consultant_payments ADD CONSTRAINT fk_consultant_payments_created_by FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.consultant_payments ADD CONSTRAINT fk_consultant_payments_org_id FOREIGN KEY (org_id) REFERENCES public.organisations(id) ON DELETE SET NULL;
ALTER TABLE public.consultant_payments ADD CONSTRAINT fk_consultant_payments_project_id FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;
ALTER TABLE public.contractor_reviews ADD CONSTRAINT fk_contractor_reviews_contractor_id FOREIGN KEY (contractor_id) REFERENCES public.contractors(id) ON DELETE CASCADE;
ALTER TABLE public.contractor_reviews ADD CONSTRAINT fk_contractor_reviews_project_id FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL;
ALTER TABLE public.contractor_reviews ADD CONSTRAINT fk_contractor_reviews_reviewer_id FOREIGN KEY (reviewer_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.contractors ADD CONSTRAINT fk_contractors_user_id FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.conversation_invites ADD CONSTRAINT fk_conversation_invites_conversation_id FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;
ALTER TABLE public.conversation_invites ADD CONSTRAINT fk_conversation_invites_invited_by FOREIGN KEY (invited_by) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.conversation_members ADD CONSTRAINT fk_conversation_members_conversation_id FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;
ALTER TABLE public.conversation_members ADD CONSTRAINT fk_conversation_members_profile_id FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.conversations ADD CONSTRAINT fk_conversations_created_by FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.conversations ADD CONSTRAINT fk_conversations_org_id FOREIGN KEY (org_id) REFERENCES public.organisations(id) ON DELETE SET NULL;
ALTER TABLE public.conversations ADD CONSTRAINT fk_conversations_project_id FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL;
ALTER TABLE public.deliveries ADD CONSTRAINT fk_deliveries_created_by FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.deliveries ADD CONSTRAINT fk_deliveries_org_id FOREIGN KEY (org_id) REFERENCES public.organisations(id) ON DELETE CASCADE;
ALTER TABLE public.deliveries ADD CONSTRAINT fk_deliveries_project_id FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;
ALTER TABLE public.deliveries ADD CONSTRAINT fk_deliveries_vendor_profile_id FOREIGN KEY (vendor_profile_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.document_annotations ADD CONSTRAINT fk_document_annotations_created_by FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.document_annotations ADD CONSTRAINT fk_document_annotations_document_id FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE SET NULL;
ALTER TABLE public.document_annotations ADD CONSTRAINT fk_document_annotations_org_id FOREIGN KEY (org_id) REFERENCES public.organisations(id) ON DELETE CASCADE;
ALTER TABLE public.document_annotations ADD CONSTRAINT fk_document_annotations_project_id FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;
ALTER TABLE public.document_versions ADD CONSTRAINT fk_document_versions_document_id FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE;
ALTER TABLE public.document_versions ADD CONSTRAINT fk_document_versions_project_id FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;
ALTER TABLE public.document_versions ADD CONSTRAINT fk_document_versions_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.documents ADD CONSTRAINT fk_documents_approved_by FOREIGN KEY (approved_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.documents ADD CONSTRAINT fk_documents_org_id FOREIGN KEY (org_id) REFERENCES public.organisations(id) ON DELETE CASCADE;
ALTER TABLE public.documents ADD CONSTRAINT fk_documents_project_id FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL;
ALTER TABLE public.documents ADD CONSTRAINT fk_documents_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.invoices ADD CONSTRAINT fk_invoices_client_id FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL;
ALTER TABLE public.invoices ADD CONSTRAINT fk_invoices_created_by FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.invoices ADD CONSTRAINT fk_invoices_org_id FOREIGN KEY (org_id) REFERENCES public.organisations(id) ON DELETE CASCADE;
ALTER TABLE public.invoices ADD CONSTRAINT fk_invoices_project_id FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL;
ALTER TABLE public.issues ADD CONSTRAINT fk_issues_org_id FOREIGN KEY (org_id) REFERENCES public.organisations(id) ON DELETE CASCADE;
ALTER TABLE public.issues ADD CONSTRAINT fk_issues_project_id FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;
ALTER TABLE public.material_logs ADD CONSTRAINT fk_material_logs_created_by FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.material_logs ADD CONSTRAINT fk_material_logs_org_id FOREIGN KEY (org_id) REFERENCES public.organisations(id) ON DELETE CASCADE;
ALTER TABLE public.material_logs ADD CONSTRAINT fk_material_logs_project_id FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;
ALTER TABLE public.meetings ADD CONSTRAINT fk_meetings_created_by FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.meetings ADD CONSTRAINT fk_meetings_org_id FOREIGN KEY (org_id) REFERENCES public.organisations(id) ON DELETE CASCADE;
ALTER TABLE public.meetings ADD CONSTRAINT fk_meetings_project_id FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;
ALTER TABLE public.messages ADD CONSTRAINT fk_messages_conversation_id FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;
ALTER TABLE public.messages ADD CONSTRAINT fk_messages_sender_id FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.notifications ADD CONSTRAINT fk_notifications_user_id FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.organisation_invites ADD CONSTRAINT fk_organisation_invites_invited_by FOREIGN KEY (invited_by) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.organisation_invites ADD CONSTRAINT fk_organisation_invites_org_id FOREIGN KEY (org_id) REFERENCES public.organisations(id) ON DELETE CASCADE;
ALTER TABLE public.organisation_join_requests ADD CONSTRAINT fk_organisation_join_requests_org_id FOREIGN KEY (org_id) REFERENCES public.organisations(id) ON DELETE CASCADE;
ALTER TABLE public.organisation_join_requests ADD CONSTRAINT fk_organisation_join_requests_profile_id FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.organisation_join_requests ADD CONSTRAINT fk_organisation_join_requests_reviewed_by FOREIGN KEY (reviewed_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.organisation_members ADD CONSTRAINT fk_organisation_members_org_id FOREIGN KEY (org_id) REFERENCES public.organisations(id) ON DELETE CASCADE;
ALTER TABLE public.organisation_members ADD CONSTRAINT fk_organisation_members_profile_id FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.organisations ADD CONSTRAINT fk_organisations_owner_id FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.permits ADD CONSTRAINT fk_permits_org_id FOREIGN KEY (org_id) REFERENCES public.organisations(id) ON DELETE CASCADE;
ALTER TABLE public.permits ADD CONSTRAINT fk_permits_project_id FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;
ALTER TABLE public.phase_milestones ADD CONSTRAINT fk_phase_milestones_org_id FOREIGN KEY (org_id) REFERENCES public.organisations(id) ON DELETE CASCADE;
ALTER TABLE public.phase_milestones ADD CONSTRAINT fk_phase_milestones_project_id FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;
ALTER TABLE public.portal_questions ADD CONSTRAINT fk_portal_questions_org_id FOREIGN KEY (org_id) REFERENCES public.organisations(id) ON DELETE CASCADE;
ALTER TABLE public.portal_questions ADD CONSTRAINT fk_portal_questions_project_id FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;
ALTER TABLE public.profiles ADD CONSTRAINT fk_profiles_org_id FOREIGN KEY (org_id) REFERENCES public.organisations(id) ON DELETE SET NULL;
ALTER TABLE public.project_expenses ADD CONSTRAINT fk_project_expenses_created_by FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.project_expenses ADD CONSTRAINT fk_project_expenses_org_id FOREIGN KEY (org_id) REFERENCES public.organisations(id) ON DELETE CASCADE;
ALTER TABLE public.project_expenses ADD CONSTRAINT fk_project_expenses_project_id FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;
ALTER TABLE public.project_meetings ADD CONSTRAINT fk_project_meetings_created_by FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.project_meetings ADD CONSTRAINT fk_project_meetings_org_id FOREIGN KEY (org_id) REFERENCES public.organisations(id) ON DELETE CASCADE;
ALTER TABLE public.project_meetings ADD CONSTRAINT fk_project_meetings_project_id FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;
ALTER TABLE public.project_members ADD CONSTRAINT fk_project_members_invited_by FOREIGN KEY (invited_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.project_members ADD CONSTRAINT fk_project_members_profile_id FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.project_members ADD CONSTRAINT fk_project_members_project_id FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;
ALTER TABLE public.project_permits ADD CONSTRAINT fk_project_permits_created_by FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.project_permits ADD CONSTRAINT fk_project_permits_org_id FOREIGN KEY (org_id) REFERENCES public.organisations(id) ON DELETE CASCADE;
ALTER TABLE public.project_permits ADD CONSTRAINT fk_project_permits_project_id FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;
ALTER TABLE public.project_team_members ADD CONSTRAINT fk_project_team_members_profile_id FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.project_team_members ADD CONSTRAINT fk_project_team_members_team_id FOREIGN KEY (team_id) REFERENCES public.project_teams(id) ON DELETE CASCADE;
ALTER TABLE public.project_teams ADD CONSTRAINT fk_project_teams_created_by FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.project_teams ADD CONSTRAINT fk_project_teams_project_id FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;
ALTER TABLE public.project_transmittals ADD CONSTRAINT fk_project_transmittals_created_by FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.project_transmittals ADD CONSTRAINT fk_project_transmittals_org_id FOREIGN KEY (org_id) REFERENCES public.organisations(id) ON DELETE CASCADE;
ALTER TABLE public.project_transmittals ADD CONSTRAINT fk_project_transmittals_project_id FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;
ALTER TABLE public.projects ADD CONSTRAINT fk_projects_client_id FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL;
ALTER TABLE public.projects ADD CONSTRAINT fk_projects_created_by FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.projects ADD CONSTRAINT fk_projects_org_id FOREIGN KEY (org_id) REFERENCES public.organisations(id) ON DELETE CASCADE;
ALTER TABLE public.punch_items ADD CONSTRAINT fk_punch_items_created_by FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.punch_items ADD CONSTRAINT fk_punch_items_org_id FOREIGN KEY (org_id) REFERENCES public.organisations(id) ON DELETE CASCADE;
ALTER TABLE public.punch_items ADD CONSTRAINT fk_punch_items_project_id FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;
ALTER TABLE public.rfis ADD CONSTRAINT fk_rfis_org_id FOREIGN KEY (org_id) REFERENCES public.organisations(id) ON DELETE CASCADE;
ALTER TABLE public.rfis ADD CONSTRAINT fk_rfis_project_id FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;
ALTER TABLE public.rfis ADD CONSTRAINT fk_rfis_responded_by FOREIGN KEY (responded_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.rfq_quotes ADD CONSTRAINT fk_rfq_quotes_org_id FOREIGN KEY (org_id) REFERENCES public.organisations(id) ON DELETE CASCADE;
ALTER TABLE public.rfq_quotes ADD CONSTRAINT fk_rfq_quotes_rfq_id FOREIGN KEY (rfq_id) REFERENCES public.rfqs(id) ON DELETE CASCADE;
ALTER TABLE public.rfq_quotes ADD CONSTRAINT fk_rfq_quotes_vendor_profile_id FOREIGN KEY (vendor_profile_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.rfqs ADD CONSTRAINT fk_rfqs_created_by FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.rfqs ADD CONSTRAINT fk_rfqs_org_id FOREIGN KEY (org_id) REFERENCES public.organisations(id) ON DELETE CASCADE;
ALTER TABLE public.rfqs ADD CONSTRAINT fk_rfqs_project_id FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;
ALTER TABLE public.site_logs ADD CONSTRAINT fk_site_logs_created_by FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.site_logs ADD CONSTRAINT fk_site_logs_org_id FOREIGN KEY (org_id) REFERENCES public.organisations(id) ON DELETE CASCADE;
ALTER TABLE public.site_logs ADD CONSTRAINT fk_site_logs_project_id FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;
ALTER TABLE public.site_visits ADD CONSTRAINT fk_site_visits_created_by FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.site_visits ADD CONSTRAINT fk_site_visits_org_id FOREIGN KEY (org_id) REFERENCES public.organisations(id) ON DELETE CASCADE;
ALTER TABLE public.site_visits ADD CONSTRAINT fk_site_visits_project_id FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;
ALTER TABLE public.submittals ADD CONSTRAINT fk_submittals_org_id FOREIGN KEY (org_id) REFERENCES public.organisations(id) ON DELETE CASCADE;
ALTER TABLE public.submittals ADD CONSTRAINT fk_submittals_project_id FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;
ALTER TABLE public.submittals ADD CONSTRAINT fk_submittals_reviewed_by FOREIGN KEY (reviewed_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.submittals ADD CONSTRAINT fk_submittals_submitted_by FOREIGN KEY (submitted_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.tenders ADD CONSTRAINT fk_tenders_org_id FOREIGN KEY (org_id) REFERENCES public.organisations(id) ON DELETE CASCADE;
ALTER TABLE public.tenders ADD CONSTRAINT fk_tenders_project_id FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;
ALTER TABLE public.transmittals ADD CONSTRAINT fk_transmittals_created_by FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.transmittals ADD CONSTRAINT fk_transmittals_org_id FOREIGN KEY (org_id) REFERENCES public.organisations(id) ON DELETE CASCADE;
ALTER TABLE public.transmittals ADD CONSTRAINT fk_transmittals_project_id FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;
ALTER TABLE public.vendor_catalog_imports ADD CONSTRAINT fk_vendor_catalog_imports_vendor_signup_id FOREIGN KEY (vendor_signup_id) REFERENCES public.vendor_signups(id) ON DELETE SET NULL;
ALTER TABLE public.vendor_catalog_items ADD CONSTRAINT fk_vendor_catalog_items_import_id FOREIGN KEY (import_id) REFERENCES public.vendor_catalog_imports(id) ON DELETE SET NULL;
ALTER TABLE public.vendor_recommendations ADD CONSTRAINT fk_vendor_recommendations_project_id FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;
ALTER TABLE public.vendor_recommendations ADD CONSTRAINT fk_vendor_recommendations_recommended_by FOREIGN KEY (recommended_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

DO $$
DECLARE t text; expr text; has_col boolean;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    IF t IN ('contractors','contractor_reviews','vendor_catalog_items') THEN
      EXECUTE format('GRANT SELECT ON public.%I TO anon', t);
      EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO anon, authenticated USING (true)', t || '_public_read', t);
    END IF;
    IF t IN ('waitlist','vendor_signups','contractor_signups') THEN
      EXECUTE format('GRANT INSERT ON public.%I TO anon', t);
      EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO anon, authenticated WITH CHECK (true)', t || '_anon_insert', t);
      EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (true)', t || '_auth_read', t);
      CONTINUE;
    END IF;

    IF t = 'profiles' THEN
      expr := 'auth_id = auth.uid() OR public.is_org_member(org_id)';
      EXECUTE 'CREATE POLICY profiles_read ON public.profiles FOR SELECT TO authenticated USING (' || expr || ')';
      EXECUTE 'CREATE POLICY profiles_write ON public.profiles FOR ALL TO authenticated USING (auth_id = auth.uid()) WITH CHECK (auth_id = auth.uid())';
      CONTINUE;
    ELSIF t = 'organisations' THEN
      expr := 'public.is_org_member(id) OR owner_id = public.my_profile_id()';
    ELSE
      SELECT EXISTS (SELECT 1 FROM information_schema.columns c WHERE c.table_schema='public' AND c.table_name=t AND c.column_name='org_id') INTO has_col;
      IF has_col THEN
        expr := 'public.is_org_member(org_id)';
      ELSE
        SELECT EXISTS (SELECT 1 FROM information_schema.columns c WHERE c.table_schema='public' AND c.table_name=t AND c.column_name='project_id') INTO has_col;
        IF has_col THEN
          expr := 'public.can_access_project(project_id)';
        ELSE
          SELECT EXISTS (SELECT 1 FROM information_schema.columns c WHERE c.table_schema='public' AND c.table_name=t AND c.column_name='profile_id') INTO has_col;
          IF has_col THEN
            expr := 'profile_id = public.my_profile_id()';
          ELSE
            SELECT EXISTS (SELECT 1 FROM information_schema.columns c WHERE c.table_schema='public' AND c.table_name=t AND c.column_name='user_id') INTO has_col;
            IF has_col THEN
              expr := 'user_id = public.my_profile_id()';
            ELSE
              expr := 'auth.uid() IS NOT NULL';
            END IF;
          END IF;
        END IF;
      END IF;
    END IF;
    EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (%s) WITH CHECK (%s)', t || '_access', t, expr, expr);
  END LOOP;
END $$;

CREATE OR REPLACE VIEW public.users WITH (security_invoker = true) AS
  SELECT id, auth_id, org_id, email, full_name, avatar_url, phone, role, plan, discipline,
         ai_add_on, onboarded_at, created_at, notify_email, notify_rfi, notify_bids, notify_approvals, notify_meetings
  FROM public.profiles;
GRANT SELECT ON public.users TO authenticated;
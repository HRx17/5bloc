-- Extensions to base schema.sql for multi-role production readiness
-- Run after schema.sql

-- Onboarding completion
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarded_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS discipline TEXT; -- consultant discipline

-- Client portal module toggles
CREATE TABLE IF NOT EXISTS client_portal_settings (
  project_id       UUID PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
  show_overview    BOOLEAN DEFAULT TRUE,
  show_drawings    BOOLEAN DEFAULT TRUE,
  show_documents   BOOLEAN DEFAULT TRUE,
  show_payments    BOOLEAN DEFAULT TRUE,
  show_approvals   BOOLEAN DEFAULT TRUE,
  show_site        BOOLEAN DEFAULT TRUE,
  show_questions   BOOLEAN DEFAULT TRUE,
  welcome_note     TEXT,
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE client_portal_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "portal_settings_org" ON client_portal_settings FOR ALL USING (
  project_id IN (
    SELECT id FROM projects WHERE org_id = current_user_org_id()
  )
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  body        TEXT,
  type        TEXT NOT NULL DEFAULT 'general',
  href        TEXT,
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_own" ON notifications FOR ALL
  USING (user_id = current_user_id());

-- Notification prefs on users
ALTER TABLE users ADD COLUMN IF NOT EXISTS notify_email BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS notify_rfi BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS notify_bids BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS notify_approvals BOOLEAN DEFAULT TRUE;

-- Portal questions (client asks without auth user)
CREATE TABLE IF NOT EXISTS portal_questions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  asker_name  TEXT,
  asker_email TEXT,
  question    TEXT NOT NULL,
  answered_at TIMESTAMPTZ,
  answer      TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE portal_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "portal_questions_org" ON portal_questions FOR ALL USING (
  project_id IN (SELECT id FROM projects WHERE org_id = current_user_org_id())
);

-- Vendor recommendations from builders
CREATE TABLE IF NOT EXISTS vendor_recommendations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  recommended_by  UUID REFERENCES users(id),
  vendor_name     TEXT NOT NULL,
  specialization  TEXT,
  email           TEXT,
  note            TEXT,
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending','invited','dismissed')),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE vendor_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vendor_recs_access" ON vendor_recommendations FOR ALL USING (
  project_id IN (
    SELECT project_id FROM project_members
    WHERE user_id = current_user_id() AND accepted_at IS NOT NULL
  )
  OR project_id IN (SELECT id FROM projects WHERE org_id = current_user_org_id())
);

-- Additional RLS policies
CREATE POLICY "orgs_member_read" ON organisations FOR SELECT USING (
  id = current_user_org_id() OR owner_id = current_user_id()
);
CREATE POLICY "orgs_owner_write" ON organisations FOR ALL USING (
  owner_id = current_user_id()
);

CREATE POLICY "clients_org" ON clients FOR ALL USING (org_id = current_user_org_id());

CREATE POLICY "members_access" ON project_members FOR ALL USING (
  project_id IN (SELECT id FROM projects WHERE org_id = current_user_org_id())
  OR user_id = current_user_id()
  OR project_id IN (
    SELECT project_id FROM project_members pm
    WHERE pm.user_id = current_user_id() AND pm.accepted_at IS NOT NULL
  )
);

CREATE POLICY "milestones_access" ON phase_milestones FOR ALL USING (
  project_id IN (SELECT id FROM projects WHERE org_id = current_user_org_id())
  OR project_id IN (
    SELECT project_id FROM project_members
    WHERE user_id = current_user_id() AND accepted_at IS NOT NULL
  )
);

CREATE POLICY "rfis_access" ON rfis FOR ALL USING (
  project_id IN (SELECT id FROM projects WHERE org_id = current_user_org_id())
  OR project_id IN (
    SELECT project_id FROM project_members
    WHERE user_id = current_user_id() AND accepted_at IS NOT NULL
  )
);

CREATE POLICY "submittals_access" ON submittals FOR ALL USING (
  project_id IN (SELECT id FROM projects WHERE org_id = current_user_org_id())
  OR project_id IN (
    SELECT project_id FROM project_members
    WHERE user_id = current_user_id() AND accepted_at IS NOT NULL
  )
);

CREATE POLICY "tenders_read" ON tenders FOR SELECT USING (
  visibility = 'public' OR org_id = current_user_org_id()
  OR project_id IN (
    SELECT project_id FROM project_members
    WHERE user_id = current_user_id() AND accepted_at IS NOT NULL
  )
);
CREATE POLICY "tenders_write" ON tenders FOR ALL USING (org_id = current_user_org_id());

CREATE POLICY "bids_read" ON bids FOR SELECT USING (
  contractor_id IN (SELECT id FROM contractors WHERE user_id = current_user_id())
  OR tender_id IN (SELECT id FROM tenders WHERE org_id = current_user_org_id())
);
CREATE POLICY "bids_write" ON bids FOR INSERT WITH CHECK (
  contractor_id IN (SELECT id FROM contractors WHERE user_id = current_user_id())
);
CREATE POLICY "bids_update_org" ON bids FOR UPDATE USING (
  tender_id IN (SELECT id FROM tenders WHERE org_id = current_user_org_id())
  OR contractor_id IN (SELECT id FROM contractors WHERE user_id = current_user_id())
);

CREATE POLICY "reviews_read" ON contractor_reviews FOR SELECT USING (true);
CREATE POLICY "reviews_write" ON contractor_reviews FOR INSERT WITH CHECK (
  reviewer_id = current_user_id()
);

CREATE POLICY "ai_org" ON ai_estimates FOR ALL USING (org_id = current_user_org_id());
CREATE POLICY "site_access" ON site_visits FOR ALL USING (
  project_id IN (SELECT id FROM projects WHERE org_id = current_user_org_id())
  OR project_id IN (
    SELECT project_id FROM project_members
    WHERE user_id = current_user_id() AND accepted_at IS NOT NULL
  )
);

CREATE POLICY "doc_versions_access" ON document_versions FOR ALL USING (
  document_id IN (SELECT id FROM documents WHERE org_id = current_user_org_id()
    OR project_id IN (
      SELECT project_id FROM project_members
      WHERE user_id = current_user_id() AND accepted_at IS NOT NULL
    ))
);

CREATE POLICY "file_chunks_auth" ON file_chunks FOR ALL USING (auth.uid() IS NOT NULL);

-- Unique membership per user/project when user is linked
CREATE UNIQUE INDEX IF NOT EXISTS idx_pm_project_user
  ON project_members(project_id, user_id)
  WHERE user_id IS NOT NULL;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  chosen_role TEXT;
BEGIN
  chosen_role := COALESCE(NEW.raw_user_meta_data->>'role', 'architect');
  IF chosen_role NOT IN ('architect','contractor','builder','consultant','client') THEN
    chosen_role := 'architect';
  END IF;

  INSERT INTO public.users (auth_id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    chosen_role
  )
  ON CONFLICT (auth_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Public portal read via security definer (token-based, no auth)
CREATE OR REPLACE FUNCTION get_portal_project(p_token TEXT)
RETURNS JSON AS $$
DECLARE result JSON;
BEGIN
  SELECT json_build_object(
    'project', row_to_json(p),
    'milestones', COALESCE((
      SELECT json_agg(m ORDER BY m.phase)
      FROM phase_milestones m WHERE m.project_id = p.id
    ), '[]'::json),
    'documents', COALESCE((
      SELECT json_agg(d)
      FROM documents d
      WHERE d.project_id = p.id AND d.shared_with_client = TRUE
    ), '[]'::json),
    'settings', (
      SELECT row_to_json(s) FROM client_portal_settings s WHERE s.project_id = p.id
    ),
    'org_name', (SELECT name FROM organisations o WHERE o.id = p.org_id)
  )
  INTO result
  FROM projects p
  WHERE p.portal_token = p_token AND p.portal_enabled = TRUE;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

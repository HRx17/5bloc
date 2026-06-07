-- 5Bloc Database Schema (Supabase PostgreSQL)
-- Region: ap-south-1 Mumbai

-- EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ENUMS
CREATE TYPE project_phase AS ENUM (
  'pre_design','schematic_design','design_development',
  'construction_docs','bidding','permits','construction_admin','complete'
);
CREATE TYPE project_status  AS ENUM ('active','on_hold','complete','archived');
CREATE TYPE rfi_status      AS ENUM ('open','in_review','answered','closed');
CREATE TYPE submittal_status AS ENUM ('pending','under_review','approved','rejected','revise_resubmit');
CREATE TYPE invoice_status  AS ENUM ('draft','sent','paid','overdue','cancelled');

-- ORGANISATIONS
CREATE TABLE organisations (
  id                       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                     TEXT NOT NULL,
  type                     TEXT CHECK (type IN ('residential','commercial','both','firm')),
  owner_id                 UUID,
  plan                     TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free','solo','team')),
  seats_max                INT DEFAULT 1,
  gst_number               TEXT,
  gst_state_code           CHAR(2),
  logo_url                 TEXT,
  city                     TEXT,
  state                    TEXT,
  address                  TEXT,
  phone                    TEXT,
  razorpay_subscription_id TEXT,
  stripe_subscription_id   TEXT,
  ai_calls_today           INT DEFAULT 0,
  ai_calls_reset_at        DATE DEFAULT CURRENT_DATE,
  created_at               TIMESTAMPTZ DEFAULT NOW()
);

-- USERS
CREATE TABLE users (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id      UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email        TEXT UNIQUE NOT NULL,
  full_name    TEXT,
  avatar_url   TEXT,
  phone        TEXT,
  role         TEXT NOT NULL DEFAULT 'architect'
                 CHECK (role IN ('architect','contractor','builder','consultant','client')),
  org_id       UUID REFERENCES organisations(id),
  plan         TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free','solo','team')),
  ai_add_on    BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE organisations
  ADD CONSTRAINT fk_org_owner FOREIGN KEY (owner_id) REFERENCES users(id);

-- CLIENTS
CREATE TABLE clients (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id         UUID NOT NULL REFERENCES organisations(id),
  full_name      TEXT NOT NULL,
  email          TEXT,
  phone          TEXT,
  company        TEXT,
  city           TEXT,
  state          TEXT,
  notes          TEXT,
  pipeline_stage TEXT DEFAULT 'prospect'
                   CHECK (pipeline_stage IN ('prospect','briefing','proposal','won','lost')),
  total_value    NUMERIC DEFAULT 0,
  last_contact   DATE,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_clients_org ON clients(org_id);

-- PROJECTS
CREATE TABLE projects (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id              UUID NOT NULL REFERENCES organisations(id),
  client_id           UUID REFERENCES clients(id),
  name                TEXT NOT NULL,
  type                TEXT CHECK (type IN ('residential','commercial','institutional','industrial','mixed','interior','landscape')),
  phase               project_phase NOT NULL DEFAULT 'pre_design',
  status              project_status NOT NULL DEFAULT 'active',
  city                TEXT,
  state               TEXT,
  address             TEXT,
  total_sqft          NUMERIC,
  floors              INT,
  spec_level          TEXT CHECK (spec_level IN ('standard','premium','luxury')),
  construction_cost   NUMERIC,
  architect_fee       NUMERIC,
  architect_fee_pct   NUMERIC,
  start_date          DATE,
  estimated_end       DATE,
  rera_number         TEXT,
  is_rera_registered  BOOLEAN DEFAULT FALSE,
  rera_state          TEXT,
  brief               TEXT,
  portal_enabled      BOOLEAN DEFAULT FALSE,
  portal_token        TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  created_by          UUID REFERENCES users(id),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_projects_org    ON projects(org_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_phase  ON projects(phase);

-- PROJECT MEMBERS
CREATE TABLE project_members (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id     UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id        UUID REFERENCES users(id),
  invite_email   TEXT,
  role           TEXT NOT NULL CHECK (role IN ('architect','contractor','builder','consultant','client')),
  invited_by     UUID REFERENCES users(id),
  accepted_at    TIMESTAMPTZ,
  invite_token   TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  invite_expires TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
  can_upload     BOOLEAN DEFAULT TRUE,
  can_comment    BOOLEAN DEFAULT TRUE,
  can_approve    BOOLEAN DEFAULT FALSE,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_pm_project ON project_members(project_id);
CREATE INDEX idx_pm_user    ON project_members(user_id);

-- PHASE MILESTONES
CREATE TABLE phase_milestones (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id       UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  phase            project_phase NOT NULL,
  milestone_date   DATE,
  completion_pct   INT DEFAULT 0 CHECK (completion_pct BETWEEN 0 AND 100),
  fee_amount       NUMERIC,
  fee_paid         BOOLEAN DEFAULT FALSE,
  notes            TEXT,
  rera_certified   BOOLEAN DEFAULT FALSE,
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, phase)
);
CREATE INDEX idx_milestones_project ON phase_milestones(project_id);

-- DOCUMENTS
CREATE TABLE documents (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id         UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  org_id             UUID NOT NULL REFERENCES organisations(id),
  name               TEXT NOT NULL,
  original_filename  TEXT,
  extension          TEXT,
  size_bytes         BIGINT,
  version            INT NOT NULL DEFAULT 1,
  phase              project_phase,
  folder             TEXT DEFAULT 'general',
  status             TEXT DEFAULT 'active' CHECK (status IN ('active','superseded','archived')),
  r2_key             TEXT,
  thumbnail_url      TEXT,
  version_manifest   JSONB,
  uploaded_by        UUID REFERENCES users(id),
  approved_by        UUID REFERENCES users(id),
  approval_status    TEXT DEFAULT 'pending'
                       CHECK (approval_status IN ('pending','approved','rejected','revision_requested')),
  approval_note      TEXT,
  shared_with_client BOOLEAN DEFAULT FALSE,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_docs_project ON documents(project_id);
CREATE INDEX idx_docs_phase   ON documents(phase);
CREATE INDEX idx_docs_folder  ON documents(folder);

-- DOCUMENT VERSIONS
CREATE TABLE document_versions (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id      UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  version          INT NOT NULL,
  r2_key           TEXT,
  version_manifest JSONB,
  size_bytes       BIGINT,
  change_note      TEXT,
  uploaded_by      UUID REFERENCES users(id),
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- FILE CHUNKS (content-addressed deduplication)
CREATE TABLE file_chunks (
  hash       TEXT PRIMARY KEY,
  r2_key     TEXT NOT NULL,
  size_bytes INT,
  ref_count  INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RFIs
CREATE TABLE rfis (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  rfi_number          INT NOT NULL,
  title               TEXT NOT NULL,
  description         TEXT,
  drawing_ref         TEXT,
  attachment_url      TEXT,
  status              rfi_status NOT NULL DEFAULT 'open',
  raised_by           UUID REFERENCES users(id),
  assigned_to         UUID REFERENCES users(id),
  due_date            DATE,
  response            TEXT,
  ai_draft_response   TEXT,
  responded_by        UUID REFERENCES users(id),
  responded_at        TIMESTAMPTZ,
  is_scope_change     BOOLEAN DEFAULT FALSE,
  scope_change_amount NUMERIC,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, rfi_number)
);
CREATE INDEX idx_rfis_project ON rfis(project_id);
CREATE INDEX idx_rfis_status  ON rfis(status);

-- SUBMITTALS
CREATE TABLE submittals (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id       UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  submittal_number INT NOT NULL,
  title            TEXT NOT NULL,
  description      TEXT,
  spec_section     TEXT,
  contractor_id    UUID REFERENCES users(id),
  file_url         TEXT,
  status           submittal_status NOT NULL DEFAULT 'pending',
  reviewed_by      UUID REFERENCES users(id),
  review_note      TEXT,
  reviewed_at      TIMESTAMPTZ,
  due_date         DATE,
  revision         INT DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, submittal_number)
);

-- CONTRACTORS
CREATE TABLE contractors (
  id                       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                  UUID UNIQUE REFERENCES users(id),
  company_name             TEXT NOT NULL,
  bio                      TEXT,
  specializations          TEXT[] NOT NULL DEFAULT '{}',
  service_cities           TEXT[] NOT NULL DEFAULT '{}',
  service_states           TEXT[] DEFAULT '{}',
  team_size                INT,
  years_experience         INT,
  website                  TEXT,
  gst_number               TEXT,
  verified                 BOOLEAN DEFAULT FALSE,
  badge_active             BOOLEAN DEFAULT FALSE,
  rating                   NUMERIC(3,2) DEFAULT 0,
  reviews_count            INT DEFAULT 0,
  jobs_completed           INT DEFAULT 0,
  portfolio_photos         TEXT[] DEFAULT '{}',
  razorpay_subscription_id TEXT,
  created_at               TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_contractors_cities ON contractors USING GIN(service_cities);
CREATE INDEX idx_contractors_specs  ON contractors USING GIN(specializations);
CREATE INDEX idx_contractors_name   ON contractors USING GIN(company_name gin_trgm_ops);
CREATE INDEX idx_contractors_rating ON contractors(rating DESC);

-- CONTRACTOR REVIEWS
CREATE TABLE contractor_reviews (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contractor_id UUID NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
  reviewer_id   UUID NOT NULL REFERENCES users(id),
  project_id    UUID REFERENCES projects(id),
  rating        INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text   TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(contractor_id, reviewer_id, project_id)
);

-- TENDERS
CREATE TABLE tenders (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  org_id          UUID NOT NULL REFERENCES organisations(id),
  title           TEXT NOT NULL,
  scope           TEXT,
  trade_type      TEXT,
  budget_min      NUMERIC,
  budget_max      NUMERIC,
  timeline_weeks  INT,
  deadline        DATE,
  visibility      TEXT DEFAULT 'public' CHECK (visibility IN ('public','private')),
  status          TEXT DEFAULT 'open' CHECK (status IN ('open','evaluating','awarded','cancelled')),
  awarded_bid_id  UUID,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- BIDS
CREATE TABLE bids (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tender_id           UUID NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
  contractor_id       UUID NOT NULL REFERENCES contractors(id),
  amount              NUMERIC NOT NULL,
  timeline_weeks      INT,
  methodology         TEXT,
  boq_url             TEXT,
  status              TEXT DEFAULT 'submitted'
                        CHECK (status IN ('submitted','shortlisted','accepted','rejected')),
  rejection_note      TEXT,
  razorpay_payment_id TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- INVOICES
CREATE TABLE invoices (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id                UUID NOT NULL REFERENCES organisations(id),
  project_id            UUID REFERENCES projects(id),
  client_id             UUID REFERENCES clients(id),
  invoice_number        TEXT UNIQUE NOT NULL,
  phase                 project_phase,
  line_items            JSONB NOT NULL DEFAULT '[]',
  subtotal              NUMERIC NOT NULL,
  is_interstate         BOOLEAN DEFAULT FALSE,
  gst_rate              NUMERIC DEFAULT 18,
  cgst_amount           NUMERIC DEFAULT 0,
  sgst_amount           NUMERIC DEFAULT 0,
  igst_amount           NUMERIC DEFAULT 0,
  total                 NUMERIC NOT NULL,
  status                invoice_status DEFAULT 'draft',
  due_date              DATE,
  paid_at               TIMESTAMPTZ,
  razorpay_payment_id   TEXT,
  razorpay_payment_link TEXT,
  stripe_payment_intent TEXT,
  notes                 TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_invoices_org    ON invoices(org_id);
CREATE INDEX idx_invoices_status ON invoices(status);

-- Invoice auto-number function
CREATE OR REPLACE FUNCTION next_invoice_number(p_org_id UUID)
RETURNS TEXT AS $$
DECLARE next_num INT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 5) AS INT)), 0) + 1
  INTO next_num FROM invoices WHERE org_id = p_org_id;
  RETURN 'INV-' || LPAD(next_num::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;

-- AI ESTIMATES
CREATE TABLE ai_estimates (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id      UUID REFERENCES projects(id),
  org_id          UUID REFERENCES organisations(id),
  user_id         UUID REFERENCES users(id),
  project_type    TEXT,
  city            TEXT,
  total_sqft      NUMERIC,
  floors          INT,
  spec_level      TEXT,
  estimated_total NUMERIC,
  breakdown       JSONB,
  actual_total    NUMERIC,
  accuracy_delta  NUMERIC,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- SITE VISITS
CREATE TABLE site_visits (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  visited_by  UUID REFERENCES users(id),
  visit_date  DATE NOT NULL,
  observations TEXT,
  issues_count INT DEFAULT 0,
  photos      TEXT[] DEFAULT '{}',
  action_items JSONB DEFAULT '[]',
  gps_lat     NUMERIC,
  gps_lng     NUMERIC,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ACTIVITY LOG
CREATE TABLE activity_log (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id  UUID REFERENCES projects(id) ON DELETE CASCADE,
  org_id      UUID REFERENCES organisations(id),
  user_id     UUID REFERENCES users(id),
  action      TEXT NOT NULL,
  entity_type TEXT,
  entity_id   UUID,
  entity_name TEXT,
  metadata    JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_activity_project ON activity_log(project_id);
CREATE INDEX idx_activity_org     ON activity_log(org_id);
CREATE INDEX idx_activity_created ON activity_log(created_at DESC);

-- ENABLE RLS ON ALL TABLES
ALTER TABLE users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE organisations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects           ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients            ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members    ENABLE ROW LEVEL SECURITY;
ALTER TABLE phase_milestones   ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents          ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_versions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_chunks        ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfis               ENABLE ROW LEVEL SECURITY;
ALTER TABLE submittals         ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractors        ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenders            ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids               ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices           ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_estimates       ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_visits        ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log       ENABLE ROW LEVEL SECURITY;

-- RLS HELPER FUNCTIONS
CREATE OR REPLACE FUNCTION current_user_org_id() RETURNS UUID AS $$
  SELECT org_id FROM users WHERE auth_id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER;

CREATE OR REPLACE FUNCTION current_user_id() RETURNS UUID AS $$
  SELECT id FROM users WHERE auth_id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER;

-- KEY RLS POLICIES
CREATE POLICY "projects_access" ON projects FOR ALL USING (
  org_id = current_user_org_id()
  OR id IN (SELECT project_id FROM project_members
            WHERE user_id = current_user_id() AND accepted_at IS NOT NULL)
);

CREATE POLICY "docs_access" ON documents FOR ALL USING (
  org_id = current_user_org_id()
  OR project_id IN (SELECT project_id FROM project_members
                    WHERE user_id = current_user_id() AND accepted_at IS NOT NULL)
);

CREATE POLICY "contractors_public_read" ON contractors FOR SELECT USING (true);
CREATE POLICY "contractors_self_write"  ON contractors FOR ALL
  USING (user_id = current_user_id());

CREATE POLICY "invoices_org" ON invoices FOR ALL USING (org_id = current_user_org_id());
CREATE POLICY "activity_org" ON activity_log FOR ALL USING (org_id = current_user_org_id());

CREATE POLICY "users_read"  ON users FOR SELECT
  USING (id = current_user_id() OR org_id = current_user_org_id());
CREATE POLICY "users_write" ON users FOR UPDATE
  USING (id = current_user_id());

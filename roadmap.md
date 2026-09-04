# 5Bloc port roadmap

Goal: bring the existing 5Bloc codebase (previously Next.js + Electron) into this project's
framework, keeping the same design, content and behaviour.

## Done — stage 1: public site
- Ported the design system (globals.css + landing.css, all tokens, dark variant).
- Ported marketing components: HomePage, HowItWorksFlow, InteractivePrototype, WaitlistForm,
  ComparePage, LegalDocShell, PartnerSignupChrome, LogoMark, lib/site/marketing.
- Routes live: `/`, `/about`, `/privacy`, `/terms`, `/changelog`, `/vs/5bloc-vs-procore`,
  `/vs/5bloc-vs-fieldwire`.
- Compatibility shims so ported files need no rewrites: `src/compat/next-link.tsx`,
  `src/lib/analytics/stub.ts`, `src/lib/supabase/client.ts` (temporary no-op data client).
- Fonts, manifest, theme bootstrap moved into the root layout; per-page metadata via `head()`.

## Stage 2: backend (in progress)
- Done: Lovable Cloud enabled. The repo's `supabase/schema.sql` + `migrations/*` were stale
  (referenced `profiles`, `issues`, `is_org_member` etc. that they never create), so the schema
  was rebuilt from `types/database.ts` (the generated snapshot of the live database):
  56 tables, foreign keys, org/project-scoped RLS, grants, `users` view, helper functions
  (`my_profile_id`, `my_org_id`, `is_org_member`, `is_org_admin`, `can_access_project`).
- Done: `src/lib/supabase/client.ts` now re-exports the real generated browser client;
  public waitlist / vendor / contractor signup inserts verified working.
- Todo: RPCs not in the repo must be re-implemented when the pages that call them are ported:
  `get_portal_payload`, `submit_portal_question`, `approve_portal_document`,
  `get_portal_document_key`, `get_portal_project`, `accept_org_invite`, `get_invite_by_token`,
  `get_org_invite_by_token`, `create_conversation`, `is_conversation_member`,
  `get_or_create_project_channel`, `list_project_channel_messages`,
  `post_project_channel_message`, `get_my_messaging_profile`, `search_messaging_profiles`,
  `next_invoice_number`.
- Todo: profile creation on signup (no auth triggers here — create the profile row from the
  signup flow), storage bucket for documents, seed contractor listings.
- Todo: port `app/api/*` route handlers to server functions / server routes
  (`/api/public/*` for webhooks: Stripe, Razorpay, cron).
- Secrets needed: Stripe, Razorpay, Resend, Anthropic, Upstash, R2/S3, Autodesk, Google OAuth.

## Stage 3: authenticated app
- Auth pages: login, signup, forgot-password, onboarding, accept-invite, auth callback.
- App shell (Sidebar, TopNav, notifications, toast/confirm/prompt/messages providers).
- App pages: dashboard, projects (+ per-project tabs), clients, marketplace, invoices,
  documents, messages, calendar, catalog, CAD, AI tools, integrations, settings,
  role dashboards (builder, contractor, consultant, client), admin.
- Client portal + payment link pages (`/portal/:token`, `/pay/:token`).

## Out of scope / cannot port
- Electron desktop wrapper (`electron/`) — desktop builds stay in the GitHub repo.
- Service worker / offline PWA behaviour needs rebuilding on this framework.

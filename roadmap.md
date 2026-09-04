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

## Stage 2: backend
- Enable Lovable Cloud, apply `supabase/schema.sql` + `supabase/migrations/*` as migrations.
- Replace the placeholder data client with the real generated client (auth + RLS).
- Port `app/api/*` route handlers to server functions / server routes
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

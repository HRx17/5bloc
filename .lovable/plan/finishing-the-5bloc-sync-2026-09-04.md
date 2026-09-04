# Finishing the 5Bloc sync

## Short answer

No — only the public marketing site is in so far. That's 7 of 62 pages from the repo.

What's already here:
- Home, About, Privacy, Terms, Changelog, and the two comparison pages
- The full design system (colours, fonts, dark mode) and shared marketing pieces

What's still in the repo and not here yet:
- 55 remaining pages: login/signup/onboarding, the whole logged-in app (dashboard,
  projects, clients, marketplace, invoices, documents, messages, calendar, catalog,
  CAD, AI tools, integrations, settings, role dashboards, admin), and the client
  portal + payment pages
- 100 backend endpoints (payments, email, AI, file storage, integrations, webhooks)
- 20 database migrations — no database is connected to this project yet
- 37 component groups behind those pages (app shell, modals, messaging, calendar, CAD,
  marketplace, payments, and more)
- The desktop (Electron) wrapper, which can't run here and stays in the repo

## Plan to finish it

### Stage 2 — turn on the database and accounts
1. Enable the built-in Cloud backend.
2. Apply the 20 existing migrations as-is so the data structure matches the repo.
3. Swap the temporary placeholder data client for the real one, so reads and writes hit
   the real database with the repo's existing access rules.
4. Bring over login, signup, forgot password, onboarding, accept invite, and the auth
   callback, and gate the app pages behind sign-in.

Result: real accounts, real data, waitlist and signup forms actually save.

### Stage 3 — the logged-in app
5. Port the app shell first (sidebar, top nav, notifications, dialogs) so every page
   lands in the right frame.
6. Port pages in dependency order: dashboard and projects, then clients, documents,
   messages, calendar, invoices, marketplace and catalog, then settings, integrations,
   CAD, AI tools, role dashboards, admin.
7. Move the matching backend endpoints across alongside each area, rather than all at once.

### Stage 4 — external services and public endpoints
8. Client portal and payment link pages.
9. Webhook and scheduled endpoints (payments, email events, cron) on public URLs with
   signature checks.
10. Collect the keys these need: Stripe, Razorpay, Resend, Anthropic, Upstash, file
    storage, Autodesk, Google sign-in. Anything without a key gets stubbed and flagged.

### Stage 5 — check and finish
11. Walk every page signed in and signed out, fix what breaks.
12. Report what moved, what was stubbed for missing keys, and what stayed in the repo.

## Technical notes

- Framework differences handled by shims already in place (`src/compat/next-link.tsx`,
  analytics stub, temporary data client) so ported files need minimal rewriting.
- Next.js route handlers become server functions; webhooks/cron become server routes
  under `/api/public/*` with in-handler verification.
- `next/headers`, `next/og`, and middleware-based auth have no direct equivalent and get
  rewritten per call site.
- Service worker / offline behaviour is not carried over and would be a separate pass.

## Scope note

Stage 2 alone is a large chunk of work; Stages 3–4 are considerably larger. Best done as
separate runs rather than one pass, so each part can be checked as it lands.

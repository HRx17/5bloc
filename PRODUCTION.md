# 5Bloc production guide

Ops checklist for deploying and verifying a production environment.

## Required environment variables

Copy from [`.env.example`](.env.example) and set in Vercel (or your host).

### Core (required)

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key (browser + SSR) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only service role (storage, webhooks, admin) |
| `NEXT_PUBLIC_APP_URL` | Canonical origin, e.g. `https://app.5bloc.com` |

### Strongly recommended in production

| Variable | Purpose |
|---|---|
| `RAZORPAY_WEBHOOK_SECRET` | Verify billing webhooks (do not leave unset in prod) |
| `RESEND_API_KEY` / `RESEND_FROM_EMAIL` | Transactional email |
| `ANTHROPIC_API_KEY` | AI estimate / contract scan / RFI draft |
| `CRON_SECRET` | Protects `/api/cron/meeting-reminders` (Vercel Cron sends `Authorization: Bearer $CRON_SECRET`) |

### Optional integrations

| Variable | Purpose |
|---|---|
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` / `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Checkout |
| `RAZORPAY_PLAN_*` | Plan ID mapping (solo / team / badge / ai) |
| `PAYMENT_LINK_SECRET` | Signs client invoice pay links in emails (falls back to Razorpay/Supabase secrets) |
| `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_BUCKET_NAME` / `R2_PUBLIC_URL` / `CLOUDFLARE_ACCOUNT_ID` | Cloudflare R2 file storage (else use Supabase `documents` bucket) |
| `AUTODESK_*` / `GOOGLE_*` | CAD / Drive integrations |
| `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` | Optional error reporting (`lib/observability/reportError`) — light envelope POST, no `@sentry/nextjs` |
| `NEXT_PUBLIC_POSTHOG_KEY` | Optional product analytics; loads PostHog only when set |
| `NEXT_PUBLIC_POSTHOG_HOST` | PostHog API host (default `https://us.i.posthog.com`) |

### Observability

Analytics and error reporting are **env-gated stubs**:

- **PostHog:** `components/Observability.tsx` calls `initAnalytics()` on mount. If `NEXT_PUBLIC_POSTHOG_KEY` is unset, nothing loads.
- **Sentry:** `reportError()` always `console.error`s; if `SENTRY_DSN` or `NEXT_PUBLIC_SENTRY_DSN` is set, it POSTs a minimal envelope. Prefer `NEXT_PUBLIC_SENTRY_DSN` for client boundaries (`app/error.tsx`). Do not add heavy `@sentry/nextjs` unless you intentionally adopt the full SDK later.

### Must be off / unset in production

| Variable | Notes |
|---|---|
| `NEXT_PUBLIC_ENABLE_DEMO_LOGIN` | Omit or set `false`. Passwordless demo role login is off in production unless this is explicitly `true`. |
| `ENABLE_SMOKE_ADMIN` | Leave unset so `/admin` smoke role logins stay available. Set `0` only when you are ready to hide that test window. |
| `PAYWALL_ENFORCED` / `NEXT_PUBLIC_PAYWALL_ENFORCED` | Leave unset during the test release so paid features stay free (prices shown struck). Set both to `1` for production billing. |
| `MOCK_AUTH` / `NEXT_PUBLIC_MOCK_AUTH` | Must be `0` / unset. Mock APIs are also hard-disabled when `NODE_ENV=production`. |

Never commit secrets. Never expose `SUPABASE_SERVICE_ROLE_KEY`, Razorpay secrets, or webhook secrets to the client.

## Deploy steps

### 1. Supabase

1. Create (or select) the production Supabase project.
2. Apply migrations in order from `supabase/migrations/` (CLI or SQL editor):
   ```bash
   npx supabase db push
   # or: supabase migration up
   ```
3. Confirm `get_portal_payload` exists (`20250726_get_portal_payload.sql`).
4. Confirm storage RLS on `documents` (`20250726_prod_storage_rls.sql`) — objects under `{auth.uid()}/…`.
5. In Auth → URL configuration, set Site URL to `NEXT_PUBLIC_APP_URL` and add these redirect URLs.
   The app sends users to `/api/auth/callback`, so that exact path must be allowed or confirmation
   links fail after the user clicks them:
   - `{NEXT_PUBLIC_APP_URL}/api/auth/callback`
   - `{NEXT_PUBLIC_APP_URL}/api/auth/callback?**`
6. **Confirmation emails.** After signup the app generates a confirmation link (service role) and
   sends it through Resend (`RESEND_API_KEY` + `RESEND_FROM_EMAIL`). The same path is used by
   **Resend confirmation email** on signup and login.
   If Resend is not configured, the button falls back to `supabase.auth.resend()`.
   Also point Supabase Auth SMTP at Resend (`smtp.resend.com`, port 465, user `resend`, password =
   your `RESEND_API_KEY`) so built-in Auth mail is not rate-limited.

### 2. Vercel

1. Import the repo; Framework Preset: Next.js.
2. Set all required env vars (Production + Preview as needed).
3. Deploy. Build command: `npm run build` (repo default).
4. Point the custom domain at the deployment; set `NEXT_PUBLIC_APP_URL` to that origin.
5. Set `CRON_SECRET` so Vercel can call `/api/cron/meeting-reminders` every 15 minutes (`vercel.json`). Hobby plans only allow daily crons — upgrade or trigger the route manually if reminders must be sub-daily.

### 3. Post-deploy smoke

```bash
npm run smoke
# or against a deployed URL:
# BASE_URL=https://app.5bloc.com npm run smoke
```

Also hit the aggregate health endpoint:

```bash
curl -sS https://your-domain/api/health
```

Expect HTTP **200** with `"ok": true` and `"checks.supabase": "up"`. Storage/Redis may be `"skipped"` if those keys are unset. HTTP **503** means Supabase is down.

Detailed Supabase probe (kept for ops): `/api/health/supabase`.

## Security notes

- **Webhooks:** `RAZORPAY_WEBHOOK_SECRET` / `STRIPE_WEBHOOK_SECRET` are required — missing secret returns **503**; invalid signature returns **401**. No unsigned processing.
- **Demo mode:** Disabled whenever `NODE_ENV=production` (even if `NEXT_PUBLIC_DEMO_MODE=true`).
- **Email API:** `/api/send-email` requires a logged-in user and is rate-limited (30/day).
- **Public POSTs:** Waitlist, partner signup, and portal questions are rate-limited.
- **Service role:** Server-only. Used for signed downloads after DB RLS authorizes access (teammates + portal).
- **Portal:** Tokenized URLs + `get_portal_payload` (SECURITY DEFINER). `/portal` is disallowed in `robots.ts`.
- **Headers:** CSP, HSTS (prod), `X-Frame-Options: DENY`, nosniff — via `next.config.ts`.

## How to test locally

```bash
cd 5bloc-web
npm install
npm run dev
```

Open `http://localhost:3000`. Sign in (or use `/admin` smoke login if `ENABLE_SMOKE_ADMIN` is not `0`).

| What | Where | What “good” looks like |
|---|---|---|
| PDF preview | Project → Documents → open a PDF | The file renders in the lightbox, not “Loading…” forever |
| New file version | Same lightbox → **Upload new version** | Version number bumps; older versions stay restorable |
| DWG after upload | Open a `.dwg` | Autodesk viewer loads the **real** file (needs `AUTODESK_*`). Translates once, then reopens from `cad_models` |
| CAD “failed to fetch” | `/cad` or a vault DWG | Same-origin blob import + APS viewer. Restart `next dev` after CSP changes |
| RFI attachment | Project → RFIs → raise one | File uploads; click it in the slide-over to open |
| Transmittal file | Project → Transmittals | Optional attachment is stored and reopenable (run `20260821120000_transmittal_attachments.sql`) |
| Manual clearance | Project → Permits → **Add clearance** | Custom NOC appears in the list |
| Typology | New project as Commercial / Institutional, then Permits | Seed list and bye-laws match that type, not residential |
| Fee basis | Project overview → Edit specs | Percent **or** lump sum, not both |
| Client portal | Project → Portal → open the public link | Phases in design order; progress/fees show; email labelled optional |
| Confirmation email | Sign up with a new address | Resend mail arrives from 5Bloc / Resend. Click the link → `/api/auth/callback` |
| 5Bloc Studio | Projects → **Create our office project** | Internal Gantt + orientation / standup meetings appear on Calendar → Timeline |
| Team vs project invite | Settings → Team vs Project → Team | Firm invite = another architect on every job; project invite = one job, other roles |
| Messages + project | Messages → New message → pick a project | Chat shows the project name; desktop notification names it when the tab is in the background |
| Calendar timeline | Calendar → **Timeline** | Gantt of phase dates with a TODAY line |
| AI code checker | Tools → AI Building Codes, or Permits → **Run AI code check** | Findings + clearance list; works without Anthropic (local fallback). Link a project, then **Add to project Permits** |
| Invoice fee calc | Project → Invoices → Fee Calculator | Typology from the project; if a construction budget exists it quotes a typical % of that cost |

New SQL to apply on existing databases:

- `20260814120000_meeting_scheduling.sql` — meeting times, reminders, `notify_meetings` (applied live)
- `20260821120000_transmittal_attachments.sql` — `transmittals.attachment_url` (applied live)
- `20260822120000_cad_models_document_id.sql` — `cad_models.document_id` (applied live)

## Release checklist

Full manual + automated checklist: [`scripts/TEST_RELEASE_CHECKLIST.md`](scripts/TEST_RELEASE_CHECKLIST.md).

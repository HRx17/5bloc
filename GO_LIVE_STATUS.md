# Public release execution status

Source plan: [`5bloc-product-spec-v2.md`](../5bloc-product-spec-v2.md) §17 (MVP Weeks 1–4) + README go-live.

Executed in **`5bloc-web`** (canonical app).

## Done in this pass

| Area | Status |
|------|--------|
| Prod env validation (`lib/env.ts`, `instrumentation.ts`) | Done |
| `/api/health` + security headers / CSP / HSTS | Done |
| Error boundaries + branded 404 | Done |
| robots.txt / sitemap | Done |
| Mock auth forced off in `NODE_ENV=production` | Done |
| Razorpay/Stripe webhooks fail-closed without secret | Done |
| AI estimator hard paywall (`canUse` → 402) + `UpgradePrompt` | Done |
| Welcome email + RFI-created email (best-effort Resend) | Done |
| Invoice PDF HTML + Send invoice API/UI | Done |
| Google OAuth on login/signup | Done |
| Skeleton / EmptyState on clients, projects, invoices | Done |
| PostHog + light Sentry reporting (env-gated) | Done |
| PDF iframe preview when download URL available | Done |
| Migrations ported + `get_portal_payload` restored on linked Supabase | Done |
| Marketplace contractor seed (~50 profiles) | Done (idempotent migration + applied) |
| `PRODUCTION.md` + `.env.example` prod notes | Done |
| Brand match to https://5bloc.com (cream/ink/amber, DM Sans, pill CTAs) | Done |
| Marketing partner waitlists (`/list-your-business`, `/join-as-vendor`) | Done |
| Privacy / Terms light brand chrome | Done |
| Auth screens on cream canvas (login / signup / forgot / onboarding) | Done |
| Hero/partner entrance without Framer `opacity:0` SSR trap | Done |

## Split: you vs me

See **[`GO_LIVE_CHECKLIST.md`](GO_LIVE_CHECKLIST.md)** for the full list.

**You (secrets / dashboard / DNS):** service role, Resend, Razorpay (+ webhook), Anthropic, Google OAuth redirects, Vercel domain + env, enable Auth leaked-password protection in Supabase.

**Me (done / ongoing):** role product + RLS, smoke (58/58), light landing parity, honest fail-closed when keys missing, typecheck fixes, migrations.

### Latest verification (local)
- Health: Supabase `up`; storage/redis skipped (keys unset)
- Smoke: **58/58 passed**
- Gap without service role: portal document download signing incomplete

## Your ops checklist before flipping DNS (cannot be done in code alone)

1. Vercel env: `MOCK_AUTH=0`, `NEXT_PUBLIC_MOCK_AUTH=0`, Supabase URL/anon/service role, `NEXT_PUBLIC_APP_URL=https://app.5bloc.com`
2. Resend + Razorpay live keys + `RAZORPAY_WEBHOOK_SECRET` + plan IDs
3. Anthropic + Upstash Redis for AI rate limits
4. Enable Google provider in Supabase Auth + redirect URLs
5. `npm run smoke` against staging/prod
6. Point `app.5bloc.com` CNAME → Vercel
7. Optional: PostHog / Sentry DSNs
8. Supabase Auth → enable leaked password protection

## Verify locally

```bash
cd 5bloc-web
npm install
npm run dev
npx tsc --noEmit
npm run smoke
curl http://localhost:3000/api/health
```

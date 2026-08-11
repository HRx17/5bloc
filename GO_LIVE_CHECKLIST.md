# Go-live: you vs me

## You must provide (I cannot invent these)

Paste into Vercel **and** local `.env.local` (never commit secrets).

### Required for real public launch
| What | Where to get it | Why |
|------|-----------------|-----|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → `service_role` | Webhooks, portal downloads, admin server paths |
| Confirm Google OAuth | Supabase → Auth → Providers → Google + redirect URLs for your app domain | Login with Google |
| Production domain on Vercel | Vercel project → Domains (`app.5bloc.com` or chosen host) | Real traffic |
| Set `NEXT_PUBLIC_APP_URL` | Same as the live app URL | Invite/email/OAuth redirects |

### Strongly recommended (features stay degraded until set)
| What | Why if missing |
|------|----------------|
| `RESEND_API_KEY` + `RESEND_FROM_EMAIL` | Invite / welcome / invoice emails don’t send |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` / `NEXT_PUBLIC_RAZORPAY_KEY_ID` / `RAZORPAY_WEBHOOK_SECRET` + plan IDs | Checkout + plan activation fail closed |
| `ANTHROPIC_API_KEY` | AI estimate / drafts stay weak or paywalled-only |
| `UPSTASH_REDIS_REST_*` | AI rate limits are local/best-effort |

### Optional
| What | Why |
|------|-----|
| R2 keys | Prefer Cloudflare R2; otherwise Supabase Storage `documents` works if service role set |
| Stripe keys | Only if you use Stripe instead of / in addition to Razorpay |
| PostHog / Sentry DSNs | Analytics / error reporting |

**Also you:** create Razorpay webhook pointing to `https://YOUR_APP/api/webhooks/razorpay` with the secret above. Enable Resend domain DNS if using a custom from-address.

---

## I do (code / DB / verification)

- Keep role product paths, RLS, APIs honest (no fake payment success)
- Migrations, advisors, smoke script, typecheck
- Landing / theme parity with 5bloc.com
- Fail closed when secrets missing; document status in `GO_LIVE_STATUS.md` / this file
- Wire features once you paste keys (no code inventing of secrets)

---

## Minimum “private beta” vs “public paywall”

| Bar | Need from you |
|-----|----------------|
| Private beta (invite practices) | Supabase URL+anon (have), **service role**, `NEXT_PUBLIC_APP_URL`, Google OAuth redirects, Resend if you want email invites |
| Public paid launch | Everything in Required + Razorpay (+ webhook) + Resend + Anthropic recommended |

---

## Hand me next

Reply with (redact mid-key if you want): which keys you **will** set this week, and your production URL (`https://…`). I will then verify deploy env + run `BASE_URL=… npm run smoke` against it.

## Received (local)

| Item | Status |
|------|--------|
| `SUPABASE_SERVICE_ROLE_KEY` | Set in local `.env.local` (gitignored) — **also add the same value in Vercel → Project → Settings → Environment Variables (Production)** |
| `NEXT_PUBLIC_APP_URL=https://5bloc.com` | Set this **on Vercel Production**. Local `.env.local` keeps `http://localhost:3000` so smoke hits your machine. |

**Verified locally after service role:** `/api/health` → `storage: "up"`; smoke **58/58**.

**Production gap:** `https://5bloc.com/api/health` returns **404** — live Vercel is not serving this app’s API routes yet. Redeploy current `5bloc-web` to the Vercel project that owns `5bloc.com`, with the same env vars.

**Security:** If this service-role key was pasted in chat, rotate it in Supabase (Settings → API → regenerate service_role) after you finish pasting into Vercel, then update `.env.local` + Vercel with the new value.

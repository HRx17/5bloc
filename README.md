# 5Bloc Web

Next.js app for AEC project coordination + contractor marketplace. Canonical product surface for 5Bloc.

**Public release plan:** [`../5bloc-product-spec-v2.md`](../5bloc-product-spec-v2.md) §17 (MVP Weeks 1–4) + [`PRODUCTION.md`](PRODUCTION.md).

## Go live (Supabase)

1. Copy `.env.example` → `.env.local` (create if missing) and set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `MOCK_AUTH=0` and `NEXT_PUBLIC_MOCK_AUTH=0` for real Auth
2. Confirm marketplace tables exist (`contractors`, `tenders`, `bids`, `invoices` GST columns, `submittals`, `notifications`, `activity_log`). Migrations were applied to the linked Supabase project via MCP.
3. Optional: Cloudflare R2 for file bodies. If R2 is unset, uploads use Supabase Storage bucket `documents` automatically.
4. Optional: Razorpay keys for contractor badge subscriptions / payment links.
5. Optional: `SUPABASE_SERVICE_ROLE_KEY` for payment webhooks **and** client-portal downloads of files stored in Supabase Storage (R2 downloads do not need it).
6. Optional: `RESEND_API_KEY` — without it, invites still create shareable links but email is not sent.
7. `npm install && npm run dev` → sign up as **architect** or **contractor**, complete onboarding, create a project.

### Roles

| Role | Home | Notes |
|------|------|--------|
| Architect | `/dashboard` | Projects, CRM, invoices, marketplace award |
| Contractor / vendor | `/contractor` | Bids, profile, project membership after award |
| Client | `/portal/[token]` | Token portal (no full app shell) |
| Builder / consultant | `/builder`, `/consultant` | Slim shells; expand in later phases |

### Smoke test

Automated (needs `npm run dev` + live env):

```bash
# If local TLS interception breaks Supabase HTTPS:
#   $env:NODE_TLS_REJECT_UNAUTHORIZED='0'   # PowerShell
npm run smoke
```

Manual checklist:

1. Architect signup → firm onboarding → create client → create project  
2. Upload document, log RFI, edit milestones  
3. Create invoice (CGST/SGST or IGST) from `/invoices/new`  
4. Post tender from project overview → contractor bids → architect awards on Marketplace → **Bids to review**  
5. Log + approve a submittal on the project  
6. Enable portal on a project → open `/portal/[token]` → approve a shared doc / ask a question  

Seeded smoke users (password `SmokeTest123!`): `smoke.architect@5bloc.test`, `smoke.vendor@5bloc.test`, `smoke.builder@5bloc.test`, `smoke.consultant@5bloc.test`, `smoke.orgmember@5bloc.test` against project **Wadhwa Prime Plaza**.

Portal + invite lookup RPCs remain executable by `anon`; internal helpers (`can_access_project`, messaging, org role checks, etc.) are authenticated-only. Project invite accept uses `accept_project_invite` (SECURITY DEFINER) so membership updates are not blocked by RLS. Project-scoped tables allow accepted members via `can_access_project`; firm-only tables (CRM clients, invoices) stay org-scoped.

```bash
npm run dev
npx tsc --noEmit
npm run smoke
```

Do not commit `.env.local`. Add `SUPABASE_SERVICE_ROLE_KEY` for Razorpay/Stripe webhooks to activate plans.

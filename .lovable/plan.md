# Finish UI polish and release verification

## Goal
Complete the Material-style UI/UX polish across the remaining signed-in screens, fix any remaining visual or functional issues, and verify the app is release-ready.

## What is already done
- Dashboard, Projects, Clients polished to the Material-style system (`card-m`, `table-m`, `chip-m`, `stat-m`, `page-m`).
- Background agents polished: Invoices, Documents, Marketplace, Messages, Calendar, Integrations, Catalog, AI screens.
- TypeScript typecheck passes; all swept authenticated routes return HTTP 200.
- Landing page header alignment fixed.

## Remaining work

### 1. Polish screens not yet updated
- Settings page (profile, organisation, team, billing, notifications, integrations tabs).
- Builder dashboard and approvals page.
- Contractor dashboard, bids page, and profile page.
- Consultant dashboard.
- CAD Viewer page.
- Coordination page.
- Project workspace detail tabs (overview, documents, tenders, RFIs, submittals, issues, site, meetings, transmittals, permits, invoices, team, portal, estimates, expenses, members, milestones, consultant payments).

Apply the same Material-style system: `page-m`, `page-m-title`, `page-m-sub`, `card-m`, `card-m-head`, `card-m-title`, `table-m`, `chip-m`, `stat-m`, `feed-m-icon`, `search-5bloc`. Keep the existing amber/charcoal palette; do not introduce new colors.

### 2. Landing page final pass
- Verify hero, feature sections, waitlist cards, and footer are clean and aligned.
- Fix any remaining spacing, typography, or responsive issues.

### 3. Functional verification
- Run a full authenticated route sweep with screenshots.
- Check browser console for errors and React warnings on each screen.
- Verify project detail tabs load data correctly (no `undefined` project IDs).
- Confirm Settings tabs render without 500s.

### 4. Build and deployment readiness
- Confirm production build succeeds.
- Document that Vercel deployment needs the latest code pushed to GitHub `main`; the current local build is clean but the live URL is serving an old build.

## Out of scope
- Adding new features or third-party integrations.
- Changing the existing backend schema or RLS policies.
- Pushing to GitHub directly (must be done by the user via Lovable GitHub sync or local clone).

## Success criteria
- Every signed-in screen uses consistent Material-style cards, tables, chips, and stat cards.
- No console errors or 500s on swept routes.
- Typecheck and production build pass.
- User can push the polished code to GitHub and Vercel will deploy it with the existing env vars.
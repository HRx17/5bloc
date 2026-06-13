/**
 * Root middleware — re-exports the Supabase auth middleware so
 * Next.js picks it up at the correct location.
 *
 * When NEXT_PUBLIC_SUPABASE_URL / ANON_KEY are not set (demo mode)
 * the handler returns next() for every request, so the app works
 * without a real backend.  Once Supabase is configured the middleware
 * enforces authentication on all app routes.
 */
export { middleware, config } from '@/lib/supabase/middleware'

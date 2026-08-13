/**
 * Smoke role logins at /admin.
 *
 * Enabled in local development and Vercel preview by default.
 * In production builds they stay off unless ENABLE_SMOKE_ADMIN=1 is set
 * explicitly — never leave that flag on for a public launch.
 */
export function isSmokeAdminEnabled(): boolean {
  if (process.env.ENABLE_SMOKE_ADMIN === '0' || process.env.ENABLE_SMOKE_ADMIN === 'false') {
    return false
  }
  if (process.env.ENABLE_SMOKE_ADMIN === '1' || process.env.ENABLE_SMOKE_ADMIN === 'true') {
    return true
  }
  if (process.env.NODE_ENV === 'development') return true
  if (process.env.VERCEL_ENV === 'preview' || process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview') {
    return true
  }
  return false
}

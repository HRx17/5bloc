/**
 * Smoke role logins at /admin (not on public /login).
 *
 * Keep this on until the owner asks to remove it.
 * Set ENABLE_SMOKE_ADMIN=0 only when you are ready to hide /admin.
 */
export function isSmokeAdminEnabled(): boolean {
  if (process.env.ENABLE_SMOKE_ADMIN === '0' || process.env.ENABLE_SMOKE_ADMIN === 'false') {
    return false
  }
  return true
}

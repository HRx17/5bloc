/** Dev server port — keep in sync with package.json `next dev --port`. */
export const APP_DEV_ORIGIN = 'http://localhost:3001'

/** Canonical app origin for OAuth redirects (set on Vercel/production). */
export function appOrigin(): string {
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin
  }
  return process.env.NEXT_PUBLIC_APP_URL ?? APP_DEV_ORIGIN
}

/** Build the Supabase OAuth callback URL — shows loading UI, then exchanges session server-side. */
export function authCallbackUrl(nextPath = '/dashboard') {
  const next = nextPath.startsWith('/') ? nextPath : `/${nextPath}`
  const origin = typeof window !== 'undefined'
    ? (process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin)
    : (process.env.NEXT_PUBLIC_APP_URL ?? APP_DEV_ORIGIN)
  return `${origin}/auth/callback?next=${encodeURIComponent(next)}`
}

/** Redirect URIs that must be registered in Google Cloud Console. */
export const GOOGLE_OAUTH_REDIRECT_URIS = {
  supabaseAuth: 'https://rclwbqakxrvnuvhnadfa.supabase.co/auth/v1/callback',
  integrationCallback: (origin: string) => `${origin}/api/integrations/google/callback`,
} as const

/**
 * OAuth scopes for Google Workspace integration (Integrations → Connect Google).
 * Must match the OAuth consent screen in Google Cloud Console exactly.
 *
 * Drive uses drive.file (non-sensitive) — users pick files/folders via Google Picker.
 * Do NOT request drive.readonly unless you complete restricted-scope verification + CASA.
 */
export const GOOGLE_INTEGRATION_SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/calendar.readonly',
  'openid',
  'email',
] as const

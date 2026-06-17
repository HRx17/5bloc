/** Build the Supabase OAuth callback URL (PKCE code exchange on the server). */
export function authCallbackUrl(nextPath = '/dashboard') {
  if (typeof window === 'undefined') return '/api/auth/callback'
  const next = nextPath.startsWith('/') ? nextPath : `/${nextPath}`
  return `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(next)}`
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

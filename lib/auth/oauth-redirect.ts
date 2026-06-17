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

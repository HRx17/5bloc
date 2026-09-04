import { createFileRoute } from '@tanstack/react-router'
import { getAuthUserOrNull, json } from '@/lib/api/get-user.server'
import { buildGoogleAuthUrl, getGoogleRedirectUri } from '@/lib/integrations/google'
import { signOAuthState } from '@/lib/auth/oauth-state'

export const dynamic = 'force-dynamic'

const handleGET = async ({ request }: any) => {
  const auth = await getAuthUserOrNull(request)
  const user = auth?.user ?? null
  const supabase = auth?.supabase as any
  if (!user) return Response.redirect(String(new URL('/login', request.url))

  if (!process.env.GOOGLE_CLIENT_ID) {
    return Response.redirect(String(new URL('/integrations?error=google_not_configured', request.url))
  }

  try {
    const origin = request.nextUrl.origin
    const redirectUri = getGoogleRedirectUri(origin)
    const state = signOAuthState({ userId: user.id, origin })
    const authUrl = buildGoogleAuthUrl(redirectUri, state)
    return Response.redirect(authUrl)
  } catch (e) {
    console.error('Google connect error:', e)
    return Response.redirect(String(new URL('/integrations?error=google_not_configured', request.url))
  }
}

export const Route = createFileRoute('/api/integrations/google/connect')({
  server: {
    handlers: {
        GET: handleGET,
    },
  },
})

import { createFileRoute } from '@tanstack/react-router'
import { getAuthUserOrNull, json } from '@/lib/api/get-user.server'
import { buildAutodeskAuthUrl, getAutodeskRedirectUri } from '@/lib/integrations/autodesk'
import { signOAuthState } from '@/lib/auth/oauth-state'

export const dynamic = 'force-dynamic'

const handleGET = async ({ request }: any) => {
  const auth = await getAuthUserOrNull(request)
  const user = auth?.user ?? null
  const supabase = auth?.supabase as any
  if (!user) return Response.redirect(new URL('/login', request.url)))

  if (!process.env.AUTODESK_CLIENT_ID) {
    return Response.redirect(new URL('/integrations?error=autodesk_not_configured', request.url)))
  }

  try {
    const origin = request.nextUrl.origin
    const redirectUri = getAutodeskRedirectUri(origin)
    const state = signOAuthState({ userId: user.id, origin })
    const authUrl = buildAutodeskAuthUrl(redirectUri, state)
    return Response.redirect(authUrl)
  } catch (e) {
    console.error('Autodesk connect error:', e)
    return Response.redirect(new URL('/integrations?error=autodesk_not_configured', request.url)))
  }
}

export const Route = createFileRoute('/api/integrations/autodesk/connect')({
  server: {
    handlers: {
        GET: handleGET,
    },
  },
})

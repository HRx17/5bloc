import { createFileRoute } from '@tanstack/react-router'
import { getAuthUserFromQueryToken, json } from '@/lib/api/get-user.server'
import { buildAutodeskAuthUrl, getAutodeskRedirectUri } from '@/lib/integrations/autodesk'
import { signOAuthState } from '@/lib/auth/oauth-state'

export const dynamic = 'force-dynamic'

const handleGET = async ({ request }: any) => {
  const auth = await getAuthUserFromQueryToken(request)
  const user = auth?.user ?? null
  if (!user) return Response.redirect(new URL('/login', request.url))

  if (!process.env.AUTODESK_CLIENT_ID) {
    return Response.redirect(new URL('/integrations?error=autodesk_not_configured', request.url))
  }

  try {
    const origin = new URL(request.url).origin
    const redirectUri = getAutodeskRedirectUri(origin)
    const state = signOAuthState({ userId: user.id, origin })
    const authUrl = buildAutodeskAuthUrl(redirectUri, state)
    return Response.redirect(authUrl)
  } catch (e) {
    console.error('Autodesk connect error:', e)
    return Response.redirect(new URL('/integrations?error=autodesk_not_configured', request.url))
  }
}

export const Route = createFileRoute('/api/integrations/autodesk/connect')({
  server: {
    handlers: {
        GET: handleGET,
    },
  },
})

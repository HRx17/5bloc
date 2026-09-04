import { createFileRoute } from '@tanstack/react-router'
import { exchangeAutodeskCode, getAutodeskRedirectUri, getAutodeskUserProfile } from '@/lib/integrations/autodesk'
import { saveToken } from '@/lib/integrations/token-store'
import { verifyOAuthState } from '@/lib/auth/oauth-state'

export const dynamic = 'force-dynamic'

const handleGET = async ({ request }: any) => {
  const { searchParams } = req.nextUrl
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error || !code || !state) {
    return NextResponse.redirect(new URL('/integrations?error=autodesk_denied', request.url))
  }

  try {
    const { userId, origin } = verifyOAuthState(state)
    const redirectUri = getAutodeskRedirectUri(origin)

    const tokens = await exchangeAutodeskCode(code, redirectUri)
    const profile = await getAutodeskUserProfile(tokens.access_token)
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

    await saveToken(userId, {
      provider: 'autodesk',
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: expiresAt,
      provider_email: profile.emailId,
      provider_name: profile.userName,
    })

    return NextResponse.redirect(new URL('/integrations?connected=autodesk', origin))
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'unknown'
    console.error('Autodesk callback error:', message)
    const msg = encodeURIComponent(message)
    return NextResponse.redirect(
      new URL(`/integrations?error=autodesk_callback_failed&msg=${msg}`, request.url),
    )
  }
}

export const Route = createFileRoute('/api/integrations/autodesk/callback')({
  server: {
    handlers: {
        GET: handleGET,
    },
  },
})

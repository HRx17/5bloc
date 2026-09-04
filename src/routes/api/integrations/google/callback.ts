import { createFileRoute } from '@tanstack/react-router'
import { exchangeGoogleCode, getGoogleRedirectUri, getGoogleUserInfo } from '@/lib/integrations/google'
import { saveToken } from '@/lib/integrations/token-store'
import { verifyOAuthState } from '@/lib/auth/oauth-state'

export const dynamic = 'force-dynamic'

const handleGET = async ({ request }: any) => {
  const { searchParams } = req.nextUrl
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error || !code || !state) {
    return NextResponse.redirect(new URL(`/integrations?error=google_denied`, request.url))
  }

  try {
    const { userId, origin } = verifyOAuthState(state)
    const redirectUri = getGoogleRedirectUri(origin)

    const tokens = await exchangeGoogleCode(code, redirectUri)
    const userInfo = await getGoogleUserInfo(tokens.access_token)
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

    await saveToken(userId, {
      provider: 'google',
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: expiresAt,
      scope: tokens.scope,
      provider_email: userInfo.email,
      provider_name: userInfo.name,
    })

    return NextResponse.redirect(new URL('/integrations?connected=google', origin))
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'unknown'
    console.error('Google callback error:', message)
    const errMsg = encodeURIComponent(message)
    return NextResponse.redirect(
      new URL(`/integrations?error=google_callback_failed&msg=${errMsg}`, request.url),
    )
  }
}

export const Route = createFileRoute('/api/integrations/google/callback')({
  server: {
    handlers: {
        GET: handleGET,
    },
  },
})

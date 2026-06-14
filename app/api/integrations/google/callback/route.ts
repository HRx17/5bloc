import { NextRequest, NextResponse } from 'next/server'
import { exchangeGoogleCode, getGoogleRedirectUri, getGoogleUserInfo } from '@/lib/integrations/google'
import { saveToken } from '@/lib/integrations/token-store'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const code  = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error || !code || !state) {
    return NextResponse.redirect(new URL(`/integrations?error=google_denied`, req.url))
  }

  try {
    const { userId, origin } = JSON.parse(Buffer.from(state, 'base64').toString())
    const redirectUri = getGoogleRedirectUri(origin)

    const tokens    = await exchangeGoogleCode(code, redirectUri)
    const userInfo  = await getGoogleUserInfo(tokens.access_token)
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

    await saveToken(userId, {
      provider:       'google',
      access_token:   tokens.access_token,
      refresh_token:  tokens.refresh_token,
      expires_at:     expiresAt,
      scope:          tokens.scope,
      provider_email: userInfo.email,
      provider_name:  userInfo.name,
    })

    return NextResponse.redirect(new URL('/integrations?connected=google', origin))
  } catch (e: any) {
    console.error('Google callback error:', e?.message ?? e)
    const errMsg = encodeURIComponent(e?.message ?? 'unknown')
    return NextResponse.redirect(new URL(`/integrations?error=google_callback_failed&msg=${errMsg}`, req.url))
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { exchangeAutodeskCode, getAutodeskRedirectUri, getAutodeskUserProfile } from '@/lib/integrations/autodesk'
import { saveToken } from '@/lib/integrations/token-store'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const code  = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error || !code || !state) {
    return NextResponse.redirect(new URL('/integrations?error=autodesk_denied', req.url))
  }

  try {
    const { userId, origin } = JSON.parse(Buffer.from(state, 'base64').toString())
    const redirectUri = getAutodeskRedirectUri(origin)

    const tokens    = await exchangeAutodeskCode(code, redirectUri)
    const profile   = await getAutodeskUserProfile(tokens.access_token)
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

    await saveToken(userId, {
      provider:       'autodesk',
      access_token:   tokens.access_token,
      refresh_token:  tokens.refresh_token,
      expires_at:     expiresAt,
      provider_email: profile.emailId,
      provider_name:  profile.userName,
    })

    return NextResponse.redirect(new URL('/integrations?connected=autodesk', origin))
  } catch (e) {
    console.error('Autodesk callback error:', e)
    return NextResponse.redirect(new URL('/integrations?error=autodesk_callback_failed', req.url))
  }
}

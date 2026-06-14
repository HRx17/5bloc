import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { buildGoogleAuthUrl, getGoogleRedirectUri } from '@/lib/integrations/google'

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/login', req.url))

  if (!process.env.GOOGLE_CLIENT_ID) {
    return NextResponse.redirect(new URL('/integrations?error=google_not_configured', req.url))
  }

  const origin      = req.nextUrl.origin
  const redirectUri = getGoogleRedirectUri(origin)
  const state       = Buffer.from(JSON.stringify({ userId: user.id, origin })).toString('base64')
  const authUrl     = buildGoogleAuthUrl(redirectUri, state)

  return NextResponse.redirect(authUrl)
}

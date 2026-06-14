import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { buildAutodeskAuthUrl, getAutodeskRedirectUri } from '@/lib/integrations/autodesk'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/login', req.url))

  if (!process.env.AUTODESK_CLIENT_ID) {
    return NextResponse.redirect(new URL('/integrations?error=autodesk_not_configured', req.url))
  }

  const origin      = req.nextUrl.origin
  const redirectUri = getAutodeskRedirectUri(origin)
  const state       = Buffer.from(JSON.stringify({ userId: user.id, origin })).toString('base64')
  const authUrl     = buildAutodeskAuthUrl(redirectUri, state)

  return NextResponse.redirect(authUrl)
}

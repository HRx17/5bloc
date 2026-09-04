import { createFileRoute } from '@tanstack/react-router'
import { createSupabaseServer } from '@/lib/supabase/server'
import { buildAutodeskAuthUrl, getAutodeskRedirectUri } from '@/lib/integrations/autodesk'
import { signOAuthState } from '@/lib/auth/oauth-state'

export const dynamic = 'force-dynamic'

const handleGET = async ({ request }: any) => {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/login', request.url))

  if (!process.env.AUTODESK_CLIENT_ID) {
    return NextResponse.redirect(new URL('/integrations?error=autodesk_not_configured', request.url))
  }

  try {
    const origin = req.nextUrl.origin
    const redirectUri = getAutodeskRedirectUri(origin)
    const state = signOAuthState({ userId: user.id, origin })
    const authUrl = buildAutodeskAuthUrl(redirectUri, state)
    return NextResponse.redirect(authUrl)
  } catch (e) {
    console.error('Autodesk connect error:', e)
    return NextResponse.redirect(new URL('/integrations?error=autodesk_not_configured', request.url))
  }
}

export const Route = createFileRoute('/api/integrations/autodesk/connect')({
  server: {
    handlers: {
        GET: handleGET,
    },
  },
})

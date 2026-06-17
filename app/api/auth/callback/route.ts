import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  const requestUrl = new URL(req.url)
  const code = requestUrl.searchParams.get('code')
  const oauthError = requestUrl.searchParams.get('error')
  const errorCode = requestUrl.searchParams.get('error_code')
  const nextRaw = requestUrl.searchParams.get('next') ?? '/dashboard'
  const next = nextRaw.startsWith('/') ? nextRaw : '/dashboard'

  if (oauthError || errorCode) {
    const params = new URLSearchParams()
    params.set('error', errorCode ?? oauthError ?? 'oauth_failed')
    if (next !== '/dashboard') params.set('next', next)
    return NextResponse.redirect(new URL(`/login?${params}`, req.url))
  }

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=missing_code', req.url))
  }

  let response = NextResponse.redirect(new URL(next, req.url))

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return req.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value))
            response = NextResponse.redirect(new URL(next, req.url))
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      console.error('Auth callback code exchange error:', error.message)
      return NextResponse.redirect(new URL('/login?error=auth_callback_failed', req.url))
    }
  } catch (e) {
    console.error('Auth callback error:', e)
    return NextResponse.redirect(new URL('/login?error=auth_callback_failed', req.url))
  }

  return response
}

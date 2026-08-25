import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { needsOnboarding } from '@/lib/auth/onboarding'
import { safeRedirectPath } from '@/lib/auth/safe-redirect'
import { analytics } from '@/lib/analytics/heycatch'

async function resolvePostAuthPath(
  supabase: ReturnType<typeof createServerClient>,
  userId: string,
  requestedNext: string
) {
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('auth_id', userId)
    .maybeSingle()

  if (needsOnboarding(user, profile?.org_id)) {
    return '/onboarding'
  }

  return requestedNext
}

export async function GET(req: NextRequest) {
  const requestUrl = new URL(req.url)
  const code = requestUrl.searchParams.get('code')
  const oauthError = requestUrl.searchParams.get('error')
  const errorCode = requestUrl.searchParams.get('error_code')
  const next = safeRedirectPath(requestUrl.searchParams.get('next'), '/dashboard')

  if (oauthError || errorCode) {
    const params = new URLSearchParams()
    params.set('error', errorCode ?? oauthError ?? 'oauth_failed')
    if (next !== '/dashboard') params.set('next', next)
    return NextResponse.redirect(new URL(`/login?${params}`, req.url))
  }

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=missing_code', req.url))
  }

  let redirectPath = next
  let response = NextResponse.redirect(new URL(redirectPath, req.url))

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
            response = NextResponse.redirect(new URL(redirectPath, req.url))
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (error || !data.user) {
      console.error('Auth callback code exchange error:', error?.message)
      return NextResponse.redirect(new URL('/login?error=auth_callback_failed', req.url))
    }

    await analytics.setIdentity(
      data.user.id,
      {
        email: data.user.email,
        name: (data.user.user_metadata?.full_name as string | undefined) || undefined,
      },
      { signup_date: data.user.created_at },
    )

    redirectPath = await resolvePostAuthPath(supabase, data.user.id, next)

    const createdAt = data.user.created_at ? new Date(data.user.created_at).getTime() : 0
    const isNewAccount = createdAt > 0 && Date.now() - createdAt < 30 * 60 * 1000
    if (isNewAccount && (next.includes('onboarding') || redirectPath === '/onboarding')) {
      await analytics.trackEvent('signup_completed', {}, { userId: data.user.id, request: req })
    }

    if (redirectPath !== next) {
      const final = NextResponse.redirect(new URL(redirectPath, req.url))
      response.cookies.getAll().forEach((cookie) => {
        final.cookies.set(cookie.name, cookie.value)
      })
      response = final
    }
  } catch (e) {
    console.error('Auth callback error:', e)
    return NextResponse.redirect(new URL('/login?error=auth_callback_failed', req.url))
  }

  return response
}

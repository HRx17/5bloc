import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { homeForRole, isRoleKey } from '@/lib/rbac/roles'
import { canRoleAccessPath } from '@/lib/rbac/access'
import { hasSupabaseEnv, isMockAuthEnabled } from '@/lib/rbac/mock'

const PUBLIC_PREFIXES = [
  '/login',
  '/admin',
  '/signup',
  '/forgot-password',
  '/portal',
  '/accept-invite',
  '/auth',
]

// /admin stays reachable while signed in so smoke role switching always works
const AUTH_PAGES = ['/login', '/signup', '/forgot-password']

function isMarketingPath(pathname: string) {
  return (
    pathname === '/' ||
    pathname.startsWith('/pricing') ||
    pathname.startsWith('/about') ||
    pathname.startsWith('/for') ||
    pathname.startsWith('/list-your-business') ||
    pathname.startsWith('/join-as-vendor') ||
    pathname.startsWith('/privacy') ||
    pathname.startsWith('/terms')
  )
}

function requiresOnboarding(pathname: string) {
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return false
  if (isMarketingPath(pathname)) return false
  if (pathname === '/onboarding') return false
  if (pathname.startsWith('/api')) return false
  return true
}

export async function proxy(req: NextRequest) {
  let res = NextResponse.next({
    request: { headers: req.headers },
  })

  const pathname = req.nextUrl.pathname
  const isPublic = PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))
  const isMarketing = isMarketingPath(pathname)

  // OAuth misconfig sometimes lands on Site URL (/) with error params — send to login
  if (pathname === '/' && req.nextUrl.searchParams.get('error_code')) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (isMockAuthEnabled()) {
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    return res
  }

  if (!hasSupabaseEnv()) {
    if (!isPublic && !isMarketing && !pathname.startsWith('/api')) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
    return res
  }

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
            res = NextResponse.next({
              request: { headers: req.headers },
            })
            cookiesToSet.forEach(({ name, value, options }) =>
              res.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    const sessionOk = !error && !!user

    if (!sessionOk && !isPublic && !isMarketing) {
      // In local/dev, network/SSL blips should not redirect-loop
      if (error && process.env.NODE_ENV === 'development') {
        console.warn('[proxy] Auth check skipped due to network error:', error.message)
        return res
      }
      const login = new URL('/login', req.url)
      const nextPath = `${pathname}${req.nextUrl.search || ''}`
      login.searchParams.set('next', nextPath)
      const invite = req.nextUrl.searchParams.get('invite_token')
      const orgInvite = req.nextUrl.searchParams.get('org_invite')
      const roleParam = req.nextUrl.searchParams.get('role')
      if (invite) login.searchParams.set('invite_token', invite)
      if (orgInvite) login.searchParams.set('org_invite', orgInvite)
      if (roleParam) login.searchParams.set('role', roleParam)
      return NextResponse.redirect(login)
    }

    if (sessionOk && user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, onboarded_at, org_id')
        .eq('auth_id', user.id)
        .maybeSingle()

      const role = profile?.role
      const home = isRoleKey(role) ? homeForRole(role) : '/dashboard'
      const needsOnboarding = !profile?.onboarded_at

      if (AUTH_PAGES.some((p) => pathname.startsWith(p))) {
        return NextResponse.redirect(new URL(needsOnboarding ? '/onboarding' : home, req.url))
      }

      if (needsOnboarding && requiresOnboarding(pathname)) {
        const onboarding = new URL('/onboarding', req.url)
        const invite = req.nextUrl.searchParams.get('invite_token')
        const orgInvite = req.nextUrl.searchParams.get('org_invite')
        const roleQs = req.nextUrl.searchParams.get('role')
        if (invite) onboarding.searchParams.set('invite_token', invite)
        if (orgInvite) onboarding.searchParams.set('org_invite', orgInvite)
        if (roleQs) onboarding.searchParams.set('role', roleQs)
        return NextResponse.redirect(onboarding)
      }

      if (!needsOnboarding && pathname === '/onboarding') {
        return NextResponse.redirect(new URL(home, req.url))
      }

      if (pathname === '/') {
        return NextResponse.redirect(new URL(home, req.url))
      }

      if (isRoleKey(role) && !isMarketing && !canRoleAccessPath(role, pathname)) {
        return NextResponse.redirect(new URL(home, req.url))
      }
    }
  } catch (e) {
    console.error('Supabase proxy error:', e)
    if (process.env.NODE_ENV === 'development') return res
  }

  return res
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon|icons|manifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}

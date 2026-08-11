import { createServerClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse, type NextRequest } from 'next/server'
import { homeForRole, isRoleKey } from '@/lib/rbac/roles'
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

const AUTH_PAGES = ['/login', '/admin', '/signup', '/forgot-password']

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

/** App routes that require completed onboarding (not public / marketing / auth). */
function requiresOnboarding(pathname: string) {
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return false
  if (isMarketingPath(pathname)) return false
  if (pathname === '/onboarding') return false
  if (pathname.startsWith('/api')) return false
  return true
}

export async function updateSession(req: NextRequest) {
  let res = NextResponse.next({
    request: { headers: req.headers },
  })

  const pathname = req.nextUrl.pathname
  const isPublic = PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))
  const isMarketing = isMarketingPath(pathname)

  // Explicit mock auth only — never skip session when Supabase is configured
  if (isMockAuthEnabled()) {
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    return res
  }

  if (!hasSupabaseEnv()) {
    // Misconfigured env: allow marketing/public only
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
      data: { session },
    } = await supabase.auth.getSession()

    if (!session && !isPublic && !isMarketing) {
      const login = new URL('/login', req.url)
      const nextPath = `${pathname}${req.nextUrl.search || ''}`
      login.searchParams.set('next', nextPath)
      // Preserve invite tokens at top-level too for signup/login CTAs
      const invite = req.nextUrl.searchParams.get('invite_token')
      const orgInvite = req.nextUrl.searchParams.get('org_invite')
      const roleParam = req.nextUrl.searchParams.get('role')
      if (invite) login.searchParams.set('invite_token', invite)
      if (orgInvite) login.searchParams.set('org_invite', orgInvite)
      if (roleParam) login.searchParams.set('role', roleParam)
      return NextResponse.redirect(login)
    }

    if (session) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, onboarded_at, org_id')
        .eq('auth_id', session.user.id)
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
        const role = req.nextUrl.searchParams.get('role')
        if (invite) onboarding.searchParams.set('invite_token', invite)
        if (orgInvite) onboarding.searchParams.set('org_invite', orgInvite)
        if (role) onboarding.searchParams.set('role', role)
        return NextResponse.redirect(onboarding)
      }

      if (!needsOnboarding && pathname === '/onboarding') {
        return NextResponse.redirect(new URL(home, req.url))
      }

      if (pathname === '/' || (pathname === '/dashboard' && home !== '/dashboard')) {
        return NextResponse.redirect(new URL(home, req.url))
      }
    }
  } catch (e) {
    console.error('Supabase middleware error:', e)
  }

  return res
}

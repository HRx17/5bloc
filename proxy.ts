import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/', '/login', '/signup', '/forgot-password', '/portal', '/accept-invite']

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Pass through for public pages — no Supabase call needed
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next({ request: req })
  }

  // Protected route — verify session
  let res = NextResponse.next({ request: req })

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return req.cookies.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value))
            res = NextResponse.next({ request: req })
            cookiesToSet.forEach(({ name, value, options }) =>
              res.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const { data: { user }, error } = await supabase.auth.getUser()

    // Only redirect if auth definitively says no user — not on network/SSL errors
    if (!error && !user) {
      const url = req.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('next', pathname)
      return NextResponse.redirect(url)
    }
  } catch (e: any) {
    // Network/SSL errors (e.g. UNABLE_TO_VERIFY_LEAF_SIGNATURE in local dev) —
    // let the request through rather than redirect-looping to /login.
    // The app-level auth check in each page will still protect routes.
    if (process.env.NODE_ENV === 'development') {
      console.warn('[proxy] Auth check skipped due to network error:', e?.message)
      return res
    }
    // In production treat as unauthenticated
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return res
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
}

import { createServerClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })
  
  // Safety check for development without Supabase keys configured
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return res
  }

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return req.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value))
            res = NextResponse.next({
              request: {
                headers: req.headers,
              },
            })
            cookiesToSet.forEach(({ name, value, options }) =>
              res.cookies.set(name, value, options)
            )
          },
        },
      }
    )
    const { data: { session } } = await supabase.auth.getSession()

    const publicPaths = ['/login', '/signup', '/forgot-password', '/portal', '/accept-invite']
    const isPublic = publicPaths.some(p => req.nextUrl.pathname.startsWith(p))

    if (!session && !isPublic) {
      return NextResponse.redirect(new URL('/login?next=' + req.nextUrl.pathname, req.url))
    }
    if (session && req.nextUrl.pathname === '/') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  } catch (e) {
    console.error('Supabase middleware error:', e)
  }

  return res
}

export const config = { matcher: ['/((?!api|_next|favicon|icons|manifest).*)'] }

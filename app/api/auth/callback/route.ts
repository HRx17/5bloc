import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  const requestUrl = new URL(req.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/dashboard'

  if (code) {
    try {
      const cookieStore = await cookies()
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll()
            },
            setAll(cookiesToSet) {
              try {
                cookiesToSet.forEach(({ name, value, options }) =>
                  cookieStore.set(name, value, options)
                )
              } catch {
                // ignore — cookies can't be set from a Server Component context
              }
            },
          },
        }
      )
      await supabase.auth.exchangeCodeForSession(code)
    } catch (e) {
      console.error('Auth callback code exchange error:', e)
      return NextResponse.redirect(new URL('/login?error=auth_callback_failed', req.url))
    }
  }

  return NextResponse.redirect(new URL(next, req.url))
}

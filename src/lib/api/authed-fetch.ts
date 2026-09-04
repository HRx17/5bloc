/**
 * The ported screens call `fetch('/api/...')` directly. In this framework the
 * session lives in the browser, so attach the access token to those calls once,
 * globally, instead of touching every call site.
 */
import { supabase } from '@/integrations/supabase/client'

let installed = false

export function installAuthedFetch() {
  if (installed || typeof window === 'undefined') return
  installed = true

  const original = window.fetch.bind(window)

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    let path = ''
    if (typeof input === 'string') path = input
    else if (input instanceof URL) path = input.pathname
    else if (typeof Request !== 'undefined' && input instanceof Request) path = input.url

    const isInternalApi =
      path.startsWith('/api/') ||
      (path.startsWith(window.location.origin) &&
        new URL(path, window.location.origin).pathname.startsWith('/api/'))

    if (!isInternalApi || path.includes('/api/public/')) {
      return original(input as any, init)
    }

    const headers = new Headers(
      typeof Request !== 'undefined' && input instanceof Request ? input.headers : undefined,
    )
    if (init?.headers) new Headers(init.headers).forEach((v, k) => headers.set(k, v))

    if (!headers.has('authorization')) {
      try {
        const { data } = await supabase.auth.getSession()
        const token = data.session?.access_token
        if (token) headers.set('Authorization', `Bearer ${token}`)
      } catch {
        // no session — the endpoint will answer 401
      }
    }

    return original(input as any, { ...init, headers })
  }
}

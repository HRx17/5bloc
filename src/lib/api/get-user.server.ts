/**
 * Server-side request auth for the ported `/api/*` endpoints.
 *
 * The browser keeps its session in localStorage, so requests carry the access
 * token as a bearer header (see `src/lib/api/authed-fetch.ts`). This builds a
 * Supabase client that acts as that user, so RLS applies exactly as before.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/integrations/supabase/types'

// Ported endpoints were written against an untyped client; keep that shape so the
// query builders behave exactly as they did before.
type AnyClient = SupabaseClient<any, any, any>

export type AuthProfile = {
  id: string
  auth_id?: string
  full_name: string | null
  email: string
  phone?: string | null
  avatar_url?: string | null
  role: string
  org_id: string | null
  plan: string
  ai_add_on?: boolean
  onboarded_at?: string | null
  organisations?: Record<string, any> | null
}

export type AuthContext = {
  user: { id: string; email?: string | null }
  profile: AuthProfile
  supabase: AnyClient
  orgId: string | null
  isMock: false
}

function isNewSupabaseApiKey(value: string): boolean {
  return value.startsWith('sb_publishable_') || value.startsWith('sb_secret_')
}

function createSupabaseFetch(supabaseKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== 'undefined' && input instanceof Request ? input.headers : undefined,
    )
    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value))
    }
    if (isNewSupabaseApiKey(supabaseKey) && headers.get('Authorization') === `Bearer ${supabaseKey}`) {
      headers.delete('Authorization')
    }
    headers.set('apikey', supabaseKey)
    return fetch(input, { ...init, headers })
  }
}

export function userClient(token: string): AnyClient {
  const url = process.env['SUPABASE_URL']!
  const key = process.env['SUPABASE_PUBLISHABLE_KEY']!
  return createClient<Database>(url, key, {
    global: {
      fetch: createSupabaseFetch(key),
      headers: { Authorization: `Bearer ${token}` },
    },
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  })
}

async function loadProfile(
  supabase: AnyClient,
  authUserId: string,
): Promise<AuthProfile | null> {
  const { data } = await supabase
    .from('profiles')
    .select('*, organisations!fk_profiles_org_id(*)')
    .eq('auth_id', authUserId)
    .maybeSingle()
  return (data as unknown as AuthProfile) ?? null
}

/** Returns the signed-in user for a request, or null when there is no valid session. */
export async function getAuthUserOrNull(request: Request): Promise<AuthContext | null> {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.match(/^Bearer\s+(.+)$/i)?.[1]
  if (!token) return null

  const supabase = userClient(token)
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data?.user) return null

  const profile = await loadProfile(supabase, data.user.id)
  if (!profile) return null

  return {
    user: { id: data.user.id, email: data.user.email },
    profile,
    supabase,
    orgId: profile.org_id ?? null,
    isMock: false,
  }
}

/**
 * Same as `getAuthUserOrNull`, but also accepts the access token as a `t` query
 * parameter. Needed for top-level browser navigations (OAuth connect flows),
 * which cannot carry an Authorization header.
 */
export async function getAuthUserFromQueryToken(request: Request): Promise<AuthContext | null> {
  const fromHeader = await getAuthUserOrNull(request)
  if (fromHeader) return fromHeader

  const token = new URL(request.url).searchParams.get('t')
  if (!token) return null

  const supabase = userClient(token)
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data?.user) return null

  const profile = await loadProfile(supabase, data.user.id)
  if (!profile) return null

  return {
    user: { id: data.user.id, email: data.user.email },
    profile,
    supabase,
    orgId: profile.org_id ?? null,
    isMock: false,
  }
}

export function json(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers || {}) },
  })
}

export const unauthorized = () => json({ error: 'Unauthorized' }, { status: 401 })

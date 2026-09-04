import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@supabase/supabase-js'

type NotifyInput = {
  userId: string
  title: string
  body?: string
  type?: string
  href?: string
}

function serviceClient(): SupabaseClient | null {
  const url = process.env['SUPABASE_URL']
  const key = process.env['SUPABASE_SERVICE_ROLE_KEY']
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

/** Best-effort notification write (never throws to callers). Uses SECURITY DEFINER RPC or service role so cross-user inserts work. */
export async function notifyUser(
  supabase: SupabaseClient | null | undefined,
  input: NotifyInput,
  opts?: { mock?: boolean }
) {
  try {
    if (opts?.mock) {
      MOCK_NOTIFICATIONS.unshift({
        id: `n-${Date.now()}`,
        user_id: input.userId,
        title: input.title,
        body: input.body || '',
        type: input.type || 'info',
        href: input.href || null,
        read_at: null,
        created_at: new Date().toISOString(),
      } as any)
      return
    }
    if (!supabase) {
      const svc = serviceClient()
      if (!svc) return
      await svc.rpc('notify_user', {
        p_user_id: input.userId,
        p_title: input.title,
        p_body: input.body || null,
        p_type: input.type || 'info',
        p_href: input.href || null,
      })
      return
    }

    const args = {
      p_user_id: input.userId,
      p_title: input.title,
      p_body: input.body || null,
      p_type: input.type || 'info',
      p_href: input.href || null,
    }

    // Prefer caller's session RPC (SECURITY DEFINER) — works for authenticated architects notifying others
    const { error: rpcErr } = await supabase.rpc('notify_user', args)
    if (!rpcErr) return

    // Portal / anon callers: fall back to service role
    const admin = serviceClient()
    if (admin) {
      const { error } = await admin.rpc('notify_user', args)
      if (error) console.warn('notifyUser service-role failed', error.message)
      return
    }

    console.warn('notifyUser failed', rpcErr.message)
  } catch (e) {
    console.warn('notifyUser failed', e)
  }
}

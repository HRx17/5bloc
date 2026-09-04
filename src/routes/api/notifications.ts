import { createFileRoute } from '@tanstack/react-router'
import { getAuthUserOrNull, json } from '@/lib/api/get-user.server'

const handleGET = async ({ request }: any) => {
  const auth = await getAuthUserOrNull(request)
  if (!auth) return json({ error: 'Unauthorized' }, { status: 401 })


  const { data, error } = await auth.supabase
    .from('notifications')
    .select('*')
    .eq('user_id', auth.profile.id)
    .order('created_at', { ascending: false })
    .limit(30)

  if (error) return json({ error: error.message }, { status: 500 })
  return json({ notifications: data || [] })
}

const handlePATCH = async ({ request }: any) => {
  const auth = await getAuthUserOrNull(request)
  if (!auth) return json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))

  if (body.markAllRead) {
    const { error } = await auth.supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', auth.profile.id)
      .is('read_at', null)
    if (error) return json({ error: error.message }, { status: 500 })
  } else if (body.id) {
    const { error } = await auth.supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', body.id)
      .eq('user_id', auth.profile.id)
    if (error) return json({ error: error.message }, { status: 500 })
  } else {
    return json({ error: 'id or markAllRead required' }, { status: 400 })
  }

  return json({ ok: true })
}

export const Route = createFileRoute('/api/notifications')({
  server: {
    handlers: {
        GET: handleGET,
        PATCH: handlePATCH,
    },
  },
})

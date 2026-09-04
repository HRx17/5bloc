import { createFileRoute } from '@tanstack/react-router'
import { getAuthUserOrNull, json } from '@/lib/api/get-user.server'
import { createServiceRoleClient } from '@/lib/supabase/server'

const handleGET = async ({ request }: any) => {
  const auth = await getAuthUserOrNull(request)
  if (!auth) return json({ error: 'Unauthorized' }, { status: 401 })

  const q = (new URL(request.url).searchParams.get('q') || '').trim()
  if (q.length < 2) return json({ users: [] })

  const admin = createServiceRoleClient()
  const escaped = q.replace(/[%_,]/g, (m) => `\\${m}`)
  const { data, error } = await admin
    .from('profiles')
    .select('id, full_name, email, role, avatar_url')
    .or(`email.ilike.%${escaped}%,full_name.ilike.%${escaped}%`)
    .limit(8)

  if (error) return json({ error: 'Search failed' }, { status: 500 })

  const users = (data || []).filter((u) => u.id !== auth.profile?.id)
  return json({ users })
}

export const Route = createFileRoute('/api/messages/users/search')({
  server: { handlers: { GET: handleGET } },
})

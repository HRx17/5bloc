import { createFileRoute } from '@tanstack/react-router'
import { getAuthUserOrNull, json } from '@/lib/api/get-user.server'


const handleGET = async ({ request, params }: any) => {
  const { id } = params as { id: string }
  const auth = await getAuthUserOrNull(request)
  if (!auth) return json({ error: 'Unauthorized' }, { status: 401 })



  const { data, error } = await auth.supabase
    .from('project_members')
    .select('*, profiles(full_name, email)')
    .eq('project_id', id)
  if (error) return json({ error: error.message }, { status: 500 })

  const members = (data || []).map((m: any) => ({
    ...m,
    full_name: m.profiles?.full_name || m.invite_email,
    email: m.profiles?.email || m.invite_email || null,
  }))
  return json({ members })
}

const handlePATCH = async ({ request, params }: any) => {
  const { id } = params as { id: string }
  const auth = await getAuthUserOrNull(request)
  if (!auth) return json({ error: 'Unauthorized' }, { status: 401 })
  if (auth.profile.role !== 'architect') {
    return json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  if (!body.member_id) {
    return json({ error: 'member_id required' }, { status: 400 })
  }

  const updates: Record<string, unknown> = {}
  for (const key of ['can_upload', 'can_comment', 'can_approve', 'role']) {
    if (key in body) updates[key] = body[key]
  }



  const { data, error } = await auth.supabase
    .from('project_members')
    .update(updates)
    .eq('id', body.member_id)
    .eq('project_id', id)
    .select()
    .single()
  if (error) return json({ error: error.message }, { status: 500 })
  return json({ member: data })
}

export const Route = createFileRoute('/api/projects/$id/members')({
  server: {
    handlers: {
        GET: handleGET,
        PATCH: handlePATCH,
    },
  },
})

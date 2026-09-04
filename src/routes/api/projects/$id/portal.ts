import { createFileRoute } from '@tanstack/react-router'
import { getAuthUserOrNull, json } from '@/lib/api/get-user.server'

type Ctx = { params: Promise<{ id: string }> }

const handleGET = async ({ request }: any) => {
  const { id } = await ctx.params
  const auth = await getAuthUserOrNull(request)
  if (!auth) return json({ error: 'Unauthorized' }, { status: 401 })
  if (auth.profile.role !== 'architect') {
    return json({ error: 'Forbidden' }, { status: 403 })
  }



  const { data: settings } = await auth.supabase
    .from('client_portal_settings')
    .select('*')
    .eq('project_id', id)
    .maybeSingle()
  const { data: project } = await auth.supabase.from('projects').select('*').eq('id', id).single()
  return json({ settings, project })
}

const handlePUT = async ({ request }: any) => {
  const { id } = await ctx.params
  const auth = await getAuthUserOrNull(request)
  if (!auth) return json({ error: 'Unauthorized' }, { status: 401 })
  if (auth.profile.role !== 'architect') {
    return json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()



  if (body.portal_enabled != null) {
    const { data: existing } = await auth.supabase
      .from('projects')
      .select('portal_token')
      .eq('id', id)
      .single()

    const projectPatch: Record<string, unknown> = {
      portal_enabled: body.portal_enabled,
    }
    if (body.portal_enabled && !existing?.portal_token) {
      projectPatch.portal_token =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '').slice(0, 16)
          : `portal-${Date.now()}`
    }
    await auth.supabase.from('projects').update(projectPatch).eq('id', id)
  }

  const { data: settings, error } = await auth.supabase
    .from('client_portal_settings')
    .upsert({ project_id: id, ...(body.settings || {}), updated_at: new Date().toISOString() })
    .select()
    .single()
  if (error) return json({ error: error.message }, { status: 500 })

  const { data: project } = await auth.supabase.from('projects').select('*').eq('id', id).single()
  return json({ ok: true, settings, project })
}

export const Route = createFileRoute('/api/projects/$id/portal')({
  server: {
    handlers: {
        GET: handleGET,
        PUT: handlePUT,
    },
  },
})

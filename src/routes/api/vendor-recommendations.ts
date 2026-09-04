import { createFileRoute } from '@tanstack/react-router'
import { getAuthUserOrNull, json } from '@/lib/api/get-user.server'
const MOCK_RECS: any[] = []

const handlePOST = async ({ request }: any) => {
  const auth = await getAuthUserOrNull(request)
  if (!auth) return json({ error: 'Unauthorized' }, { status: 401 })
  if (auth.profile.role !== 'builder' && auth.profile.role !== 'architect') {
    return json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  if (!body.project_id || !body.vendor_name) {
    return json({ error: 'project_id and vendor_name required' }, { status: 400 })
  }



  const { data, error } = await auth.supabase
    .from('vendor_recommendations')
    .insert({
      project_id: body.project_id,
      recommended_by: auth.profile.id,
      vendor_name: body.vendor_name,
      specialization: body.specialization,
      email: body.email,
      note: body.note,
    })
    .select()
    .single()
  if (error) return json({ error: error.message }, { status: 500 })
  return json({ recommendation: data }, { status: 201 })
}

const handleGET = async ({ request }: any) => {
  const auth = await getAuthUserOrNull(request)
  if (!auth) return json({ error: 'Unauthorized' }, { status: 401 })
  const projectId = new URL(request.url).searchParams.get('project_id')



  let query = auth.supabase.from('vendor_recommendations').select('*')
  if (projectId) query = query.eq('project_id', projectId)
  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) return json({ error: error.message }, { status: 500 })
  return json({ recommendations: data || [] })
}

export const Route = createFileRoute('/api/vendor-recommendations')({
  server: {
    handlers: {
        POST: handlePOST,
        GET: handleGET,
    },
  },
})

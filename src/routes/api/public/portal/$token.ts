import { createFileRoute } from '@tanstack/react-router'
import { json } from '@/lib/api/get-user.server'
import { createSupabasePublicClient } from '@/lib/supabase/server'
import { notifyUser } from '@/lib/notifications/notify'

const handleGET = async ({ request, params }: any) => {
  const { token } = params as { token: string }
  if (!token) return json({ error: 'token required' }, { status: 400 })
  void request

  const supabase = createSupabasePublicClient()
  const { data, error } = await supabase.rpc('get_portal_project', { p_token: token })
  if (error) return json({ error: error.message }, { status: 500 })
  if (!data) return json({ error: 'Portal not found or disabled' }, { status: 404 })
  return json(data)
}

const handlePOST = async ({ request, params }: any) => {
  const { token } = params as { token: string }
  if (!token) return json({ error: 'token required' }, { status: 400 })
  const body = await request.json().catch(() => ({}))
  const supabase = createSupabasePublicClient()

  if (body.action === 'approve' || body.action === 'reject') {
    if (!body.document_id) return json({ error: 'document_id required' }, { status: 400 })
    const { data, error } = await supabase.rpc('approve_portal_document', {
      p_token: token,
      p_document_id: body.document_id,
      p_action: body.action,
      p_note: body.note || null,
    })
    if (error) return json({ error: error.message }, { status: 500 })
    const result = data as any
    if (result && result.ok === false) {
      return json({ error: result.error || 'Action failed' }, { status: 400 })
    }

    // Let whoever uploaded the document know the client acted on it.
    const { data: doc } = await supabase
      .from('documents')
      .select('name, original_filename, uploaded_by, project_id')
      .eq('id', body.document_id)
      .maybeSingle()
    if (doc?.uploaded_by) {
      await notifyUser(supabase as any, {
        userId: doc.uploaded_by,
        title: `Client ${body.action === 'approve' ? 'approved' : 'rejected'} document`,
        body: doc.name || doc.original_filename || 'A document',
        type: 'portal',
        href: doc.project_id ? `/projects/${doc.project_id}/documents` : undefined,
      })
    }

    return json({ ok: true, result })
  }

  if (body.action === 'question') {
    if (!body.question) return json({ error: 'question required' }, { status: 400 })
    const { data, error } = await supabase.rpc('submit_portal_question', {
      p_token: token,
      p_question: String(body.question),
      p_name: body.name || null,
      p_email: body.email || null,
    })
    if (error) return json({ error: error.message }, { status: 500 })
    const result = data as any
    if (result && result.ok === false) {
      return json({ error: result.error || 'Failed to submit' }, { status: 400 })
    }

    const { data: portal } = await supabase.rpc('get_portal_project', { p_token: token })
    const projectId = (portal as any)?.project?.id
    if (projectId) {
      const { data: architects } = await supabase
        .from('project_members')
        .select('profile_id')
        .eq('project_id', projectId)
        .eq('role', 'architect')
        .not('profile_id', 'is', null)
      for (const m of architects || []) {
        if (!m.profile_id) continue
        await notifyUser(supabase as any, {
          userId: m.profile_id,
          title: 'Client portal question',
          body: String(body.question).slice(0, 140),
          type: 'portal',
          href: `/projects/${projectId}`,
        })
      }
    }

    return json({ ok: true, question_id: result?.id })
  }

  return json({ error: 'Unknown action' }, { status: 400 })
}

export const Route = createFileRoute('/api/public/portal/$token')({
  server: { handlers: { GET: handleGET, POST: handlePOST } },
})

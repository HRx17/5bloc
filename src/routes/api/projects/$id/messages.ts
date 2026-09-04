import { createFileRoute } from '@tanstack/react-router'
import { getAuthUserOrNull, json } from '@/lib/api/get-user.server'
type Ctx = { params: Promise<{ id: string }> }

const MOCK_MESSAGES: Record<string, any[]> = {}

function mockKey(projectId: string, channel: string) {
  return `${projectId}:${channel}`
}

const handleGET = async ({ request }: any) => {
  const { id } = await ctx.params
  const auth = await getAuthUserOrNull(request)
  if (!auth) return json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(request.url)
  const channel = (url.searchParams.get('channel') || 'general').toLowerCase()



  const { data, error } = await auth.supabase.rpc('list_project_channel_messages', {
    p_project_id: id,
    p_channel: channel,
    p_limit: 200,
  })
  if (error) return json({ error: error.message }, { status: 500 })
  return json(data || { channel, messages: [] })
}

const handlePOST = async ({ request }: any) => {
  const { id } = await ctx.params
  const auth = await getAuthUserOrNull(request)
  if (!auth) return json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const channel = String(body.channel || 'general').toLowerCase()
  const text = String(body.text || body.body || '').trim()
  const attachmentKey = body.attachmentKey ? String(body.attachmentKey) : ''
  const attachmentName = body.attachmentName ? String(body.attachmentName) : ''
  if (!text && !attachmentKey) return json({ error: 'text or file required' }, { status: 400 })

  const storedBody = attachmentKey
    ? `${text}${text ? '\n\n' : ''}${`[[5bloc-file|${encodeURIComponent(attachmentKey)}|${encodeURIComponent(attachmentName || 'file')}]]`}`
    : text



  const { data, error } = await auth.supabase.rpc('post_project_channel_message', {
    p_project_id: id,
    p_channel: channel,
    p_body: storedBody,
  })
  if (error) return json({ error: error.message }, { status: 500 })
  return json({ message: data }, { status: 201 })
}

export const Route = createFileRoute('/api/projects/$id/messages')({
  server: {
    handlers: {
        GET: handleGET,
        POST: handlePOST,
    },
  },
})

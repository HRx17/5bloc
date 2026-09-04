import { createFileRoute } from '@tanstack/react-router'
import { json } from '@/lib/api/get-user.server'
import {
  createSupabasePublicClient,
  createServiceRoleClient,
  hasValidServiceRoleKey,
} from '@/lib/supabase/server'
import { resolveStorageDownloadUrl } from '@/lib/files/resolve-download'

const handleGET = async ({ request, params }: any) => {
  const { token } = params as { token: string }
  const url = new URL(request.url)
  const docId = url.searchParams.get('document_id') || url.searchParams.get('id')
  if (!token || !docId) return json({ error: 'token and document_id required' }, { status: 400 })

  const supabase = createSupabasePublicClient()
  const { data, error } = await supabase.rpc('get_portal_document_key', {
    p_token: token,
    p_document_id: docId,
  })
  if (error) return json({ error: error.message }, { status: 500 })
  const result = data as any
  if (!result?.ok) return json({ error: result?.error || 'Not found' }, { status: 404 })
  if (!result.key) return json({ error: 'File not available' }, { status: 404 })

  const filename = String(result.name || 'document')
  try {
    const client = hasValidServiceRoleKey() ? createServiceRoleClient() : supabase
    const resolved = await resolveStorageDownloadUrl(String(result.key), filename, client as any)
    return json({ url: resolved.url, name: filename, provider: resolved.provider })
  } catch (e: any) {
    return json({ error: e?.message || 'Download failed' }, { status: 503 })
  }
}

export const Route = createFileRoute('/api/public/portal/$token/download')({
  server: { handlers: { GET: handleGET } },
})

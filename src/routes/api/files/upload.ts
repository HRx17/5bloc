import { createFileRoute } from '@tanstack/react-router'
import { getAuthUserOrNull, json } from '@/lib/api/get-user.server'

const BUCKET = 'documents'

/** Multipart upload into the project's file storage. */
const handlePOST = async ({ request }: any) => {
  const auth = await getAuthUserOrNull(request)
  if (!auth) return json({ error: 'Unauthorized' }, { status: 401 })

  const form = await request.formData()
  const file = form.get('file') as File | null
  const projectId = String(form.get('projectId') || '')
  const conversationId = String(form.get('conversationId') || '')
  const folder = String(form.get('folder') || '')
  if (!file) return json({ error: 'file required' }, { status: 400 })

  const prefix = conversationId
    ? `messages/${conversationId}`
    : projectId
      ? `projects/${projectId}`
      : folder === 'messages'
        ? `messages/${auth.user.id}`
        : ''
  if (!prefix) {
    return json({ error: 'file and projectId or conversationId required' }, { status: 400 })
  }
  if (file.size > 25 * 1024 * 1024) {
    return json({ error: 'File is over 25 MB' }, { status: 413 })
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const contentType = file.type || 'application/octet-stream'
  const buffer = new Uint8Array(await file.arrayBuffer())
  const storagePath = `${auth.user.id}/${prefix}/${Date.now()}-${safeName}`

  const { error } = await auth.supabase.storage
    .from(BUCKET)
    .upload(storagePath, buffer, { contentType, upsert: false })
  if (error) return json({ error: error.message }, { status: 500 })

  const { data: signed } = await auth.supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, 3600)

  return json({
    r2_key: `supabase:${storagePath}`,
    storage_path: `supabase:${storagePath}`,
    url: signed?.signedUrl || storagePath,
    size_bytes: file.size,
    filename: file.name,
    content_type: contentType,
    provider: 'supabase',
  })
}

/** Signed download/preview URL for a stored file. */
const handleGET = async ({ request }: any) => {
  const auth = await getAuthUserOrNull(request)
  if (!auth) return json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(request.url)
  const key = url.searchParams.get('key')
  if (!key) return json({ error: 'key required' }, { status: 400 })

  const path = key.startsWith('supabase:') ? key.slice('supabase:'.length) : key
  const { data, error } = await auth.supabase.storage.from(BUCKET).createSignedUrl(path, 900)
  if (error || !data?.signedUrl) {
    return json({ error: error?.message || 'Signed URL failed' }, { status: 500 })
  }
  return json({ url: data.signedUrl, provider: 'supabase' })
}

export const Route = createFileRoute('/api/files/upload')({
  server: {
    handlers: {
      GET: handleGET,
      POST: handlePOST,
    },
  },
})

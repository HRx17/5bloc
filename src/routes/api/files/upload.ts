import { createFileRoute } from '@tanstack/react-router'
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { getAuthUserOrNull, json } from '@/lib/api/get-user.server'
import { hasSupabaseEnv, isMockAuthEnabled } from '@/lib/rbac/mock'

const accountId = process.env.CF_ACCOUNT_ID || process.env.R2_ACCOUNT_ID
const hasR2 = !!(
  accountId &&
  process.env.R2_ACCESS_KEY_ID &&
  process.env.R2_SECRET_ACCESS_KEY
)

const r2 = hasR2
  ? new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    })
  : null

const R2_BUCKET = process.env.R2_BUCKET_NAME || process.env.R2_BUCKET || '5bloc-documents'
const SUPABASE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'documents'

/** Multipart upload: R2 preferred, else Supabase Storage, else mock metadata-only. */
const handlePOST = async ({ request }: any) => {
  const auth = await getAuthUserOrNull(request)
  if (!auth) return json({ error: 'Unauthorized' }, { status: 401 })

  const form = await request.formData()
  const file = form.get('file') as File | null
  const projectId = String(form.get('projectId') || '')
  const conversationId = String(form.get('conversationId') || '')
  const folder = String(form.get('folder') || '')
  if (!file) {
    return json({ error: 'file required' }, { status: 400 })
  }
  const prefix = conversationId
    ? `messages/${conversationId}`
    : projectId
      ? `projects/${projectId}`
      : folder === 'messages'
        ? `messages/${auth.user?.id || 'user'}`
        : ''
  if (!prefix) {
    return json({ error: 'file and projectId or conversationId required' }, { status: 400 })
  }
  if (file.size > 25 * 1024 * 1024) {
    return json({ error: 'File is over 25 MB' }, { status: 413 })
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const contentType = file.type || 'application/octet-stream'
  const buffer = Buffer.from(await file.arrayBuffer())

  // Prefer Cloudflare R2 when configured

  // Live Supabase without R2 → Storage bucket

  // Explicit mock auth only — never pretend upload succeeded for live users

  return json(
    {
      error:
        'File storage is not available. Configure Supabase Storage (documents bucket) or R2 credentials.',
      provider: 'none',
    },
    { status: 503 }
  )
}

const handleGET = async ({ request }: any) => {
  const auth = await getAuthUserOrNull(request)
  if (!auth) return json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(request.url)
  const key = url.searchParams.get('key')
  const filename = url.searchParams.get('filename') || 'download'
  const inline = url.searchParams.get('inline') === '1'
  if (!key) return json({ error: 'key required' }, { status: 400 })


  if (!r2) {
    return json(
      {
        error: 'Object storage is not configured. Set R2 credentials or use a supabase: key.',
        provider: 'mock',
      },
      { status: 503 }
    )
  }

  const signed = await getSignedUrl(
    r2,
    new GetObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      ResponseContentDisposition: `${inline ? 'inline' : 'attachment'}; filename="${filename}"`,
    }),
    { expiresIn: 900 }
  )
  return json({ url: signed, provider: 'r2' })
}

export const Route = createFileRoute('/api/files/upload')({
  server: {
    handlers: {
        POST: handlePOST,
        GET: handleGET,
    },
  },
})

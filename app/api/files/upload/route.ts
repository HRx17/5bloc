import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { getAuthUserOrNull } from '@/lib/supabase/get-user'
import { hasSupabaseEnv, isMockAuthEnabled } from '@/lib/rbac/mock'
import { NextResponse } from 'next/server'

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
export async function POST(req: Request) {
  const auth = await getAuthUserOrNull()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const form = await req.formData()
  const file = form.get('file') as File | null
  const projectId = String(form.get('projectId') || '')
  if (!file || !projectId) {
    return NextResponse.json({ error: 'file and projectId required' }, { status: 400 })
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const contentType = file.type || 'application/octet-stream'
  const buffer = Buffer.from(await file.arrayBuffer())

  // Prefer Cloudflare R2 when configured
  if (r2 && !isMockAuthEnabled()) {
    const r2Key = `projects/${projectId}/${Date.now()}-${safeName}`
    await r2.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: r2Key,
        Body: buffer,
        ContentType: contentType,
      })
    )
    return NextResponse.json({
      r2_key: r2Key,
      storage_path: r2Key,
      url: r2Key,
      size_bytes: file.size,
      filename: file.name,
      content_type: contentType,
      provider: 'r2',
    })
  }

  // Live Supabase without R2 → Storage bucket
  if (hasSupabaseEnv() && !auth.isMock && auth.supabase && auth.user?.id) {
    const storagePath = `${auth.user.id}/projects/${projectId}/${Date.now()}-${safeName}`
    const { error } = await auth.supabase.storage
      .from(SUPABASE_BUCKET)
      .upload(storagePath, buffer, { contentType, upsert: false })
    if (error) {
      return NextResponse.json(
        {
          error: error.message,
          hint: 'Ensure the "documents" storage bucket exists and policies allow uploads under your auth uid folder.',
        },
        { status: 500 }
      )
    }
    const { data: signed } = await auth.supabase.storage
      .from(SUPABASE_BUCKET)
      .createSignedUrl(storagePath, 3600)
    return NextResponse.json({
      r2_key: `supabase:${storagePath}`,
      storage_path: `supabase:${storagePath}`,
      url: signed?.signedUrl || storagePath,
      size_bytes: file.size,
      filename: file.name,
      content_type: contentType,
      provider: 'supabase',
    })
  }

  // Explicit mock auth only — never pretend upload succeeded for live users
  if (isMockAuthEnabled()) {
    const mockKey = `projects/${projectId}/${Date.now()}-${safeName}`
    return NextResponse.json({
      r2_key: mockKey,
      storage_path: mockKey,
      url: `mock://${mockKey}`,
      size_bytes: file.size,
      filename: file.name,
      content_type: contentType,
      mock: true,
      provider: 'mock',
      warning: 'MOCK_AUTH=1 — file body was not persisted to storage.',
    })
  }

  return NextResponse.json(
    {
      error:
        'File storage is not available. Configure Supabase Storage (documents bucket) or R2 credentials.',
      provider: 'none',
    },
    { status: 503 }
  )
}

export async function GET(req: Request) {
  const auth = await getAuthUserOrNull()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const key = url.searchParams.get('key')
  const filename = url.searchParams.get('filename') || 'download'
  if (!key) return NextResponse.json({ error: 'key required' }, { status: 400 })

  if (key.startsWith('supabase:') || (!r2 && hasSupabaseEnv() && !auth.isMock && auth.supabase)) {
    const path = key.startsWith('supabase:') ? key.slice('supabase:'.length) : key
    const { data, error } = await auth.supabase!.storage
      .from(SUPABASE_BUCKET)
      .createSignedUrl(path, 900)
    if (error || !data?.signedUrl) {
      return NextResponse.json({ error: error?.message || 'Signed URL failed' }, { status: 500 })
    }
    return NextResponse.json({ url: data.signedUrl, provider: 'supabase' })
  }

  if (!r2) {
    return NextResponse.json(
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
      ResponseContentDisposition: `attachment; filename="${filename}"`,
    }),
    { expiresIn: 900 }
  )
  return NextResponse.json({ url: signed, provider: 'r2' })
}

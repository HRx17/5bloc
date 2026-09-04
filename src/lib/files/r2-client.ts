import { AwsClient } from 'aws4fetch'

/**
 * Cloudflare R2 object storage, using your own R2 credentials.
 * Signed with SigV4 over fetch so it works in the edge runtime.
 */
const accountId = process.env['CF_ACCOUNT_ID'] || process.env['R2_ACCOUNT_ID']
const accessKeyId = process.env['R2_ACCESS_KEY_ID']
const secretAccessKey = process.env['R2_SECRET_ACCESS_KEY']

const hasR2 = !!(accountId && accessKeyId && secretAccessKey)

export const R2_BUCKET =
  process.env['R2_BUCKET_NAME'] || process.env['R2_BUCKET'] || '5bloc-documents'

const endpoint = accountId ? `https://${accountId}.r2.cloudflarestorage.com` : ''

export const r2 = hasR2
  ? new AwsClient({
      accessKeyId: accessKeyId!,
      secretAccessKey: secretAccessKey!,
      service: 's3',
      region: 'auto',
    })
  : null

export function hasR2Storage(): boolean {
  return !!r2
}

function objectUrl(key: string): string {
  const encoded = key.split('/').map(encodeURIComponent).join('/')
  return `${endpoint}/${R2_BUCKET}/${encoded}`
}

export async function getDownloadUrl(
  r2Key: string,
  filename: string,
  opts?: { inline?: boolean },
): Promise<string> {
  if (!r2) {
    throw new Error(
      'Object storage is not configured. Set R2 credentials or use a supabase: storage key.',
    )
  }

  const disposition = opts?.inline ? 'inline' : 'attachment'
  const url = new URL(objectUrl(r2Key))
  url.searchParams.set('X-Amz-Expires', '900')
  url.searchParams.set(
    'response-content-disposition',
    `${disposition}; filename="${filename.replace(/"/g, '')}"`,
  )

  const signed = await r2.sign(new Request(url.toString(), { method: 'GET' }), {
    aws: { signQuery: true },
  })
  return signed.url
}

export async function uploadToR2(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string,
): Promise<{ key: string; publicUrl: string | null }> {
  if (!r2) throw new Error('R2 not configured')

  const res = await r2.fetch(objectUrl(key), {
    method: 'PUT',
    body: body as unknown as BodyInit,
    headers: { 'Content-Type': contentType },
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`R2 upload failed (${res.status}): ${detail.slice(0, 200)}`)
  }

  const pub = process.env['R2_PUBLIC_URL']?.trim()
  const publicUrl = pub ? `${pub.replace(/\/$/, '')}/${key}` : null
  return { key, publicUrl }
}

import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || process.env.CF_ACCOUNT_ID

const hasR2 = !!(
  accountId &&
  process.env.R2_ACCESS_KEY_ID &&
  process.env.R2_SECRET_ACCESS_KEY
)

export const r2 = hasR2
  ? new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    })
  : null

export const R2_BUCKET = process.env.R2_BUCKET_NAME || '5bloc-documents'

export async function getDownloadUrl(r2Key: string, filename: string): Promise<string> {
  if (!r2) {
    return `https://dummyimage.com/600x400/0c1220/f5a623.png&text=${encodeURIComponent(filename)}`
  }
  return getSignedUrl(r2, new GetObjectCommand({
    Bucket: R2_BUCKET,
    Key: r2Key,
    ResponseContentDisposition: `attachment; filename="${filename}"`,
  }), { expiresIn: 900 })
}

export async function uploadToR2(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string,
): Promise<{ key: string; publicUrl: string | null }> {
  if (!r2) throw new Error('R2 not configured')

  await r2.send(new PutObjectCommand({
    Bucket:      R2_BUCKET,
    Key:         key,
    Body:        body,
    ContentType: contentType,
  }))

  const pub = process.env.R2_PUBLIC_URL?.trim()
  const publicUrl = pub ? `${pub}/${key}` : null
  return { key, publicUrl }
}

export async function getUploadSignedUrl(key: string, contentType: string): Promise<string> {
  if (!r2) throw new Error('R2 not configured')
  return getSignedUrl(r2, new PutObjectCommand({
    Bucket:      R2_BUCKET,
    Key:         key,
    ContentType: contentType,
  }), { expiresIn: 300 })
}

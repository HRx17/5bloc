import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// Safety initialization for environment verification
const hasR2 = !!(
  process.env.CF_ACCOUNT_ID &&
  process.env.R2_ACCESS_KEY_ID &&
  process.env.R2_SECRET_ACCESS_KEY
)

export const r2 = hasR2
  ? new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    })
  : null

export const R2_BUCKET = process.env.R2_BUCKET_NAME || '5bloc-documents'

export async function getDownloadUrl(r2Key: string, filename: string): Promise<string> {
  if (!r2) {
    // Development fallback
    return `https://dummyimage.com/600x400/0c1220/f5a623.png&text=${encodeURIComponent(filename)}`
  }
  
  return getSignedUrl(r2, new GetObjectCommand({
    Bucket: R2_BUCKET,
    Key: r2Key,
    ResponseContentDisposition: `attachment; filename="${filename}"`,
  }), { expiresIn: 900 })  // 15 minutes
}

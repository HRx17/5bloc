import { createFileRoute } from '@tanstack/react-router'
import { createSupabaseServer } from '@/lib/supabase/server'
import { getAppToken, ensureBucket, getSignedUploadUrl } from '@/lib/integrations/autodesk'

export const dynamic = 'force-dynamic'

function bucketKey() {
  const id = (process.env.AUTODESK_CLIENT_ID ?? 'app').toLowerCase().replace(/[^a-z0-9]/g, '')
  return `bloc-cad-${id.slice(0, 24)}`
}

const handlePOST = async ({ request }: any) => {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return json({ error: 'Unauthorized' }, { status: 401 })

  if (!process.env.AUTODESK_CLIENT_ID || !process.env.AUTODESK_CLIENT_SECRET) {
    return json({ error: 'Autodesk not configured' }, { status: 503 })
  }

  try {
    const { fileName } = await request.json() as { fileName: string }
    if (!fileName) return json({ error: 'fileName required' }, { status: 400 })

    const { access_token } = await getAppToken()
    const bucket    = bucketKey()
    const safeName  = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
    const objectKey = `${Date.now()}-${safeName}`

    await ensureBucket(access_token, bucket)

    const { uploadKey, urls } = await getSignedUploadUrl(access_token, bucket, objectKey)

    return json({ uploadUrl: urls[0], uploadKey, objectKey, bucketKey: bucket })
  } catch (e: any) {
    console.error('upload-url error:', e?.message ?? e)
    return json({ error: e?.message ?? 'Failed to prepare upload' }, { status: 500 })
  }
}

export const Route = createFileRoute('/api/integrations/autodesk/upload-url')({
  server: {
    handlers: {
        POST: handlePOST,
    },
  },
})

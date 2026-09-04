import { createFileRoute } from '@tanstack/react-router'
import { createSupabaseServer } from '@/lib/supabase/server'
import { getAppToken, completeSignedUpload, translateModel, toUrn } from '@/lib/integrations/autodesk'

export const dynamic = 'force-dynamic'

const handlePOST = async ({ request }: any) => {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { uploadKey, objectKey, bucketKey, fileName } = await request.json() as {
      uploadKey: string; objectKey: string; bucketKey: string; fileName: string
    }
    if (!uploadKey || !objectKey || !bucketKey) {
      return json({ error: 'uploadKey, objectKey, bucketKey required' }, { status: 400 })
    }

    const { access_token } = await getAppToken()

    const completed = await completeSignedUpload(access_token, bucketKey, objectKey, uploadKey)
    const urn = toUrn(completed.objectId)

    await translateModel(access_token, urn)

    return json({ urn, name: fileName ?? objectKey })
  } catch (e: any) {
    console.error('complete-upload error:', e?.message ?? e)
    return json({ error: e?.message ?? 'Failed to complete upload' }, { status: 500 })
  }
}

export const Route = createFileRoute('/api/integrations/autodesk/complete-upload')({
  server: {
    handlers: {
        POST: handlePOST,
    },
  },
})

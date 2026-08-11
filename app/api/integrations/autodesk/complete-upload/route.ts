import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { getAppToken, completeSignedUpload, translateModel, toUrn } from '@/lib/integrations/autodesk'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { uploadKey, objectKey, bucketKey, fileName } = await req.json() as {
      uploadKey: string; objectKey: string; bucketKey: string; fileName: string
    }
    if (!uploadKey || !objectKey || !bucketKey) {
      return NextResponse.json({ error: 'uploadKey, objectKey, bucketKey required' }, { status: 400 })
    }

    const { access_token } = await getAppToken()

    const completed = await completeSignedUpload(access_token, bucketKey, objectKey, uploadKey)
    const urn = toUrn(completed.objectId)

    await translateModel(access_token, urn)

    return NextResponse.json({ urn, name: fileName ?? objectKey })
  } catch (e: any) {
    console.error('complete-upload error:', e?.message ?? e)
    return NextResponse.json({ error: e?.message ?? 'Failed to complete upload' }, { status: 500 })
  }
}

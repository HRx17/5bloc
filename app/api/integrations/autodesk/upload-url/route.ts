import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { getAppToken, ensureBucket, getSignedUploadUrl } from '@/lib/integrations/autodesk'

export const dynamic = 'force-dynamic'

function bucketKey() {
  const id = (process.env.AUTODESK_CLIENT_ID ?? 'app').toLowerCase().replace(/[^a-z0-9]/g, '')
  return `bloc-cad-${id.slice(0, 24)}`
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!process.env.AUTODESK_CLIENT_ID || !process.env.AUTODESK_CLIENT_SECRET) {
    return NextResponse.json({ error: 'Autodesk not configured' }, { status: 503 })
  }

  try {
    const { fileName } = await req.json() as { fileName: string }
    if (!fileName) return NextResponse.json({ error: 'fileName required' }, { status: 400 })

    const { access_token } = await getAppToken()
    const bucket    = bucketKey()
    const safeName  = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
    const objectKey = `${Date.now()}-${safeName}`

    await ensureBucket(access_token, bucket)

    const { uploadKey, urls } = await getSignedUploadUrl(access_token, bucket, objectKey)

    return NextResponse.json({ uploadUrl: urls[0], uploadKey, objectKey, bucketKey: bucket })
  } catch (e: any) {
    console.error('upload-url error:', e?.message ?? e)
    return NextResponse.json({ error: e?.message ?? 'Failed to prepare upload' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { getAppToken, ensureBucket, uploadToOSS, translateModel, toUrn } from '@/lib/integrations/autodesk'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// OSS bucket key rules: 3-128 chars, lowercase letters/numbers/dashes, MUST start with a letter.
function bucketKey() {
  const id = (process.env.AUTODESK_CLIENT_ID ?? 'app').toLowerCase().replace(/[^a-z0-9]/g, '')
  return `bloc-cad-${id.slice(0, 24)}`   // starts with letter 'b', safe length
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!process.env.AUTODESK_CLIENT_ID || !process.env.AUTODESK_CLIENT_SECRET) {
    return NextResponse.json({ error: 'Autodesk not configured' }, { status: 503 })
  }

  try {
    const form = await req.formData()
    const file = form.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const okExt = /\.(dwg|rvt|dwf|dxf|ifc|nwd|nwc|3dm|f3d|step|stp|iges|igs|obj|fbx|glb|gltf)$/i
    if (!okExt.test(file.name)) {
      return NextResponse.json({ error: 'Unsupported file type for CAD viewer' }, { status: 400 })
    }
    if (file.size > 200 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 200MB)' }, { status: 400 })
    }

    const buffer = new Uint8Array(await file.arrayBuffer())
    const bucket = bucketKey()

    const { access_token } = await getAppToken()

    await ensureBucket(access_token, bucket)

    // Object key — unique per upload to allow re-translation
    const safeName  = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const objectKey = `${Date.now()}-${safeName}`

    const uploaded = await uploadToOSS(access_token, bucket, objectKey, buffer)
    const urn = toUrn(uploaded.objectId)

    await translateModel(access_token, urn)

    return NextResponse.json({ urn, name: file.name, objectId: uploaded.objectId })
  } catch (e: any) {
    console.error('Autodesk upload error:', e?.message ?? e)
    return NextResponse.json({ error: e?.message ?? 'Upload failed' }, { status: 500 })
  }
}

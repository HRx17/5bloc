import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/supabase/get-user'
import { resolveStorageDownloadUrl } from '@/lib/files/resolve-download'

/**
 * Same-origin file body for in-app handoff (CAD viewer import). Signed
 * third-party URLs often fail CORS when the browser fetches them directly.
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthUser()
    const docId = req.nextUrl.searchParams.get('id')
    if (!docId) return NextResponse.json({ error: 'Missing document id' }, { status: 400 })
    if (!auth.supabase) {
      return NextResponse.json({ error: 'Auth/storage not configured' }, { status: 503 })
    }

    const { data: doc, error } = await auth.supabase
      .from('documents')
      .select('r2_key, storage_path, name, original_filename, extension')
      .eq('id', docId)
      .single()

    if (error || !doc) {
      return NextResponse.json({ error: 'Not found or access denied' }, { status: 404 })
    }

    const key = doc.r2_key || doc.storage_path
    if (!key) return NextResponse.json({ error: 'No file storage key' }, { status: 404 })

    const filename = doc.original_filename || `${doc.name || 'document'}.${doc.extension || 'bin'}`
    const resolved = await resolveStorageDownloadUrl(key, filename, auth.supabase)
    const fileRes = await fetch(resolved.url)
    if (!fileRes.ok) {
      return NextResponse.json(
        { error: `Could not read the stored file (${fileRes.status})` },
        { status: 502 }
      )
    }

    const buf = Buffer.from(await fileRes.arrayBuffer())
    const type = fileRes.headers.get('content-type') || 'application/octet-stream'
    return new NextResponse(buf, {
      headers: {
        'Content-Type': type,
        'Content-Length': String(buf.length),
        'Content-Disposition': `attachment; filename="${filename.replace(/"/g, '')}"`,
        'X-Filename': encodeURIComponent(filename),
        'Cache-Control': 'private, no-store',
      },
    })
  } catch (e) {
    console.error('File blob API error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

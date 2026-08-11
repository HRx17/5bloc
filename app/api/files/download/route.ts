import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/supabase/get-user'
import { resolveStorageDownloadUrl } from '@/lib/files/resolve-download'

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthUser()
    const docId = req.nextUrl.searchParams.get('id')

    if (!docId) {
      return NextResponse.json({ error: 'Missing document id parameter' }, { status: 400 })
    }

    if (!auth.supabase) {
      return NextResponse.json(
        { error: 'Auth/storage not configured', provider: 'mock' },
        { status: 503 }
      )
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
    if (!key) {
      return NextResponse.json({ error: 'No file storage key' }, { status: 404 })
    }

    const filename = `${doc.name || doc.original_filename || 'document'}.${doc.extension || 'pdf'}`
    const resolved = await resolveStorageDownloadUrl(key, filename, auth.supabase)
    return NextResponse.json({
      url: resolved.url,
      expires_in: 900,
      provider: resolved.provider,
    })
  } catch (e) {
    console.error('File download API error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

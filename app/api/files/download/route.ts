import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer, isSupabaseConfigured, SupabaseConfigError } from '@/lib/supabase/server'
import { getDownloadUrl } from '@/lib/files/r2-client'

export async function GET(req: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Authentication service not configured' }, { status: 503 })
    }

    const supabase = await createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const docId = req.nextUrl.searchParams.get('id')
    if (!docId) {
      return NextResponse.json({ error: 'Missing document id parameter' }, { status: 400 })
    }

    // RLS automatically enforces access
    const { data: doc, error } = await supabase
      .from('documents')
      .select('storage_path, original_filename')
      .eq('id', docId)
      .single()

    if (error || !doc) {
      return NextResponse.json({ error: 'Not found or access denied' }, { status: 404 })
    }

    // Uploads go to Cloudflare R2 — sign a download URL from the same store
    try {
      const url = await getDownloadUrl(doc.storage_path, doc.original_filename)
      return NextResponse.json({
        url,
        filename: doc.original_filename,
        expires_in: 900,
      })
    } catch (signErr) {
      console.error('R2 signed URL error:', signErr)
      return NextResponse.json({ error: 'Could not generate download link' }, { status: 500 })
    }
  } catch (e) {
    if (e instanceof SupabaseConfigError) {
      return NextResponse.json({ error: 'Authentication service not configured' }, { status: 503 })
    }
    console.error('File download API error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

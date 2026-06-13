import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
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

    // Generate a signed URL from Supabase Storage
    const { data: signedData, error: signErr } = await supabase
      .storage
      .from('documents')
      .createSignedUrl(doc.storage_path, 900)

    if (signErr || !signedData) {
      return NextResponse.json({ error: 'Could not generate download link' }, { status: 500 })
    }

    return NextResponse.json({ url: signedData.signedUrl, filename: doc.original_filename, expires_in: 900 })
  } catch (e) {
    console.error('File download API error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

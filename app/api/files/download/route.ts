import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/supabase/get-user'
import { getDownloadUrl } from '@/lib/files/r2-client'

export async function GET(req: NextRequest) {
  try {
    const { supabase } = await getAuthUser()
    const docId = req.nextUrl.searchParams.get('id')

    if (!docId) {
      return NextResponse.json({ error: 'Missing document id parameter' }, { status: 400 })
    }

    // Mock fallback for offline local testing
    if (!supabase) {
      const dummyUrl = `https://dummyimage.com/600x400/0c1220/f5a623.png&text=Download_Doc_${docId}`
      return NextResponse.json({ url: dummyUrl, expires_in: 900 })
    }

    // RLS automatically enforces access — if no row returned, user cannot access
    const { data: doc, error } = await supabase
      .from('documents')
      .select('r2_key, name, extension')
      .eq('id', docId)
      .single()

    if (error || !doc) {
      return NextResponse.json({ error: 'Not found or access denied' }, { status: 404 })
    }

    const downloadUrl = await getDownloadUrl(doc.r2_key, `${doc.name}.${doc.extension}`)
    return NextResponse.json({ url: downloadUrl, expires_in: 900 })
  } catch (e) {
    console.error('File download API error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

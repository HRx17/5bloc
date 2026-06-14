import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { getFreshGoogleToken } from '@/lib/integrations/token-refresh'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const token = await getFreshGoogleToken(user.id)
  if (!token) return NextResponse.json({ notConnected: true, files: [] })

  const query    = req.nextUrl.searchParams.get('q') ?? ''
  const folderId = req.nextUrl.searchParams.get('folderId') ?? ''

  try {
    const qParts: string[] = ['trashed=false']
    if (query)    qParts.push(`name contains '${query.replace(/'/g, "\\'")}'`)
    if (folderId) qParts.push(`'${folderId}' in parents`)

    const params = new URLSearchParams({
      pageSize: '30',
      fields:   'files(id,name,mimeType,modifiedTime,size,webViewLink)',
      q:        qParts.join(' and '),
      orderBy:  'modifiedTime desc',
    })

    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files?${params}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    if (!res.ok) {
      const errBody = await res.text()
      console.error('Drive API error:', res.status, errBody)
      return NextResponse.json({ error: `Drive API error ${res.status}`, detail: errBody }, { status: 502 })
    }
    const data = await res.json()
    return NextResponse.json({ files: data.files ?? [] })
  } catch (e) {
    console.error('Drive route error:', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

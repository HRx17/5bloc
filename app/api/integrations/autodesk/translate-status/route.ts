import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { getAppToken, getTranslationStatus } from '@/lib/integrations/autodesk'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const urn = req.nextUrl.searchParams.get('urn')
  if (!urn) return NextResponse.json({ error: 'urn required' }, { status: 400 })

  try {
    const { access_token } = await getAppToken()
    const manifest = await getTranslationStatus(access_token, urn)
    return NextResponse.json({
      status:   manifest.status,    // 'pending' | 'inprogress' | 'success' | 'failed' | 'timeout'
      progress: manifest.progress,  // e.g. '50% complete'
    })
  } catch (e: any) {
    // Manifest 404 = translation job just started, not yet registered
    return NextResponse.json({ status: 'pending', progress: '0% complete' })
  }
}

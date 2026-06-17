import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { getFreshGoogleToken } from '@/lib/integrations/token-refresh'
import { getGoogleAppId, getGooglePickerApiKey } from '@/lib/integrations/google'

export const dynamic = 'force-dynamic'

/** Short-lived access token for the Google Picker (authenticated users only). */
export async function GET() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const accessToken = await getFreshGoogleToken(user.id)
  if (!accessToken) {
    return NextResponse.json({ error: 'Google not connected' }, { status: 400 })
  }

  return NextResponse.json({
    accessToken,
    appId: getGoogleAppId(),
    apiKey: getGooglePickerApiKey() ?? null,
  })
}

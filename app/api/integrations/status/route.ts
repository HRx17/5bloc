import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { listConnectedProviders } from '@/lib/integrations/token-store'

export async function GET() {
  try {
    const supabase = await createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ connected: [] })

    const connected = await listConnectedProviders(user.id)
    return NextResponse.json({ connected })
  } catch {
    return NextResponse.json({ connected: [] })
  }
}

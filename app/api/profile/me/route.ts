import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer, isSupabaseConfigured } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Authentication service not configured' }, { status: 503 })
  }

  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, organisations(*)')
    .eq('auth_id', user.id)
    .maybeSingle()

  const meta = user.user_metadata ?? {}

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      full_name: profile?.full_name ?? meta.full_name ?? user.email?.split('@')[0],
      role: profile?.role ?? meta.role ?? 'architect',
      avatar_url: profile?.avatar_url ?? meta.avatar_url ?? user.user_metadata?.picture ?? null,
      onboarding_complete: meta.onboarding_complete === true || !!profile?.org_id,
    },
    profile,
    organisation: profile?.organisations ?? null,
    metadata: {
      city: meta.city ?? null,
      state: meta.state ?? null,
      gst_number: meta.gst_number ?? null,
    },
  })
}

export async function PATCH(req: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Authentication service not configured' }, { status: 503 })
  }

  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const metaUpdates: Record<string, string | null> = {}

    if (typeof body.full_name === 'string') metaUpdates.full_name = body.full_name.trim()
    if (typeof body.city === 'string') metaUpdates.city = body.city.trim() || null
    if (typeof body.state === 'string') metaUpdates.state = body.state.trim() || null
    if (typeof body.gst_number === 'string') metaUpdates.gst_number = body.gst_number.trim() || null

    if (Object.keys(metaUpdates).length > 0) {
      await supabase.auth.updateUser({ data: metaUpdates })
    }

    if (typeof body.full_name === 'string') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('profiles') as any)
        .update({ full_name: body.full_name.trim() })
        .eq('auth_id', user.id)
    }

    if (typeof body.org_name === 'string') {
      const { data: profile } = await supabase
        .from('profiles')
        .select('org_id')
        .eq('auth_id', user.id)
        .maybeSingle()

      if (profile?.org_id) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from('organisations') as any)
          .update({ name: body.org_name.trim() })
          .eq('id', profile.org_id)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Update failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

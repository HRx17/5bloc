import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { USER_ROLES, type UserRole } from '@/lib/roles'

export const dynamic = 'force-dynamic'

const VALID_ROLES = USER_ROLES.map((r) => r.id)

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const role = (body.role ?? user.user_metadata?.role ?? 'architect') as UserRole
    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    const fullName = body.full_name ?? user.user_metadata?.full_name ?? user.email?.split('@')[0]
    const orgName  = body.org_name ?? `${fullName}'s Workspace`

    // Update auth metadata (always succeeds; powers the demo experience)
    await supabase.auth.updateUser({
      data: { full_name: fullName, role, onboarding_complete: true },
    })

    // Persist profile (matches public.profiles schema)
    const profilePayload = {
      auth_id: user.id,
      email: user.email,
      full_name: fullName,
      role,
      plan: 'free',
      ai_add_on: false,
    }

    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('auth_id', user.id)
      .maybeSingle()

    let profileId: string | undefined = existing?.id
    if (existing) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('profiles') as any).update(profilePayload).eq('auth_id', user.id)
    } else {
      const { data: inserted } = await (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        supabase.from('profiles') as any
      ).insert(profilePayload).select('id').single()
      profileId = inserted?.id
    }

    // Create the organisation owned by this profile, then link it back.
    // organisations columns: name, plan, owner_id (FK -> profiles.id)
    if (orgName && profileId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: org } = await (supabase.from('organisations') as any)
        .insert({ name: orgName, plan: 'free', owner_id: profileId })
        .select('id')
        .single()

      if (org?.id) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from('profiles') as any).update({ org_id: org.id }).eq('auth_id', user.id)
      }
    }

    return NextResponse.json({ ok: true, role })
  } catch (e: any) {
    console.error('Onboarding API error:', e?.message ?? e)
    return NextResponse.json({ error: e?.message ?? 'Onboarding failed' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { shouldServeMockData, liveDataUnavailableResponse, hasSupabaseEnv } from '@/lib/data/mock-guard'
import { getAuthUserOrNull } from '@/lib/supabase/get-user'
import { homeForRole, isRoleKey, type RoleKey } from '@/lib/rbac/roles'
import { MOCK_CONTRACTORS } from '@/lib/data/mock-store'
import { send } from '@/lib/email/resend'
import { WelcomeEmail } from '@/lib/email/templates'
import { analytics } from '@/lib/analytics/heycatch'

export async function POST(req: Request) {
  const auth = await getAuthUserOrNull()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const inviteFlow = !!body.invite_flow
  const role = (body.role || auth.profile.role) as RoleKey
  if (!isRoleKey(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  }

  if (shouldServeMockData(auth)) {
    if (role === 'contractor') {
      const existing = MOCK_CONTRACTORS.find((c) => c.user_id === auth.profile.id)
      if (!existing) {
        MOCK_CONTRACTORS.unshift({
          id: `ctr-${Date.now()}`,
          user_id: auth.profile.id,
          company_name: body.company_name || 'My Company',
          bio: body.bio || '',
          specializations: body.specializations || [],
          service_cities: body.service_cities || [],
          service_states: body.service_states || [],
          team_size: body.team_size || null,
          years_experience: body.years_experience || null,
          verified: false,
          badge_active: false,
          rating: 0,
          reviews_count: 0,
          jobs_completed: 0,
          gst_number: body.gst_number || null,
          portfolio_photos: [],
        } as any)
      }
    }
    return NextResponse.json({
      ok: true,
      redirect: homeForRole(role),
      onboarded_at: new Date().toISOString(),
    })
  }
  if (!hasSupabaseEnv() || !auth.supabase) {
    return NextResponse.json(liveDataUnavailableResponse(), { status: 503 })
  }


  const updates: Record<string, unknown> = {
    role,
    full_name: body.full_name || auth.profile.full_name,
    phone: body.phone || auth.profile.phone,
    onboarded_at: new Date().toISOString(),
  }

  // Invite flow: do not create an architect org; role already set by accept
  if (!inviteFlow && role === 'architect') {
    if (!body.firm_name || !body.city) {
      return NextResponse.json({ error: 'firm_name and city required' }, { status: 400 })
    }
    const { data: org, error: orgErr } = await auth.supabase
      .from('organisations')
      .insert({
        name: body.firm_name,
        type: body.firm_type || 'both',
        owner_id: auth.profile.id,
        city: body.city,
        state: body.state || null,
        gst_number: body.gst_number || null,
        plan: 'free',
      })
      .select()
      .single()
    if (orgErr) return NextResponse.json({ error: orgErr.message }, { status: 500 })
    updates.org_id = org.id
    await auth.supabase.from('organisation_members').upsert(
      {
        org_id: org.id,
        profile_id: auth.profile.id,
        member_role: 'owner',
        status: 'active',
      },
      { onConflict: 'org_id,profile_id' }
    )
  }

  if (role === 'consultant' && body.discipline) {
    updates.discipline = body.discipline
  }

  const { error } = await auth.supabase.from('profiles').update(updates).eq('id', auth.profile.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (role === 'contractor') {
    await auth.supabase.from('contractors').upsert(
      {
        user_id: auth.profile.id,
        company_name: body.company_name || body.firm_name || 'My Company',
        bio: body.bio,
        specializations: body.specializations || [],
        service_cities: body.service_cities || (body.city ? [body.city] : []),
        service_states: body.service_states || (body.state ? [body.state] : []),
        gst_number: body.gst_number,
        team_size: body.team_size,
        years_experience: body.years_experience,
      },
      { onConflict: 'user_id' }
    )
  }

  // Best-effort welcome email — never fail onboarding
  try {
    const to = auth.profile.email || (auth.user as { email?: string } | null)?.email
    if (to) {
      const name =
        (body.full_name as string) ||
        auth.profile.full_name ||
        String(to).split('@')[0] ||
        'there'
      await send(to, 'Welcome to 5Bloc', WelcomeEmail(name))
    }
  } catch (e) {
    console.warn('Welcome email failed (non-blocking):', e)
  }

  const userId = auth.user.id
  await analytics.setIdentity(
    userId,
    {
      email: auth.profile.email,
      name: (body.full_name as string) || auth.profile.full_name || undefined,
      plan: auth.profile.plan,
    },
  )
  await analytics.trackEvent(
    'onboarding_completed',
    { role },
    { userId, request: req },
  )

  return NextResponse.json({ ok: true, redirect: homeForRole(role) })
}

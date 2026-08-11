import { NextResponse } from 'next/server'
import { shouldServeMockData, liveDataUnavailableResponse, hasSupabaseEnv } from '@/lib/data/mock-guard'
import { getAuthUserOrNull } from '@/lib/supabase/get-user'
import { MOCK_PROJECTS, MOCK_MEMBERS } from '@/lib/data/mock-store'
import { canUse, type Plan } from '@/lib/payments/gates'

export async function GET() {
  const auth = await getAuthUserOrNull()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (shouldServeMockData(auth)) {
    const role = auth.profile.role
    if (role === 'architect') {
      return NextResponse.json({ projects: MOCK_PROJECTS })
    }
    const memberProjectIds = MOCK_MEMBERS.filter(
      (m) => m.user_id === auth.profile.id && m.accepted_at
    ).map((m) => m.project_id)
    return NextResponse.json({
      projects: MOCK_PROJECTS.filter((p) => memberProjectIds.includes(p.id)),
    })
  }
  if (!hasSupabaseEnv() || !auth.supabase) {
    return NextResponse.json(liveDataUnavailableResponse(), { status: 503 })
  }


  const role = auth.profile.role
  if (role === 'architect' && auth.orgId) {
    const { data, error } = await auth.supabase
      .from('projects')
      .select('*')
      .eq('org_id', auth.orgId)
      .order('created_at', { ascending: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    const projects = (data || []).map((p: any) => ({
      ...p,
      phase: p.phase_key || p.phase,
    }))
    return NextResponse.json({ projects })
  }

  const { data: memberships } = await auth.supabase
    .from('project_members')
    .select('project_id')
    .eq('profile_id', auth.profile.id)
    .not('accepted_at', 'is', null)

  const ids = (memberships || []).map((m: { project_id: string }) => m.project_id)
  if (ids.length === 0) return NextResponse.json({ projects: [] })

  const { data, error } = await auth.supabase.from('projects').select('*').in('id', ids)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const projects = (data || []).map((p: any) => ({
    ...p,
    phase: p.phase_key || p.phase,
  }))
  return NextResponse.json({ projects })
}

export async function POST(req: Request) {
  const auth = await getAuthUserOrNull()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (auth.profile.role !== 'architect') {
    return NextResponse.json({ error: 'Only architects can create projects' }, { status: 403 })
  }

  const body = await req.json()
  if (!body.name) return NextResponse.json({ error: 'name required' }, { status: 400 })

  if (shouldServeMockData(auth)) {
    const plan = (auth.profile.plan || 'free') as Plan
    const existing = MOCK_PROJECTS.length
    if (plan === 'free' && existing >= 3 && !canUse(plan, 'projects:unlimited')) {
      return NextResponse.json({ error: 'Free plan limit: 3 projects' }, { status: 402 })
    }
    const project = {
      id: `proj-${Date.now()}`,
      org_id: auth.orgId || 'mock-org-id',
      ...body,
      phase: body.phase || 'pre_design',
      status: 'active',
      portal_enabled: false,
      portal_token: `token-${Date.now()}`,
      created_at: new Date().toISOString(),
    }
    MOCK_PROJECTS.unshift(project as any)
    return NextResponse.json({ project }, { status: 201 })
  }
  if (!hasSupabaseEnv() || !auth.supabase) {
    return NextResponse.json(liveDataUnavailableResponse(), { status: 503 })
  }


  if (!auth.orgId) {
    return NextResponse.json({ error: 'Complete firm onboarding first' }, { status: 400 })
  }

  const { count } = await auth.supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', auth.orgId)

  const plan = (auth.profile.plan || 'free') as Plan
  if (plan === 'free' && (count || 0) >= 3) {
    return NextResponse.json({ error: 'Free plan limit: 3 projects. Upgrade to Solo.' }, { status: 402 })
  }

  const { data: project, error } = await auth.supabase
    .from('projects')
    .insert({
      org_id: auth.orgId,
      name: body.name,
      type: body.type,
      city: body.city,
      state: body.state,
      address: body.address,
      total_sqft: body.total_sqft,
      floors: body.floors,
      spec_level: body.spec_level,
      client_id: body.client_id || null,
      brief: body.brief,
      construction_cost: body.construction_cost || null,
      architect_fee: body.architect_fee || null,
      architect_fee_pct: body.architect_fee_pct || null,
      start_date: body.start_date || null,
      estimated_end: body.estimated_end || null,
      end_date: body.estimated_end || null,
      is_rera_registered: body.is_rera_registered || false,
      rera_number: body.rera_number || null,
      created_by: auth.profile.id,
      status: 'active',
      phase: 1,
      phase_key: body.phase || 'pre_design',
      portal_enabled: false,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Normalize for app consumers that expect text `phase`
  if (project && !project.phase_key) project.phase = 'pre_design'
  else if (project) project.phase = project.phase_key || project.phase

  const phases = [
    'pre_design',
    'schematic_design',
    'design_development',
    'construction_docs',
    'bidding',
    'permits',
    'construction_admin',
  ]
  await auth.supabase.from('phase_milestones').insert(
    phases.map((phase) => ({
      project_id: project.id,
      org_id: auth.orgId,
      phase,
      phase_key: phase,
      label: phase.replaceAll('_', ' '),
      completion: 0,
      completion_pct: 0,
      fee: 0,
      fee_amount: 0,
      paid: false,
      fee_paid: false,
    }))
  )

  await auth.supabase.from('project_members').insert({
    project_id: project.id,
    profile_id: auth.profile.id,
    role: 'architect',
    accepted_at: new Date().toISOString(),
    can_upload: true,
    can_comment: true,
    can_approve: true,
    invited_by: auth.profile.id,
  })

  await auth.supabase.from('activity_log').insert({
    project_id: project.id,
    org_id: auth.orgId,
    user_id: auth.profile.id,
    action: 'project.created',
    entity_type: 'project',
    entity_id: project.id,
    entity_name: project.name,
  })

  // Optional: post project for open bidding → public tender cards for contractors/vendors
  let openTender = null as any
  const services: string[] = Array.isArray(body.services_needed)
    ? body.services_needed.map((s: string) => String(s).trim()).filter(Boolean)
    : []
  if (body.open_for_bidding && services.length > 0) {
    const { data: tender, error: tenderError } = await auth.supabase
      .from('tenders')
      .insert({
        org_id: auth.orgId,
        project_id: project.id,
        title: project.name,
        scope:
          body.brief ||
          `Open for bidding — services: ${services.join(', ')}. ${body.city || ''} ${body.state || ''}`.trim(),
        trade_type: services[0],
        services,
        project_name: project.name,
        city: body.city || project.city || null,
        budget_min: body.budget_min ?? null,
        budget_max: body.construction_cost ?? body.budget_max ?? null,
        deadline: body.bid_deadline || null,
        visibility: 'public',
        status: 'open',
      })
      .select()
      .single()
    if (!tenderError) openTender = tender
  }

  return NextResponse.json({ project, open_tender: openTender }, { status: 201 })
}

import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { isMockAuthEnabled } from '@/lib/rbac/mock'
import { liveDataUnavailableResponse, hasSupabaseEnv } from '@/lib/data/mock-guard'
import {
  MOCK_DOCUMENTS,
  MOCK_MILESTONES,
  MOCK_PORTAL_SETTINGS,
  MOCK_PROJECTS,
} from '@/lib/data/mock-store'
import { notifyUser } from '@/lib/notifications/notify'

type Ctx = { params: Promise<{ token: string }> }

async function anonClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll() {},
      },
    }
  )
}

export async function GET(_req: Request, ctx: Ctx) {
  const { token } = await ctx.params

  if (isMockAuthEnabled()) {
    const project = MOCK_PROJECTS.find((p) => p.portal_token === token)
    if (!project || !project.portal_enabled) {
      return NextResponse.json({ error: 'Portal not found or disabled' }, { status: 404 })
    }
    return NextResponse.json({
      project,
      org_name: 'Mock Firm',
      milestones: MOCK_MILESTONES.filter((m) => m.project_id === project.id),
      documents: MOCK_DOCUMENTS.filter((d) => d.project_id === project.id && d.shared_with_client),
      settings: MOCK_PORTAL_SETTINGS,
    })
  }

  if (!hasSupabaseEnv()) {
    return NextResponse.json(liveDataUnavailableResponse(), { status: 503 })
  }

  const supabase = await anonClient()
  const { data, error } = await supabase.rpc('get_portal_project', { p_token: token })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Portal not found or disabled' }, { status: 404 })
  return NextResponse.json(data)
}

export async function POST(req: Request, ctx: Ctx) {
  const { token } = await ctx.params
  const body = await req.json()

  if (isMockAuthEnabled()) {
    if (body.action === 'approve' || body.action === 'reject') {
      const doc = MOCK_DOCUMENTS.find((d) => d.id === body.document_id)
      if (doc) doc.approval_status = body.action === 'approve' ? 'approved' : 'rejected'
      return NextResponse.json({ ok: true })
    }
    if (body.action === 'question') {
      return NextResponse.json({ ok: true, question_id: `pq-${Date.now()}` })
    }
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  }

  if (!hasSupabaseEnv()) {
    return NextResponse.json(liveDataUnavailableResponse(), { status: 503 })
  }

  const supabase = await anonClient()

  if (body.action === 'approve' || body.action === 'reject') {
    if (!body.document_id) {
      return NextResponse.json({ error: 'document_id required' }, { status: 400 })
    }
    const { data, error } = await supabase.rpc('approve_portal_document', {
      p_token: token,
      p_document_id: body.document_id,
      p_action: body.action,
      p_note: body.note || null,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (data && data.ok === false) {
      return NextResponse.json({ error: data.error || 'Action failed' }, { status: 400 })
    }

    // Notify project architects / uploaders when client acts on a shared doc
    const { data: doc } = await supabase
      .from('documents')
      .select('name, original_filename, uploaded_by, project_id')
      .eq('id', body.document_id)
      .maybeSingle()
    if (doc?.uploaded_by) {
      await notifyUser(supabase, {
        userId: doc.uploaded_by,
        title: `Client ${body.action === 'approve' ? 'approved' : 'rejected'} document`,
        body: doc.name || doc.original_filename || 'A document',
        type: 'portal',
        href: doc.project_id ? `/projects/${doc.project_id}/documents` : undefined,
      })
    }

    return NextResponse.json({ ok: true, result: data })
  }

  if (body.action === 'question') {
    if (!body.question) {
      return NextResponse.json({ error: 'question required' }, { status: 400 })
    }
    const { data, error } = await supabase.rpc('submit_portal_question', {
      p_token: token,
      p_question: body.question,
      p_name: body.name || null,
      p_email: body.email || null,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (data && data.ok === false) {
      return NextResponse.json({ error: data.error || 'Failed to submit' }, { status: 400 })
    }

    const { data: portal } = await supabase.rpc('get_portal_project', { p_token: token })
    const projectId = portal?.project?.id
    if (projectId) {
      const { data: architects } = await supabase
        .from('project_members')
        .select('profile_id')
        .eq('project_id', projectId)
        .eq('role', 'architect')
        .not('profile_id', 'is', null)
      for (const m of architects || []) {
        if (!m.profile_id) continue
        await notifyUser(supabase, {
          userId: m.profile_id,
          title: 'Client portal question',
          body: String(body.question).slice(0, 140),
          type: 'portal',
          href: `/projects/${projectId}`,
        })
      }
    }

    return NextResponse.json({ ok: true, question_id: data?.id })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}

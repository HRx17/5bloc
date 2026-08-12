import { NextResponse } from 'next/server'
import { shouldServeMockData, liveDataUnavailableResponse, hasSupabaseEnv } from '@/lib/data/mock-guard'
import { getAuthUserOrNull } from '@/lib/supabase/get-user'
export async function PATCH(req: Request) {
  const auth = await getAuthUserOrNull()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const allowed = [
    'full_name',
    'phone',
    'avatar_url',
    'notify_email',
    'notify_rfi',
    'notify_bids',
    'notify_approvals',
  ]

  if (shouldServeMockData(auth)) {
    return NextResponse.json({ ok: true, profile: { ...auth.profile, ...body } })
  }
  if (!hasSupabaseEnv() || !auth.supabase) {
    return NextResponse.json(liveDataUnavailableResponse(), { status: 503 })
  }


  if ('avatar_url' in body && body.avatar_url) {
    const value = String(body.avatar_url)
    const isHttp = /^https?:\/\//i.test(value)
    const isInlineImage = /^data:image\/(png|jpeg|jpg|webp);base64,/i.test(value)
    if (!isHttp && !isInlineImage) {
      return NextResponse.json({ error: 'Unsupported avatar format' }, { status: 400 })
    }
    if (isInlineImage && value.length > 300_000) {
      return NextResponse.json({ error: 'Avatar is too large. Use an image under 2MB.' }, { status: 413 })
    }
  }

  const updates: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) updates[key] = body[key]
  }

  if (body.org && auth.orgId && auth.profile.role === 'architect') {
    await auth.supabase
      .from('organisations')
      .update({
        name: body.org.name,
        gst_number: body.org.gst,
        city: body.org.city,
        address: body.org.address,
      })
      .eq('id', auth.orgId)
  }

  const { data, error } = await auth.supabase
    .from('profiles')
    .update(updates)
    .eq('id', auth.profile.id)
    .select('*, organisations!profiles_org_id_fkey(*)')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ profile: data })
}

export async function GET() {
  const auth = await getAuthUserOrNull()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json({ profile: auth.profile, orgId: auth.orgId, isMock: auth.isMock })
}

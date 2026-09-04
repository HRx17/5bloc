import { createFileRoute } from '@tanstack/react-router'
import { getAuthUserOrNull, json } from '@/lib/api/get-user.server'
const handlePATCH = async ({ request }: any) => {
  const auth = await getAuthUserOrNull(request)
  if (!auth) return json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const allowed = [
    'full_name',
    'phone',
    'avatar_url',
    'notify_email',
    'notify_rfi',
    'notify_bids',
    'notify_approvals',
    'notification_preferences',
    'notify_meetings',
  ]



  if ('avatar_url' in body && body.avatar_url) {
    const value = String(body.avatar_url)
    const isHttp = /^https?:\/\//i.test(value)
    const isInlineImage = /^data:image\/(png|jpeg|jpg|webp);base64,/i.test(value)
    if (!isHttp && !isInlineImage) {
      return json({ error: 'Unsupported avatar format' }, { status: 400 })
    }
    if (isInlineImage && value.length > 300_000) {
      return json({ error: 'Avatar is too large. Use an image under 2MB.' }, { status: 413 })
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
  if (error && /notify_meetings/i.test(error.message)) {
    const { notify_meetings, ...rest } = updates
    const prefs =
      rest.notification_preferences && typeof rest.notification_preferences === 'object'
        ? { ...(rest.notification_preferences as Record<string, unknown>), meetings: notify_meetings }
        : { meetings: notify_meetings }
    const fallback = await auth.supabase
      .from('profiles')
      .update({ ...rest, notification_preferences: prefs })
      .eq('id', auth.profile.id)
      .select('*, organisations!profiles_org_id_fkey(*)')
      .single()
    if (fallback.error) return json({ error: fallback.error.message }, { status: 500 })
    return json({ profile: fallback.data })
  }
  if (error) return json({ error: error.message }, { status: 500 })
  return json({ profile: data })
}

const handleGET = async ({ request }: any) => {
  const auth = await getAuthUserOrNull(request)
  if (!auth) return json({ error: 'Unauthorized' }, { status: 401 })
  return json({ profile: auth.profile, orgId: auth.orgId, isMock: auth.isMock })
}

export const Route = createFileRoute('/api/me')({
  server: {
    handlers: {
        PATCH: handlePATCH,
        GET: handleGET,
    },
  },
})

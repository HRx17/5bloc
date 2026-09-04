import { createFileRoute } from '@tanstack/react-router'
import { getAuthUserOrNull, json } from '@/lib/api/get-user.server'
import { createSupabasePublicClient } from '@/lib/supabase/server'
import { homeForRole, isRoleKey } from '@/lib/rbac/roles'

const handleGET = async ({ request }: any) => {
  const token = new URL(request.url).searchParams.get('token')
  if (!token) return json({ error: 'token required' }, { status: 400 })

  const supabase = createSupabasePublicClient()
  const { data, error } = await supabase.rpc('get_org_invite_by_token', { p_token: token })
  if (error) return json({ error: error.message }, { status: 500 })
  const invite = data as any
  if (!invite) return json({ error: 'Invalid invite' }, { status: 404 })

  const expired = !!invite.expires_at && new Date(invite.expires_at) < new Date()
  return json({ invite: { ...invite, expired } })
}

const handlePOST = async ({ request }: any) => {
  const body = await request.json().catch(() => ({}))
  const token = body.token
  if (!token) return json({ error: 'token required' }, { status: 400 })

  const auth = await getAuthUserOrNull(request)
  if (!auth) return json({ error: 'Must be signed in to accept' }, { status: 401 })

  const { data, error } = await auth.supabase.rpc('accept_org_invite', {
    p_token: token,
    p_full_name: body.full_name || null,
  })
  if (error) return json({ error: error.message }, { status: 500 })
  const result = data as any
  if (!result?.ok) return json({ error: result?.error || 'Accept failed' }, { status: 400 })

  const role = result.role
  return json({
    ok: true,
    org_id: result.org_id,
    role,
    redirect: isRoleKey(role) ? homeForRole(role) : '/dashboard',
  })
}

export const Route = createFileRoute('/api/org/invites/accept')({
  server: { handlers: { GET: handleGET, POST: handlePOST } },
})

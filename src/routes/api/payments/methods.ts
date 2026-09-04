import { createFileRoute } from '@tanstack/react-router'
import { getAuthUserOrNull, json } from '@/lib/api/get-user.server'

const MOCK_METHODS: any[] = []

function last4Of(raw: string) {
  const digits = String(raw).replace(/\D/g, '')
  return digits.slice(-4)
}

const UPI_RE = /^[\w.\-]{2,}@[a-zA-Z]{2,}$/

const handleGET = async ({ request }: any) => {
  const auth = await getAuthUserOrNull(request)
  if (!auth) return json({ error: 'Unauthorized' }, { status: 401 })


  const { data, error } = await auth.supabase
    .from('payment_methods')
    .select('*')
    .eq('profile_id', auth.profile.id)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false })
  if (error) return json({ error: error.message }, { status: 500 })
  return json({ methods: data || [] })
}

const handlePOST = async ({ request }: any) => {
  const auth = await getAuthUserOrNull(request)
  if (!auth) return json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const kind: 'card' | 'upi' | 'netbanking' = body.kind || 'card'

  // Clients send only the last four digits — a full card number is never accepted or stored.
  const last4 = kind === 'card' ? last4Of(body.last4 || '') : null

  if (kind === 'upi' && !UPI_RE.test(String(body.upi_vpa || '').trim())) {
    return json({ error: 'Enter a valid UPI ID (name@bank)' }, { status: 400 })
  }
  if (kind === 'card' && (!last4 || last4.length !== 4)) {
    return json({ error: 'Card last 4 digits are required' }, { status: 400 })
  }

  const row = {
    profile_id: auth.profile.id,
    org_id: auth.orgId,
    kind,
    label: body.label || null,
    brand: kind === 'card' ? body.brand || 'Card' : null,
    last4,
    upi_vpa: kind === 'upi' ? String(body.upi_vpa).trim() : null,
    exp_month: body.exp_month ? Number(body.exp_month) : null,
    exp_year: body.exp_year ? Number(body.exp_year) : null,
    provider: 'razorpay',
    is_default: !!body.is_default,
  }


  const { count } = await auth.supabase
    .from('payment_methods')
    .select('id', { count: 'exact', head: true })
    .eq('profile_id', auth.profile.id)

  const makeDefault = row.is_default || !count

  if (makeDefault) {
    await auth.supabase
      .from('payment_methods')
      .update({ is_default: false })
      .eq('profile_id', auth.profile.id)
  }

  const { data, error } = await auth.supabase
    .from('payment_methods')
    .insert({ ...row, is_default: makeDefault })
    .select()
    .single()
  if (error) return json({ error: error.message }, { status: 500 })
  return json({ method: data }, { status: 201 })
}

const handlePATCH = async ({ request }: any) => {
  const auth = await getAuthUserOrNull(request)
  if (!auth) return json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  if (!body.id) return json({ error: 'id required' }, { status: 400 })


  await auth.supabase
    .from('payment_methods')
    .update({ is_default: false })
    .eq('profile_id', auth.profile.id)

  const { error } = await auth.supabase
    .from('payment_methods')
    .update({ is_default: true })
    .eq('id', body.id)
    .eq('profile_id', auth.profile.id)
  if (error) return json({ error: error.message }, { status: 500 })
  return json({ ok: true })
}

const handleDELETE = async ({ request }: any) => {
  const auth = await getAuthUserOrNull(request)
  if (!auth) return json({ error: 'Unauthorized' }, { status: 401 })

  const id = new URL(request.url).searchParams.get('id')
  if (!id) return json({ error: 'id required' }, { status: 400 })


  const { error } = await auth.supabase
    .from('payment_methods')
    .delete()
    .eq('id', id)
    .eq('profile_id', auth.profile.id)
  if (error) return json({ error: error.message }, { status: 500 })

  // Promote another method so the account always has a default
  const { data: remaining } = await auth.supabase
    .from('payment_methods')
    .select('id, is_default')
    .eq('profile_id', auth.profile.id)
    .order('created_at', { ascending: false })

  if (remaining && remaining.length > 0 && !remaining.some((m: any) => m.is_default)) {
    await auth.supabase
      .from('payment_methods')
      .update({ is_default: true })
      .eq('id', remaining[0].id)
  }

  return json({ ok: true })
}

export const Route = createFileRoute('/api/payments/methods')({
  server: {
    handlers: {
        GET: handleGET,
        POST: handlePOST,
        PATCH: handlePATCH,
        DELETE: handleDELETE,
    },
  },
})

import { createFileRoute } from '@tanstack/react-router'
import { json } from '@/lib/api/get-user.server'
import { createClient } from '@supabase/supabase-js'
import { hasSupabaseEnv } from '@/lib/rbac/mock'

const handlePOST = async ({ request }: any) => {
  try {
    const body = await request.json()
    const email = String(body.email || '')
      .trim()
      .toLowerCase()
    if (!email || !email.includes('@')) {
      return json({ error: 'Valid email required' }, { status: 400 })
    }


    const supabase = createClient(
      process.env['SUPABASE_URL']!,
      process.env['SUPABASE_PUBLISHABLE_KEY']!,
      { auth: { persistSession: false } }
    )

    const { error } = await supabase.from('waitlist').insert({
      email,
      name: body.name || null,
      firm: body.practice || body.firm || null,
      role: body.role || null,
    })

    if (error) {
      // Unique email: treat as success so form doesn't leak membership
      if (String(error.message || '').toLowerCase().includes('duplicate')) {
        return json({ ok: true, already: true })
      }
      return json({ error: error.message }, { status: 500 })
    }

    return json({ ok: true })
  } catch (e: any) {
    return json({ error: e?.message || 'Failed' }, { status: 500 })
  }
}

export const Route = createFileRoute('/api/waitlist')({
  server: {
    handlers: {
        POST: handlePOST,
    },
  },
})

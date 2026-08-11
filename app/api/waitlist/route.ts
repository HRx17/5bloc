import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { hasSupabaseEnv } from '@/lib/rbac/mock'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const email = String(body.email || '')
      .trim()
      .toLowerCase()
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
    }

    if (!hasSupabaseEnv()) {
      return NextResponse.json({ ok: true, mock: true })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
        return NextResponse.json({ ok: true, already: true })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 })
  }
}

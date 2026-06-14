import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const phone = req.nextUrl.searchParams.get('phone')

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any)
      .from('whatsapp_messages')
      .select('*')
      .order('received_at', { ascending: false })
      .limit(100)

    if (phone) {
      query = query.or(`from_number.eq.${phone},to_number.eq.${phone}`)
    }

    const { data, error } = await query
    if (error) throw error

    // Group by contact phone number to get conversation list
    if (!phone) {
      const contacts: Record<string, any> = {}
      for (const msg of (data ?? [])) {
        const contactPhone = msg.direction === 'inbound' ? msg.from_number : msg.to_number
        if (!contactPhone) continue
        if (!contacts[contactPhone] || new Date(msg.received_at) > new Date(contacts[contactPhone].lastAt)) {
          contacts[contactPhone] = {
            phone:   contactPhone,
            lastMsg: msg.text ?? `[${msg.type}]`,
            lastAt:  msg.received_at,
            unread:  msg.direction === 'inbound' && msg.status === 'received' ? 1 : 0,
          }
        } else if (msg.direction === 'inbound' && msg.status === 'received') {
          contacts[contactPhone].unread++
        }
      }
      return NextResponse.json({ contacts: Object.values(contacts) })
    }

    return NextResponse.json({ messages: data ?? [] })
  } catch (e: any) {
    // Table might not exist yet
    if (e?.message?.includes('does not exist') || e?.code === '42P01') {
      return NextResponse.json({ contacts: [], messages: [], tableNotFound: true })
    }
    console.error('WhatsApp messages error:', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

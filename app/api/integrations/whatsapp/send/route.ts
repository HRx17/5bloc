import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { sendTextMessage } from '@/lib/integrations/whatsapp'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!process.env.WHATSAPP_TOKEN) {
    return NextResponse.json({ error: 'WhatsApp not configured' }, { status: 503 })
  }

  try {
    const { to, text } = await req.json()
    if (!to || !text) return NextResponse.json({ error: 'to and text are required' }, { status: 400 })

    // Normalise phone number — strip spaces, dashes, leading +
    const phone = to.replace(/[\s\-\(\)]/g, '').replace(/^\+/, '')

    const { messageId } = await sendTextMessage(phone, text)

    // Store outbound message
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('whatsapp_messages')
      .insert({
        message_id:  messageId,
        from_number: process.env.WHATSAPP_PHONE_NUMBER_ID,
        to_number:   phone,
        type:        'text',
        text,
        direction:   'outbound',
        status:      'sent',
        received_at: new Date().toISOString(),
      })

    return NextResponse.json({ success: true, messageId })
  } catch (e: any) {
    console.error('WhatsApp send error:', e?.message)
    return NextResponse.json({ error: e?.message ?? 'Send failed' }, { status: 500 })
  }
}

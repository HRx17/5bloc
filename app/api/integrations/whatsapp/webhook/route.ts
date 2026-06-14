import { NextRequest, NextResponse } from 'next/server'
import { parseWebhookMessages, verifySignature, markAsRead } from '@/lib/integrations/whatsapp'
import { createSupabaseServer } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * GET — Meta webhook verification challenge.
 * Meta sends hub.mode, hub.verify_token, hub.challenge.
 * We must return hub.challenge as plain text to confirm the endpoint.
 */
export async function GET(req: NextRequest) {
  const mode      = req.nextUrl.searchParams.get('hub.mode')
  const token     = req.nextUrl.searchParams.get('hub.verify_token')
  const challenge = req.nextUrl.searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    console.log('WhatsApp webhook verified successfully')
    return new NextResponse(challenge, { status: 200 })
  }

  console.error('WhatsApp webhook verification failed', { mode, token })
  return new NextResponse('Forbidden', { status: 403 })
}

/**
 * POST — Incoming messages and status updates from Meta.
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody  = await req.text()
    const signature = req.headers.get('x-hub-signature-256') ?? ''

    // Verify the payload is genuinely from Meta
    if (!verifySignature(rawBody, signature)) {
      console.error('WhatsApp signature mismatch')
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const body = JSON.parse(rawBody)
    const messages = parseWebhookMessages(body)

    if (messages.length > 0) {
      const supabase = await createSupabaseServer()

      for (const msg of messages) {
        // Store in whatsapp_messages table (see DDL below)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from('whatsapp_messages')
          .upsert({
            message_id:  msg.id,
            from_number: msg.from,
            type:        msg.type,
            text:        msg.text ?? msg.caption ?? null,
            media_id:    msg.mediaId ?? null,
            filename:    msg.filename ?? null,
            received_at: new Date(parseInt(msg.timestamp) * 1000).toISOString(),
            direction:   'inbound',
            status:      'received',
          }, { onConflict: 'message_id' })

        // Auto mark as read
        await markAsRead(msg.id)
      }
    }

    // Always return 200 to Meta — otherwise it retries
    return NextResponse.json({ status: 'ok' })
  } catch (e) {
    console.error('WhatsApp webhook error:', e)
    // Still return 200 so Meta doesn't retry endlessly
    return NextResponse.json({ status: 'ok' })
  }
}

/*
 * Supabase DDL — run once in SQL Editor:
 *
 * create table if not exists public.whatsapp_messages (
 *   id           uuid primary key default gen_random_uuid(),
 *   message_id   text unique not null,
 *   from_number  text not null,
 *   to_number    text,
 *   type         text default 'text',
 *   text         text,
 *   media_id     text,
 *   filename     text,
 *   direction    text not null default 'inbound',  -- 'inbound' | 'outbound'
 *   status       text default 'received',
 *   received_at  timestamptz default now(),
 *   org_id       uuid references public.organisations(id) on delete cascade
 * );
 * alter table public.whatsapp_messages enable row level security;
 * create policy "Authenticated users can read messages"
 *   on public.whatsapp_messages for select
 *   using (auth.role() = 'authenticated');
 * create policy "Service role can insert messages"
 *   on public.whatsapp_messages for insert
 *   with check (true);
 */

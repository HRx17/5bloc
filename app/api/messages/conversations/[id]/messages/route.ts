import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * Send a message in a conversation. Caller must be a member.
 * Body: { body: string }
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: conversationId } = await params
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: me } = await supabase
    .from('profiles')
    .select('id')
    .eq('auth_id', user.id)
    .maybeSingle()
  if (!me) return NextResponse.json({ error: 'Profile not found' }, { status: 400 })

  const { data: membership } = await supabase
    .from('conversation_members')
    .select('id')
    .eq('conversation_id', conversationId)
    .eq('profile_id', me.id)
    .maybeSingle()
  if (!membership) return NextResponse.json({ error: 'Not a member of this conversation' }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const text = typeof body.body === 'string' ? body.body.trim() : ''
  if (!text) return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 })
  if (text.length > 8000) return NextResponse.json({ error: 'Message is too long' }, { status: 400 })

  const { data: message, error } = await supabase
    .from('messages')
    .insert({ conversation_id: conversationId, sender_id: me.id, body: text })
    .select('id, conversation_id, sender_id, body, attachment_url, attachment_name, created_at, sender:profiles(id, full_name, email, role, avatar_url)')
    .single()

  if (error || !message) {
    return NextResponse.json({ error: error?.message || 'Could not send message' }, { status: 500 })
  }

  return NextResponse.json({ message })
}

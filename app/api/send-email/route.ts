import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { send } from '@/lib/email/resend'

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { to, subject, htmlContent } = await request.json()

    if (!to || !subject || !htmlContent) {
      return NextResponse.json(
        { error: 'Missing required parameters: to, subject, or htmlContent' },
        { status: 400 },
      )
    }

    if (typeof to !== 'string' || typeof subject !== 'string' || typeof htmlContent !== 'string') {
      return NextResponse.json({ error: 'Invalid parameter types' }, { status: 400 })
    }

    if (subject.length > 500 || htmlContent.length > 200_000) {
      return NextResponse.json({ error: 'Payload too large' }, { status: 413 })
    }

    const { data, error } = await send(to, subject, htmlContent)

    if (error) {
      console.error('Resend dispatch error returned:', error)
      return NextResponse.json({ error: 'Email dispatch failed' }, { status: 500 })
    }

    return NextResponse.json({ success: true, messageId: data?.id })
  } catch (err: unknown) {
    console.error('API send-email error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

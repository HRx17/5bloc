import { NextResponse } from 'next/server'
import { send } from '@/lib/email/resend'

export async function POST(request: Request) {
  try {
    const { to, subject, htmlContent } = await request.json()

    if (!to || !subject || !htmlContent) {
      return NextResponse.json({ error: 'Missing required parameters: to, subject, or htmlContent' }, { status: 400 })
    }

    const { data, error } = await send(to, subject, htmlContent)

    if (error) {
      console.error('Resend dispatch error returned:', error)
      return NextResponse.json({ error: 'Email dispatch failed' }, { status: 500 })
    }

    return NextResponse.json({ success: true, messageId: data?.id })
  } catch (err: any) {
    console.error('API send-email error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

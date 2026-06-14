/**
 * WhatsApp Business API helpers
 * Uses the Cloud API (v20.0) via Meta's graph.facebook.com endpoint.
 */

const TOKEN            = process.env.WHATSAPP_TOKEN!
const PHONE_NUMBER_ID  = process.env.WHATSAPP_PHONE_NUMBER_ID!
const API_VERSION      = 'v20.0'
const BASE             = `https://graph.facebook.com/${API_VERSION}`

export interface WaMessage {
  id:        string
  from:      string   // phone number e.g. "919876543210"
  timestamp: string   // unix seconds string
  type:      'text' | 'image' | 'document' | 'audio' | 'video' | 'location' | 'unknown'
  text?:     string
  mediaId?:  string
  caption?:  string
  filename?: string
}

export interface WaContact {
  phone:   string
  name:    string
  lastMsg: string
  lastAt:  number   // unix ms
  unread:  number
}

/** Send a plain text message */
export async function sendTextMessage(to: string, text: string): Promise<{ messageId: string }> {
  const res = await fetch(`${BASE}/${PHONE_NUMBER_ID}/messages`, {
    method:  'POST',
    headers: {
      Authorization:  `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type:    'individual',
      to,
      type:              'text',
      text:              { preview_url: false, body: text },
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`WhatsApp send failed: ${err}`)
  }
  const data = await res.json()
  return { messageId: data.messages?.[0]?.id ?? '' }
}

/** Send a template message (for first contact — 24hr window restriction) */
export async function sendTemplateMessage(to: string, templateName: string, languageCode = 'en_US') {
  const res = await fetch(`${BASE}/${PHONE_NUMBER_ID}/messages`, {
    method:  'POST',
    headers: {
      Authorization:  `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type:     'template',
      template: { name: templateName, language: { code: languageCode } },
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`WhatsApp template send failed: ${err}`)
  }
  return res.json()
}

/** Mark a message as read */
export async function markAsRead(messageId: string) {
  await fetch(`${BASE}/${PHONE_NUMBER_ID}/messages`, {
    method:  'POST',
    headers: {
      Authorization:  `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      status:            'read',
      message_id:        messageId,
    }),
  })
}

/** Parse a raw webhook payload into a list of WaMessages */
export function parseWebhookMessages(body: any): WaMessage[] {
  const messages: WaMessage[] = []
  const entries: any[] = body?.entry ?? []
  for (const entry of entries) {
    for (const change of (entry.changes ?? [])) {
      const value = change.value
      if (value?.messages) {
        for (const m of value.messages) {
          messages.push({
            id:        m.id,
            from:      m.from,
            timestamp: m.timestamp,
            type:      m.type ?? 'unknown',
            text:      m.text?.body,
            mediaId:   m.image?.id ?? m.document?.id ?? m.audio?.id ?? m.video?.id,
            caption:   m.image?.caption ?? m.document?.caption,
            filename:  m.document?.filename,
          })
        }
      }
    }
  }
  return messages
}

/** Verify the webhook signature from Meta */
export function verifySignature(rawBody: string, signature: string): boolean {
  const secret = process.env.META_APP_SECRET
  if (!secret) return true  // skip if not configured
  const crypto = require('crypto')
  const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
  return expected === signature
}

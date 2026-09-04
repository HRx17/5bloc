/**
 * AI access through the platform's built-in AI gateway.
 * No user-supplied key is required — LOVABLE_API_KEY is provided by the host.
 */
export const AI_MODEL = 'google/gemini-3-flash'
export const MAX_TOKENS = 2048

export function hasAI(): boolean {
  return !!process.env['LOVABLE_API_KEY']
}

/** Send a single prompt and return the model's text reply. */
export async function completeText(
  prompt: string,
  opts: { model?: string; maxTokens?: number } = {},
): Promise<string> {
  const apiKey = process.env['LOVABLE_API_KEY']
  if (!apiKey) throw new Error('AI is not configured')

  const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: opts.model || AI_MODEL,
      max_tokens: opts.maxTokens || MAX_TOKENS,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`AI request failed (${res.status}): ${detail.slice(0, 200)}`)
  }

  const data: any = await res.json()
  return data?.choices?.[0]?.message?.content ?? ''
}

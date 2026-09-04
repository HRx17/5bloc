/**
 * Anthropic (Claude) access. Uses your own ANTHROPIC_API_KEY.
 * Called over the Messages HTTP API so it runs in the edge runtime.
 */
export const AI_MODEL = 'claude-3-5-sonnet-20241022'
export const MAX_TOKENS = 2048

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'
const ANTHROPIC_VERSION = '2023-06-01'

function apiKey(): string | null {
  return process.env['ANTHROPIC_API_KEY']?.trim() || null
}

export function hasAI(): boolean {
  return !!apiKey()
}

/** Send a single prompt and return the model's text reply. */
export async function completeText(
  prompt: string,
  opts: { model?: string; maxTokens?: number; system?: string } = {},
): Promise<string> {
  const key = apiKey()
  if (!key) throw new Error('AI is not configured')

  const res = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'x-api-key': key,
      'anthropic-version': ANTHROPIC_VERSION,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: opts.model || AI_MODEL,
      max_tokens: opts.maxTokens || MAX_TOKENS,
      ...(opts.system ? { system: opts.system } : {}),
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`Anthropic request failed (${res.status}): ${detail.slice(0, 200)}`)
  }

  const data: any = await res.json()
  const blocks = Array.isArray(data?.content) ? data.content : []
  return blocks
    .filter((b: any) => b?.type === 'text')
    .map((b: any) => b.text)
    .join('')
}

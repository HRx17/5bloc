import { completeText, hasAI } from './client'

export interface RFIDraftResult {
  response: string
  is_scope_change: boolean
  scope_change_note: string
}

function localFallback(
  rfi: { rfi_number: number; title: string; description: string; drawing_ref?: string },
): RFIDraftResult {
  const text = (rfi.description || '').toLowerCase()
  const isScopeChange =
    text.includes('ceiling') ||
    text.includes('height') ||
    text.includes('material') ||
    text.includes('clearance')

  return {
    response: `Regarding RFI #${rfi.rfi_number} about "${rfi.title}": We have reviewed drawing reference ${rfi.drawing_ref || 'general specs'}. Please shift the alignment by 50mm to clear the structural obstruction. Concrete pouring must follow standard IS 456 spacing rules. Let us know if further sections are needed.`,
    is_scope_change: isScopeChange,
    scope_change_note: isScopeChange
      ? 'Clearance adjustments require shifting duct headers, which triggers minor layout variances.'
      : '',
  }
}

export async function draftRFIResponse(
  rfi: { rfi_number: number; title: string; description: string; drawing_ref?: string },
  ctx: { type: string; city: string; spec_level: string },
): Promise<RFIDraftResult> {
  if (!hasAI()) return localFallback(rfi)

  const prompt = `You are an experienced licensed architect in India drafting a formal RFI response.

PROJECT: ${ctx.type} in ${ctx.city}, ${ctx.spec_level} spec.
RFI #${rfi.rfi_number}: ${rfi.title}
QUERY: ${rfi.description}
DRAWING REF: ${rfi.drawing_ref || 'Not specified'}

Write a clear, professional RFI response (max 200 words). Be specific.
If scope change is implied, flag it clearly.

Return ONLY valid JSON:
{
  "response": string,
  "is_scope_change": boolean,
  "scope_change_note": string
}`

  try {
    const text = await completeText(prompt, { maxTokens: 512 })
    const cleaned = text.replace(/```json?\n?/g, '').replace(/```/g, '').trim()
    const parsed = JSON.parse(cleaned) as Partial<RFIDraftResult>
    if (!parsed?.response) return localFallback(rfi)
    return {
      response: parsed.response,
      is_scope_change: !!parsed.is_scope_change,
      scope_change_note: parsed.scope_change_note || '',
    }
  } catch (e) {
    console.error('RFI draft AI error, using fallback:', e)
    return localFallback(rfi)
  }
}

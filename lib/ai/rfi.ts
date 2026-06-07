import { anthropic, AI_MODEL } from './client'

export async function draftRFIResponse(
  rfi: { rfi_number: number; title: string; description: string; drawing_ref?: string },
  ctx: { type: string; city: string; spec_level: string }
) {
  if (!anthropic) {
    console.log('Anthropic API key is missing. Using local RFI response generator fallback.')
    
    const isScopeChange = rfi.description.toLowerCase().includes('ceiling') || 
                          rfi.description.toLowerCase().includes('height') || 
                          rfi.description.toLowerCase().includes('material') ||
                          rfi.description.toLowerCase().includes('clearance')

    return {
      response: `Regarding RFI #${rfi.rfi_number} about "${rfi.title}": We have reviewed drawing reference ${rfi.drawing_ref || 'general specs'}. Please shift the alignment by 50mm to clear the structural obstruction. Concrete pouring must follow standard IS 456 spacing rules. Let us know if further sections are needed.`,
      is_scope_change: isScopeChange,
      scope_change_note: isScopeChange ? 'Clearance adjustments require shifting duct headers, which triggers minor layout variances.' : ''
    }
  }

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

  const res = await anthropic.messages.create({
    model: AI_MODEL, 
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }],
  })
  
  const text = res.content[0].type === 'text' ? res.content[0].text : '{}'
  return JSON.parse(text.replace(/```json?\n?/g, '').replace(/```/g, '').trim())
}

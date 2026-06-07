import { anthropic, AI_MODEL } from './client'

export async function generateSpecClause(
  material: string,
  ctx: { type: string; spec_level: string }
) {
  if (!anthropic) {
    console.log('Anthropic API key is missing. Using local spec clause generator fallback.')
    
    // Provide standard Bureau of Indian Standards (BIS) code compliance clauses offline
    return {
      clause: `SPECIFICATION FOR: ${material.toUpperCase()}\n1. Standards: All materials and workmanship shall comply with relevant Bureau of Indian Standards (BIS) codes (e.g. IS 456 for concrete, IS 269 for cement, IS 2062 for structural steel).\n2. Quality: Materials must be sourced from certified manufacturers and tested on batch arrivals.\n3. Application: Workmanship should comply with layout detail specifications. Finished surface alignment tolerances must be within 3mm over 3 meters.`,
      is_code_refs: ['IS 456:2000', 'IS 269', 'IS 2062'],
      workmanship_notes: 'Alignments to be verified prior to concrete setting. Batch delivery records must be archived in document vault.'
    }
  }

  const prompt = `You are an architect writing construction specs for an Indian ${ctx.type} project (${ctx.spec_level} spec).

MATERIAL/WORK ITEM: ${material}

Write a complete specification clause with: material standards (BIS/IS codes),
quality requirements, workmanship, testing, and measurement.

Return ONLY valid JSON:
{
  "clause": string,
  "is_code_refs": string[],
  "workmanship_notes": string
}`

  const res = await anthropic.messages.create({
    model: AI_MODEL, 
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })
  
  const text = res.content[0].type === 'text' ? res.content[0].text : '{}'
  return JSON.parse(text.replace(/```json?\n?/g, '').replace(/```/g, '').trim())
}

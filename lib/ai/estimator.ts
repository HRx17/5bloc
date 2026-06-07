import { anthropic, AI_MODEL, MAX_TOKENS } from './client'
import ratesData from './rates.json'

export interface EstimatorInput {
  projectType: string
  city:        string
  sqft:        number
  floors:      number
  specLevel:   'standard' | 'premium' | 'luxury'
  notes?:      string
}

export async function generateEstimate(input: EstimatorInput) {
  const cityRates = (ratesData as any)[input.city] || (ratesData as any)['Mumbai']
  const multiplier = { standard: 1.0, premium: 1.5, luxury: 2.2 }[input.specLevel] || 1.5

  // Local programmatic fallback calculation if Anthropic API key is not configured
  if (!anthropic) {
    console.log('Anthropic API key is missing. Using local programmatic quantity surveyor fallback.')
    
    const baseRates = cityRates.standard
    const area = input.sqft
    
    // Programmatic cost estimation matching Indian standard quantity surveying formats
    const items = [
      { category: 'Earthwork', description: 'Excavation in all soils and backfilling', quantity: Math.round(area * 0.05), unit: 'cum', rate: baseRates.excavation_per_cum * multiplier },
      { category: 'Substructure', description: 'Plain & Reinforced Concrete foundations (RCC M25)', quantity: Math.round(area * 0.08), unit: 'cum', rate: baseRates.rcc_m25_per_cum * multiplier },
      { category: 'Superstructure', description: 'Brickwork walls 230mm thick in cement mortar 1:6', quantity: Math.round(area * 0.12), unit: 'sqm', rate: baseRates.brickwork_230mm_per_sqm * multiplier },
      { category: 'Internal Finishes', description: 'Internal cement plastering 12mm thick & primer', quantity: Math.round(area * 2.2), unit: 'sqm', rate: baseRates.plastering_internal_sqm * multiplier },
      { category: 'External Finishes', description: 'External plastering 20mm with weatherproof coat', quantity: Math.round(area * 0.9), unit: 'sqm', rate: baseRates.plastering_external_sqm * multiplier },
      { category: 'Flooring', description: input.specLevel === 'luxury' ? 'Premium Italian Marble layout' : 'Vitrified tiles tiling', quantity: Math.round(area * 0.95), unit: 'sqft', rate: (input.specLevel === 'luxury' ? baseRates.marble_flooring_sqft : baseRates.vitrified_tiles_sqft) * multiplier },
      { category: 'Doors & Windows', description: 'Aluminium glazed frames & flush doors', quantity: Math.round(area * 0.15), unit: 'sqft', rate: baseRates.aluminium_windows_sqft * multiplier },
      { category: 'Electrical', description: 'Concealed copper wiring, conduits & fixtures', quantity: area, unit: 'sqft', rate: baseRates.electrical_per_sqft * multiplier },
      { category: 'Plumbing & Sanitary', description: 'CPVC water lines & premium sanitation fittings', quantity: area, unit: 'sqft', rate: baseRates.plumbing_per_sqft * multiplier },
      { category: 'Waterproofing', description: 'Brickbat coba terrace & toilet waterproofing', quantity: Math.round(area * 0.35), unit: 'sqft', rate: baseRates.waterproofing_terrace_sqft * multiplier }
    ]

    // Calculate item amounts
    const processedItems = items.map(item => ({
      ...item,
      quantity: Math.round(item.quantity),
      rate: Math.round(item.rate),
      amount: Math.round(item.quantity * item.rate)
    }))

    const constructionCost = processedItems.reduce((sum, item) => sum + item.amount, 0)
    
    // Add Architect fee (8% - 10%)
    const feePct = input.specLevel === 'luxury' ? 10 : input.specLevel === 'premium' ? 9 : 8
    const architectFee = Math.round(constructionCost * (feePct / 100))

    processedItems.push({
      category: 'Professional Fees',
      description: `Architectural consultation & milestone drawing sets (${feePct}%)`,
      quantity: 1,
      unit: 'lumpsum',
      rate: architectFee,
      amount: architectFee
    })

    const totalEstimate = constructionCost + architectFee

    return {
      total_estimate: totalEstimate,
      total_min: Math.round(totalEstimate * 0.92),
      total_max: Math.round(totalEstimate * 1.08),
      confidence_range_pct: 8,
      city: input.city,
      spec_level: input.specLevel,
      currency: 'INR',
      generated_at: new Date().toISOString(),
      line_items: processedItems
    }
  }

  const prompt = `You are an expert quantity surveyor in India with 20 years experience.

PROJECT: ${input.projectType} in ${input.city}
AREA: ${input.sqft} sqft (${Math.round(input.sqft * 0.0929)} sqm) across ${input.floors} floors
SPECIFICATION: ${input.specLevel} (${multiplier}x standard rates)
${input.notes ? `SPECIAL REQUIREMENTS: ${input.notes}` : ''}

STANDARD MARKET RATES — ${input.city.toUpperCase()}:
${JSON.stringify(cityRates.standard, null, 2)}

Generate a BOQ with 12–16 line items covering all construction trades.
Include architect fee as the final line item (8–12% of construction cost).

Return ONLY valid JSON, no markdown, no explanation:
{
  "total_estimate": <INR number>,
  "total_min": <total_estimate × 0.92>,
  "total_max": <total_estimate × 1.08>,
  "confidence_range_pct": 8,
  "city": "${input.city}",
  "spec_level": "${input.specLevel}",
  "currency": "INR",
  "generated_at": "${new Date().toISOString()}",
  "line_items": [
    {
      "category": string,
      "description": string,
      "quantity": number,
      "unit": "sqft"|"sqm"|"cum"|"nos"|"rmt"|"lumpsum",
      "rate": <INR per unit>,
      "amount": <INR total>
    }
  ]
}`

  const res = await anthropic.messages.create({
    model: AI_MODEL, 
    max_tokens: MAX_TOKENS,
    messages: [{ role: 'user', content: prompt }],
  })
  
  const text = res.content[0].type === 'text' ? res.content[0].text : '{}'
  return JSON.parse(text.replace(/```json?\n?/g, '').replace(/```/g, '').trim())
}

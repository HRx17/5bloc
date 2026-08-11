import { NextResponse } from 'next/server'
import { getAuthUserOrNull } from '@/lib/supabase/get-user'

/** Lightweight contract risk heuristics — not a substitute for legal review. */
export async function POST(req: Request) {
  const auth = await getAuthUserOrNull()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const text = String(body.text || '').trim()
  if (text.length < 40) {
    return NextResponse.json({ error: 'Paste more contract text to scan' }, { status: 400 })
  }

  const lower = text.toLowerCase()
  const risks: any[] = []
  const missing: any[] = []

  if (/unlimited\s+liab|liability\s+is\s+unlimited|consequential\s+damages/i.test(text)) {
    risks.push({
      clauseNumber: 'Detected',
      title: 'Broad / unlimited liability language',
      text: 'Contract language suggests uncapped or consequential liability exposure.',
      riskLevel: 'high',
      implication: 'May exceed typical professional indemnity cover.',
      remedy: 'Cap liability to fees paid and exclude consequential damages where possible.',
    })
  }
  if (/liquidated\s+damages|0\.5%\s+.*day|per\s+calendar\s+day/i.test(text)) {
    risks.push({
      clauseNumber: 'Detected',
      title: 'Aggressive delay / liquidated damages',
      text: 'Delay penalty language detected.',
      riskLevel: 'high',
      implication: 'High daily LDs can erase fees quickly.',
      remedy: 'Cap LDs (e.g. 5–10% of fee) and limit to delays solely caused by you.',
    })
  }
  if (/indemnif/i.test(text) && /owner|client/i.test(text)) {
    risks.push({
      clauseNumber: 'Detected',
      title: 'Indemnity obligations',
      text: 'Indemnification language is present.',
      riskLevel: 'medium',
      implication: 'One-sided indemnities are often uninsurable.',
      remedy: 'Make indemnity mutual and negligence-based.',
    })
  }

  if (!/limitation of liability/i.test(text)) {
    missing.push({
      category: 'Limitation of Liability',
      description: 'No clear limitation of liability clause found.',
      importance: 'critical',
      suggestedText: 'Architect’s aggregate liability shall not exceed the fees paid under this Agreement.',
    })
  }
  if (!/termination/i.test(text)) {
    missing.push({
      category: 'Termination',
      description: 'No termination-for-convenience / cause language spotted.',
      importance: 'advised',
      suggestedText: 'Either party may terminate for convenience with 30 days’ written notice; fees for work performed remain payable.',
    })
  }

  const score = Math.max(20, 100 - risks.length * 18 - missing.filter((m) => m.importance === 'critical').length * 12)

  return NextResponse.json({
    score,
    risks,
    missing,
    engine: process.env.ANTHROPIC_API_KEY ? 'heuristic+ready' : 'heuristic',
    disclaimer:
      'Heuristic scan only — not legal advice. Connect ANTHROPIC_API_KEY later for deeper AI review.',
  })
}

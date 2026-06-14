import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/supabase/get-user'
import { checkAIRateLimit } from '@/lib/rate-limit'
import { anthropic, AI_MODEL, MAX_TOKENS } from '@/lib/ai/client'

export async function POST(req: NextRequest) {
  try {
    const { profile } = await getAuthUser()

    const limit = await checkAIRateLimit(profile.id, 'contract_scan', profile.plan, profile.ai_add_on)
    if (!limit.allowed) {
      return NextResponse.json({ error: 'Daily scan limit reached', remaining: 0, upgrade_url: '/settings?tab=billing' }, { status: 429 })
    }

    const { contractText } = await req.json()
    if (!contractText || contractText.trim().length < 50) {
      return NextResponse.json({ error: 'Contract text too short' }, { status: 400 })
    }

    if (!anthropic) {
      // Return mock result when API key not configured
      return NextResponse.json({ data: getMockResult(), remaining: limit.remaining })
    }

    const message = await anthropic.messages.create({
      model: AI_MODEL,
      max_tokens: MAX_TOKENS,
      messages: [{
        role: 'user',
        content: `You are a senior Indian construction lawyer specialising in architect-builder contracts. Analyse the following contract text and return a JSON object with this exact structure:

{
  "score": <integer 0-100, higher = safer for architect>,
  "risks": [
    {
      "clauseNumber": "<clause ref>",
      "title": "<short title>",
      "text": "<exact problematic quote>",
      "riskLevel": "high" | "medium" | "low",
      "implication": "<plain-language explanation of risk to architect>",
      "remedy": "<specific amendment recommendation>"
    }
  ],
  "missing": [
    {
      "category": "<category name>",
      "description": "<what is missing and why it matters>",
      "importance": "critical" | "advised",
      "suggestedText": "<draft clause text to add>"
    }
  ]
}

Rules:
- Focus on risks to the ARCHITECT/DESIGNER, not the owner.
- Reference Indian law where applicable (RERA, Arbitration & Conciliation Act 1996, COA guidelines).
- Return ONLY valid JSON, no markdown, no explanation outside the JSON.

Contract text:
${contractText.slice(0, 6000)}`
      }]
    })

    const raw = (message.content[0] as any).text?.trim() ?? ''
    const jsonStart = raw.indexOf('{')
    const jsonEnd = raw.lastIndexOf('}')
    const data = JSON.parse(raw.slice(jsonStart, jsonEnd + 1))

    return NextResponse.json({ data, remaining: limit.remaining })
  } catch (e) {
    console.error('Contract scan API error:', e)
    return NextResponse.json({ error: 'Analysis failed. Please try again.' }, { status: 500 })
  }
}

function getMockResult() {
  return {
    score: 64,
    risks: [
      {
        clauseNumber: 'Clause 12',
        title: 'Unlimited Liability and Consequential Damages',
        text: "The Architect's liability is unlimited and shall extend to consecutive damages, lost revenue, and site clean-up fees.",
        riskLevel: 'high',
        implication: 'Exposes the design firm to liabilities exceeding standard professional indemnity insurance caps. Insurance typically excludes consequential damages (lost revenue).',
        remedy: 'Cap total liability at 100% of the architect fee or a fixed sum (e.g. ₹50 Lakhs) and explicitly exclude consequential damages.'
      },
      {
        clauseNumber: 'Clause 14',
        title: 'Excessive Delay Penalties (Liquidated Damages)',
        text: 'Architect agrees to pay 0.5% of the total contract sum per calendar day of delay...',
        riskLevel: 'high',
        implication: '0.5% per day is extremely high (standard is 0.1% per week, capped at 5-10% total fee). Unrestricted liability for contractor/supplier delays is high-risk.',
        remedy: 'Amend to cap liquidated damages at 5% of the Architect Fee, and specify that penalties only apply for delays solely attributable to the Architect.'
      },
      {
        clauseNumber: 'Clause 22',
        title: 'Broad Indemnification for Owner-Requested Revisions',
        text: 'Architect agrees to defend, indemnify, and hold harmless the Owner from... design revisions requested by the Owner...',
        riskLevel: 'medium',
        implication: 'Requires the architect to indemnify the client for decisions the client forced. Typical professional indemnity policies do not cover such indemnities.',
        remedy: 'Indemnification should be reciprocal and limited to claims arising directly from proven professional negligence of the Architect.'
      }
    ],
    missing: [
      {
        category: 'RERA Compliance',
        description: 'No clause defining architect milestone certifications under RERA Section 4(2)(l)(D).',
        importance: 'critical',
        suggestedText: 'The Architect shall issue Form-4 Certificates of Completion at each construction phase milestone to enable withdrawals from the promoter\'s RERA designated account.'
      },
      {
        category: 'Dispute Resolution',
        description: 'Missing arbitration clause referencing the Arbitration & Conciliation Act 1996.',
        importance: 'advised',
        suggestedText: 'All disputes shall be referred to arbitration under the Arbitration and Conciliation Act, 1996, in Mumbai, by a sole arbitrator.'
      }
    ]
  }
}

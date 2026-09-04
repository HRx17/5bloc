import { completeText, hasAI } from './client'
import {
  byeLawsFor,
  complianceNotesFor,
  defaultPermitsFor,
  normalizeTypology,
  typologyLabel,
} from '@/lib/compliance/typology'

export interface BuildingCodeInput {
  projectType: string
  city: string
  state?: string
  plotSqm?: number
  builtSqft?: number
  floors?: number
  heightM?: number
  notes?: string
}

export interface BuildingCodeFinding {
  topic: string
  severity: 'blocker' | 'warning' | 'note'
  finding: string
  action: string
}

export interface BuildingCodeResult {
  summary: string
  typology: string
  city: string
  findings: BuildingCodeFinding[]
  required_clearances: { name: string; authority: string; why: string }[]
  disclaimer: string
}

function localFallback(input: BuildingCodeInput): BuildingCodeResult {
  const typology = normalizeTypology(input.projectType)
  const label = typologyLabel(typology)
  const byeLaws = byeLawsFor(typology)
  const notes = complianceNotesFor(typology)
  const permits = defaultPermitsFor(typology)
  const height = Number(input.heightM) || 0
  const floors = Number(input.floors) || 0
  const plot = Number(input.plotSqm) || 0
  const built = Number(input.builtSqft) || 0

  const findings: BuildingCodeFinding[] = byeLaws.map((rule) => ({
    topic: rule.label,
    severity: 'note' as const,
    finding: `${rule.label} for a ${label.toLowerCase()} building in ${input.city || 'this city'} is typically ${rule.value}.`,
    action: `Confirm ${rule.label.toLowerCase()} against the ${input.state || input.city || 'local'} development control regulations before filing.`,
  }))

  if (height > 24 || floors >= 8) {
    findings.unshift({
      topic: 'High-rise fire NOC',
      severity: 'blocker',
      finding: `A building around ${height || floors * 3}m / ${floors || 'several'} floors usually crosses the 24m fire-safety threshold.`,
      action: 'File the fire NOC and refuge-floor layout before applying for IOD. Do not start construction on this height without it.',
    })
  }

  if (plot > 500 || built > 5380) {
    findings.push({
      topic: 'Rainwater harvesting',
      severity: 'warning',
      finding: 'Plot or built-up area is large enough that most municipal bye-laws make rainwater harvesting mandatory.',
      action: 'Show the RWH tank and recharge pits on the sanction drawings.',
    })
  }

  for (const line of notes.slice(0, 3)) {
    findings.push({
      topic: 'Typology check',
      severity: 'warning',
      finding: line,
      action: 'Record the answer on the drawings or in the municipal submission set.',
    })
  }

  return {
    summary: `Indicative ${label.toLowerCase()} code check for ${input.city || 'the site'}. This is a briefing, not a sanction.`,
    typology: label,
    city: input.city || 'Not specified',
    findings,
    required_clearances: permits.map((p) => ({
      name: p.approval_name,
      authority: p.authority,
      why: p.notes || `Standard ${label.toLowerCase()} clearance.`,
    })),
    disclaimer:
      'Reference only. Confirm every figure with the local development control regulations and a licensed municipal consultant before filing.',
  }
}

export async function checkBuildingCode(input: BuildingCodeInput): Promise<BuildingCodeResult> {
  const fallback = localFallback(input)
  if (!hasAI()) return fallback

  const typology = normalizeTypology(input.projectType)
  const prompt = `You are a senior Indian municipal consultant (architect + town planner).
Review this project against typical state development control regulations and NBC 2016.
Do not invent a specific corporation's exact FSI number as if it were official — flag ranges and say they must be verified.

TYPOLOGY: ${typologyLabel(typology)}
CITY: ${input.city || 'not given'}
STATE: ${input.state || 'not given'}
PLOT: ${input.plotSqm || 'not given'} sqm
BUILT-UP: ${input.builtSqft || 'not given'} sqft
FLOORS: ${input.floors || 'not given'}
HEIGHT: ${input.heightM || 'not given'} m
NOTES: ${input.notes || 'none'}

KNOWN DEFAULT CLEARANCES FOR THIS TYPOLOGY:
${JSON.stringify(defaultPermitsFor(typology), null, 2)}

INDICATIVE BYE-LAWS:
${JSON.stringify(byeLawsFor(typology), null, 2)}

Return ONLY valid JSON:
{
  "summary": string,
  "typology": "${typologyLabel(typology)}",
  "city": "${input.city || 'Not specified'}",
  "findings": [
    { "topic": string, "severity": "blocker"|"warning"|"note", "finding": string, "action": string }
  ],
  "required_clearances": [
    { "name": string, "authority": string, "why": string }
  ],
  "disclaimer": "Reference only. Confirm with the local DCR and a licensed consultant before filing."
}

Cover FSI/FAR, setbacks, height/fire, parking, accessibility, rainwater, and typology-specific regulators
(RERA, fire, pollution board, education/health, tree authority) as relevant.
Prefer 8–14 findings. Mark anything that would stop an IOD as "blocker".`

  try {
    const text = (await completeText(prompt, { maxTokens: 3500 })) || '{}'
    const parsed = JSON.parse(text.replace(/```json?\n?/g, '').replace(/```/g, '').trim())
    return {
      summary: parsed.summary || fallback.summary,
      typology: parsed.typology || fallback.typology,
      city: parsed.city || fallback.city,
      findings: Array.isArray(parsed.findings) && parsed.findings.length ? parsed.findings : fallback.findings,
      required_clearances:
        Array.isArray(parsed.required_clearances) && parsed.required_clearances.length
          ? parsed.required_clearances
          : fallback.required_clearances,
      disclaimer: parsed.disclaimer || fallback.disclaimer,
    }
  } catch (e) {
    console.warn('Building-code AI parse failed, using local fallback:', e)
    return fallback
  }
}

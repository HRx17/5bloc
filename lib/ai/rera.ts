import { anthropic, AI_MODEL } from './client'
import reraRules from './rera-rules.json'

export async function generateReraReport(
  project: any, milestones: any[], org: any
) {
  const reraState = project.rera_state || 'MH'
  const rules = (reraRules as any)[reraState] || (reraRules as any)['MH']
  const quarter = Math.ceil((new Date().getMonth() + 1) / 3)
  const year = new Date().getFullYear()

  if (!anthropic) {
    console.log('Anthropic API key is missing. Using local RERA report generator fallback.')
    
    // Programmatic compliance data structuring matching MahaRERA formats
    return {
      project_details: {
        project_name: project.name,
        rera_registration_number: project.rera_number || 'P51800000000',
        architect_name: org.name,
        reporting_quarter: `Q${quarter} ${year}`,
        site_address: `${project.address || ''}, ${project.city || ''}`
      },
      construction_progress: milestones.map((m: any) => ({
        milestone: m.phase.replace(/_/g, ' '),
        completion_percentage: m.completion_pct || 0,
        certified: m.rera_certified || false
      })),
      architect_certification_statement: `I, hereby certify that the physical progress of milestones for ${project.name} has been verified against design layouts. The works are carried out as per approved building plans.`,
      escrow_utilization_note: rules.escrow_rules,
      declaration: `Certified in accordance with ${rules.authority} regulations.`
    }
  }

  const prompt = `You are generating an official RERA quarterly progress report for India.

STATE: ${reraState} | AUTHORITY: ${rules.authority}
REQUIRED FIELDS: ${rules.quarterly_report_fields.join(', ')}

PROJECT:
- RERA Number: ${project.rera_number}
- Name: ${project.name}
- Address: ${project.address}, ${project.city}
- Architect: ${org.name}
- Report Period: Q${quarter} ${year}

CONSTRUCTION PROGRESS:
${milestones.map((m: any) =>
  `- ${m.phase.replace(/_/g, ' ')}: ${m.completion_pct}%${m.rera_certified ? ' (certified)' : ''}`
).join('\n')}

Generate the complete RERA Q${quarter} ${year} quarterly progress report.
Include: project_details, construction_progress, architect_certification_statement,
escrow_utilization_note, declaration.

Return ONLY valid JSON with keys matching ${rules.authority} portal requirements.`

  const res = await anthropic.messages.create({
    model: AI_MODEL, 
    max_tokens: 3000,
    messages: [{ role: 'user', content: prompt }],
  })
  
  const text = res.content[0].type === 'text' ? res.content[0].text : '{}'
  return JSON.parse(text.replace(/```json?\n?/g, '').replace(/```/g, '').trim())
}

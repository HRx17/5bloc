'use client'

import React, { useState, useEffect } from 'react'

interface RiskClause {
  clauseNumber: string
  title: string
  text: string
  riskLevel: 'high' | 'medium' | 'low'
  implication: string
  remedy: string
}

interface MissingClause {
  category: string
  description: string
  importance: 'critical' | 'advised'
  suggestedText: string
}

export default function ContractRiskScan() {
  const [contractText, setContractText] = useState('')
  const [fileName, setFileName] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState(0)
  const [scanResult, setScanResult] = useState<{
    score: number
    risks: RiskClause[]
    missing: MissingClause[]
  } | null>(null)

  const loadingMessages = [
    'Parsing contract clauses...',
    'Extracting liability limits...',
    'Comparing indemnity with standard architect-builder templates...',
    'Checking for RERA Section 4 compliance terms...',
    'Compiling final risk register...'
  ]

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (loading) {
      interval = setInterval(() => {
        setLoadingStep(s => (s + 1) % loadingMessages.length)
      }, 1200)
    } else {
      setLoadingStep(0)
    }
    return () => clearInterval(interval)
  }, [loading])

  const handleFileUploadMock = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFileName(file.name)
      // Mock pre-filled text
      setContractText(
        `CONSTRUCTION COORDINATION AND ARCHITECT SERVICES AGREEMENT\n\n` +
        `This Agreement is entered into by and between Apex Developers ("Owner") and Apex Architects ("Architect") on this 15th day of January, 2026.\n\n` +
        `Clause 12. Limitation of Liability:\nThe Architect shall be fully liable for all design faults, structural anomalies, and engineering errors. The Architect's liability is unlimited and shall extend to consecutive damages, lost revenue, and site clean-up fees.\n\n` +
        `Clause 14. Liquidated Damages:\nIn case of project delays, the Architect agrees to pay 0.5% of the total contract sum per calendar day of delay, regardless of delays caused by consultants or suppliers.\n\n` +
        `Clause 22. Indemnification:\nThe Architect agrees to defend, indemnify, and hold harmless the Owner from and against any claims, actions, or lawsuits, including reasonable attorney fees, arising out of any design revision requested by the Owner or site supervisors.`
      )
    }
  }

  const handleRunScan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!contractText && !fileName) return
    setLoading(true)
    setScanResult(null)

    try {
      // Simulate analysis
      await new Promise(resolve => setTimeout(resolve, 4500))

      setScanResult({
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
            title: 'Broad Indemnification for Owner-Requested Design Revisions',
            text: 'Architect agrees to defend, indemnify, and hold harmless the Owner from... design revisions requested by the Owner...',
            riskLevel: 'medium',
            implication: 'Requires the architect to indemnify the client for decisions the client forced. Typical professional indemnity policies do not cover indemnities where negligence is not proven.',
            remedy: 'Indemnification should be reciprocal and limited to claims arising directly from proven professional negligence of the Architect.'
          }
        ],
        missing: [
          {
            category: 'RERA Compliance',
            description: 'No clause defining architect milestone certifications under RERA (Real Estate Regulation Act) Section 4(2)(l)(D).',
            importance: 'critical',
            suggestedText: 'The Architect shall issue Form-4 Certificates of Completion at each construction phase milestone to enable withdrawals from the promoter\'s designated RERA bank account in compliance with local regulations.'
          },
          {
            category: 'Alternative Dispute Resolution',
            description: 'Missing arbitration clause or reference to the Indian Arbitration & Conciliation Act 1996.',
            importance: 'advised',
            suggestedText: 'All disputes arising out of this Agreement shall be referred to arbitration in accordance with the Arbitration and Conciliation Act, 1996, with proceedings conducted in Mumbai by a sole arbitrator.'
          },
          {
            category: 'Payment Escalation',
            description: 'No terms governing fee adjustments in case of delayed municipal permits or extension of project timeline.',
            importance: 'advised',
            suggestedText: 'If the project duration is extended beyond 12 months due to delays in municipal permit clearance or builder financing, the Architect reserves the right to charge an additional fee of 5% per month of the remaining fee portion.'
          }
        ]
      })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return { background: 'rgba(255,180,171,.12)', color: 'var(--error)' }
      case 'medium': return { background: 'rgba(245,166,35,.12)', color: 'var(--amber)' }
      default: return { background: 'rgba(122,184,255,.12)', color: 'var(--blue)' }
    }
  }

  return (
    <div className="p-6 space-y-6 font-body select-none max-w-7xl mx-auto">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-wide">AI Contract Risk Scan</h1>
        <p className="text-xs text-stone mt-1">
          Upload or paste project client contracts. Claude AI will cross-reference standard COA guidelines, RERA regulations, and flag design liability risks.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Input panel */}
        <div className="card-5bloc space-y-4">
          <div className="flex items-center justify-between pb-2 mb-2" style={{ boxShadow: '0 1px 0 rgba(159,142,122,0.10)' }}>
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-amber">Scan Input</h3>
            <span className="material-icons-outlined text-stone text-[18px]">gavel</span>
          </div>

          <form onSubmit={handleRunScan} className="space-y-4">
            {/* File upload mock */}
            <div>
              <label className="block text-stone text-[10px] font-bold uppercase tracking-wider mb-2 font-mono">Upload Contract (.pdf, .docx)</label>
              <div className="border border-dashed border-stone/30 p-4 text-center cursor-pointer hover:border-amber transition relative">
                <input
                  type="file"
                  accept=".pdf,.docx,.txt"
                  onChange={handleFileUploadMock}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <span className="material-icons-outlined text-[28px] text-stone">cloud_upload</span>
                <p className="text-[11px] text-stone mt-1">
                  {fileName ? `Selected: ${fileName}` : 'Drag file here or click to browse'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="divider flex-1"></span>
              <span className="text-[10px] text-stone font-mono">OR PASTE TEXT</span>
              <span className="divider flex-1"></span>
            </div>

            <div>
              <label className="block text-stone text-[10px] font-bold uppercase tracking-wider mb-1.5 font-mono">Contract Clauses Text</label>
              <textarea
                rows={12}
                value={contractText}
                onChange={e => setContractText(e.target.value)}
                placeholder="Paste the liability, delay, or fee clauses of your contract here..."
                className="input-5bloc text-xs resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading || (!contractText && !fileName)}
              className="w-full btn-primary py-2.5 font-bold tracking-wider flex items-center justify-center gap-1.5"
            >
              <span className="material-icons-outlined text-[16px]">sync</span>
              RUN LIABILITY AUDIT
            </button>
          </form>
        </div>

        {/* Right Output Results Panel */}
        <div className="lg:col-span-2 min-h-[500px]">
          {loading ? (
            /* Loading state */
            <div className="card-5bloc flex flex-col items-center justify-center text-center h-[520px] space-y-6">
              <div className="w-12 h-12 bg-amber/10 border flex items-center justify-center text-amber animate-spin">
                <span className="material-icons-outlined text-[28px]">sync</span>
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Analyzing Contract Terms</h4>
                <p className="text-xs text-stone">{loadingMessages[loadingStep]}</p>
              </div>
              <div className="w-64 bg-navy h-1.5 overflow-hidden border">
                <div
                  className="bg-amber h-full transition-all duration-1000"
                  style={{ width: `${(loadingStep + 1) * 20}%` }}
                />
              </div>
            </div>
          ) : scanResult ? (
            /* Scanned Results display */
            <div className="space-y-6 animate-fade-in">
              {/* Score summary card */}
              <div className="card-5bloc flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                  <h2 className="text-sm font-bold font-mono uppercase text-white tracking-wider">Audit Result Summary</h2>
                  <p className="text-xs text-stone">Audit completed. Risk checklist generated below.</p>
                </div>
                <div className="flex items-center gap-3.5">
                  <div className="text-right">
                    <p className="text-xs text-stone">Compliance Score</p>
                    <h1 className="text-2xl font-bold text-amber">{scanResult.score} / 100</h1>
                  </div>
                  <div className="w-12 h-12 flex items-center justify-center text-amber bg-amber/10 border text-lg font-bold">
                    {scanResult.score >= 80 ? 'A' : scanResult.score >= 60 ? 'C' : 'F'}
                  </div>
                </div>
              </div>

              {/* Risky Clauses Section */}
              <div className="card-5bloc space-y-4">
                <h3 className="text-xs font-bold font-mono text-error uppercase tracking-wider border-b pb-2">
                  Flagged Design Risks ({scanResult.risks.length})
                </h3>
                <div className="space-y-4">
                  {scanResult.risks.map((risk, index) => (
                    <div key={index} className="p-4 bg-navy/30 border space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span className="font-mono text-stone">{risk.clauseNumber}</span> - {risk.title}
                        </h4>
                        <span className="chip" style={getRiskColor(risk.riskLevel)}>{risk.riskLevel} Risk</span>
                      </div>
                      
                      <div className="p-3 bg-navy-mid text-stone font-mono text-[11px] border">
                        "{risk.text}"
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 text-xs">
                        <div>
                          <p className="text-stone font-semibold mb-1">Contract Implication:</p>
                          <p className="text-white leading-relaxed">{risk.implication}</p>
                        </div>
                        <div>
                          <p className="text-amber font-semibold mb-1">Suggested Remedy:</p>
                          <p className="text-white leading-relaxed">{risk.remedy}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Missing Clauses Section */}
              <div className="card-5bloc space-y-4">
                <h3 className="text-xs font-bold font-mono text-blue uppercase tracking-wider border-b pb-2">
                  Missing Compliance Clauses ({scanResult.missing.length})
                </h3>
                <div className="space-y-4">
                  {scanResult.missing.map((item, index) => (
                    <div key={index} className="p-4 bg-navy/30 border space-y-3.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white font-mono">{item.category}</span>
                        <span className={`chip ${
                          item.importance === 'critical' ? 'bg-error/10 text-error' : 'bg-stone/10 text-stone'
                        }`}>{item.importance}</span>
                      </div>
                      <p className="text-xs text-stone leading-relaxed">{item.description}</p>
                      
                      <div className="pt-2.5 border-t border-navy-lt">
                        <p className="text-[10px] text-stone font-mono mb-1.5 uppercase">SUGGESTED DROP-IN TEXT:</p>
                        <p className="text-xs text-white leading-relaxed p-3 bg-navy-mid border font-mono">
                          {item.suggestedText}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Idle screen placeholder */
            <div className="card-5bloc flex flex-col items-center justify-center text-center h-[520px] text-stone">
              <span className="material-icons-outlined text-[48px] text-stone/20 mb-3">gavel</span>
              <h4 className="text-sm font-bold text-white">AI Contract Scan Engine Idle</h4>
              <p className="text-xs max-w-sm mt-1">
                Upload a document or paste terms in the left panel to trigger the professional design liability audit.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

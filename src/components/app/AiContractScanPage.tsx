import React, { useState, useEffect } from 'react'
import { useToast } from '@/components/ui5/Toast'

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

export default function AiContractScanPage() {
  const { toast } = useToast()
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
      const res = await fetch('/api/ai/contract-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: contractText }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast(data.error || 'Could not scan this contract. Try again.', 'error')
        return
      }
      setScanResult({
        score: data.score,
        risks: data.risks || [],
        missing: data.missing || [],
      })
      toast(`Audit complete — ${(data.risks || []).length} clauses flagged`, 'success')
    } catch (err) {
      console.error(err)
      toast('Could not reach the scanner. Check your connection and try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const getRiskChipClass = (level: string) => {
    switch (level) {
      case 'high': return 'chip-m-red'
      case 'medium': return 'chip-m-amber'
      default: return 'chip-m-blue'
    }
  }

  return (
    <div className="page-m space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="page-m-title">AI Contract Risk Scan</h1>
        <p className="page-m-sub">
          Upload or paste project client contracts. Heuristic scan flags common liability patterns — not legal advice.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Input panel */}
        <div className="card-m">
          <div className="card-m-head">
            <h3 className="card-m-title text-amber">Scan Input</h3>
            <span className="material-icons-outlined text-stone text-[18px]">gavel</span>
          </div>

          <form onSubmit={handleRunScan} className="p-5 space-y-4">
            {/* File upload mock */}
            <div>
              <label className="block text-stone text-[10px] font-bold uppercase tracking-wider mb-2 font-mono">Upload Contract (.pdf, .docx)</label>
              <div className="border border-dashed border-hairline rounded-xl p-6 text-center cursor-pointer hover:border-amber transition relative bg-surface-low">
                <input
                  type="file"
                  accept=".pdf,.docx,.txt"
                  onChange={handleFileUploadMock}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <span className="material-icons-outlined text-[32px] text-stone/40">cloud_upload</span>
                <p className="text-[12px] text-stone mt-2">
                  {fileName ? `Selected: ${fileName}` : 'Drag file here or click to browse'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="h-[1px] bg-hairline flex-1"></span>
              <span className="text-[10px] text-stone font-mono">OR PASTE TEXT</span>
              <span className="h-[1px] bg-hairline flex-1"></span>
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
              <span className={`material-icons-outlined text-[16px] ${loading ? 'animate-spin' : ''}`}>sync</span>
              {loading ? 'SCANNING CONTRACT…' : 'RUN LIABILITY AUDIT'}
            </button>
          </form>
        </div>

        {/* Right Output Results Panel */}
        <div className="lg:col-span-2 min-h-[500px]">
          {loading ? (
            /* Loading state */
            <div className="card-m flex flex-col items-center justify-center text-center h-[520px] space-y-6">
              <div className="w-16 h-16 bg-amber/5 border border-amber/20 rounded-full flex items-center justify-center text-amber animate-spin">
                <span className="material-icons-outlined text-[28px]">sync</span>
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Analyzing Contract Terms</h4>
                <p className="text-xs text-stone">{loadingMessages[loadingStep]}</p>
              </div>
              <div className="w-64 bg-surface-low h-1.5 overflow-hidden rounded-full">
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
              <div className="card-m p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                  <h2 className="text-[15px] font-bold text-white uppercase tracking-wide">Audit Result Summary</h2>
                  <p className="text-xs text-stone">Audit completed. Risk checklist generated below.</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-[10px] font-mono text-stone uppercase tracking-wider">Compliance Score</p>
                    <h1 className="text-2xl font-bold text-amber">{scanResult.score} / 100</h1>
                  </div>
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-xl font-black ${
                    scanResult.score >= 80 ? 'bg-green-500/10 text-green-500' : scanResult.score >= 60 ? 'bg-amber/10 text-amber' : 'bg-error/10 text-error'
                  }`}>
                    {scanResult.score >= 80 ? 'A' : scanResult.score >= 60 ? 'C' : 'F'}
                  </div>
                </div>
              </div>

              {/* Risky Clauses Section */}
              <div className="card-m">
                <div className="card-m-head border-b border-hairline">
                  <h3 className="card-m-title text-error uppercase">
                    Flagged Design Risks ({scanResult.risks.length})
                  </h3>
                </div>
                <div className="p-5 space-y-4">
                  {scanResult.risks.map((risk, index) => (
                    <div key={index} className="card-m bg-surface-low/30 overflow-hidden">
                      <div className="px-4 py-3 border-b border-hairline flex items-center justify-between bg-surface-low/50">
                        <h4 className="text-[13px] font-bold text-white flex items-center gap-2">
                          <span className="font-mono text-stone text-[11px] bg-surface-high px-1.5 py-0.5 rounded">{risk.clauseNumber}</span> {risk.title}
                        </h4>
                        <span className={`chip-m ${getRiskChipClass(risk.riskLevel)}`}>{risk.riskLevel} Risk</span>
                      </div>
                      
                      <div className="p-4 space-y-4">
                        <div className="p-3 bg-surface-canvas text-stone font-mono text-[11px] rounded border border-hairline leading-relaxed italic">
                          "{risk.text}"
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[12px]">
                          <div className="space-y-1.5">
                            <p className="text-stone font-bold uppercase text-[10px] tracking-wider">Contract Implication</p>
                            <p className="text-white leading-relaxed">{risk.implication}</p>
                          </div>
                          <div className="space-y-1.5">
                            <p className="text-amber font-bold uppercase text-[10px] tracking-wider">Suggested Remedy</p>
                            <p className="text-white leading-relaxed">{risk.remedy}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Missing Clauses Section */}
              <div className="card-m">
                <div className="card-m-head border-b border-hairline">
                  <h3 className="card-m-title text-blue uppercase">
                    Missing Compliance Clauses ({scanResult.missing.length})
                  </h3>
                </div>
                <div className="p-5 space-y-4">
                  {scanResult.missing.map((item, index) => (
                    <div key={index} className="card-m bg-surface-low/30 overflow-hidden">
                      <div className="px-4 py-3 border-b border-hairline flex items-center justify-between bg-surface-low/50">
                        <span className="text-[13px] font-bold text-white">{item.category}</span>
                        <span className={`chip-m ${
                          item.importance === 'critical' ? 'chip-m-red' : 'chip-m-blue'
                        }`}>{item.importance}</span>
                      </div>
                      
                      <div className="p-4 space-y-4">
                        <p className="text-[12px] text-stone leading-relaxed">{item.description}</p>
                        
                        <div className="pt-3 border-t border-hairline">
                          <p className="text-[10px] text-stone font-mono mb-2 uppercase tracking-widest">SUGGESTED DROP-IN TEXT</p>
                          <p className="text-[11px] text-white leading-relaxed p-3 bg-surface-canvas border border-hairline font-mono rounded">
                            {item.suggestedText}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Idle screen placeholder */
            <div className="card-m flex flex-col items-center justify-center text-center h-[520px] text-stone p-8">
              <div className="w-20 h-20 bg-surface-low rounded-full flex items-center justify-center text-stone/20 mb-4">
                <span className="material-icons-outlined text-[48px]">gavel</span>
              </div>
              <h4 className="text-[15px] font-bold text-white uppercase tracking-wider">AI Contract Scan Engine Idle</h4>
              <p className="text-xs max-w-sm mt-3 text-stone/60 leading-relaxed">
                Upload a document or paste terms in the left panel to trigger the professional design liability audit.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

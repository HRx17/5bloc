import React, { useState, useEffect } from 'react'
import { UpgradePrompt } from '@/components/payments/UpgradePrompt'
import { useToast } from '@/components/ui5/Toast'
import { isTestPeriod } from '@/lib/payments/gates'
import { TYPOLOGY_OPTIONS, normalizeTypology } from '@/lib/compliance/typology'

interface ProjectOption {
  id: string
  name: string
  type?: string | null
  city?: string | null
  total_sqft?: number | null
  floors?: number | null
}

interface LineItem {
 category: string
 description: string
 quantity: number
 unit: string
 rate: number
 amount: number
}

interface EstimateResult {
 total_estimate: number
 total_min: number
 total_max: number
 confidence_range_pct: number
 city: string
 spec_level: string
 currency: string
 line_items: LineItem[]
}

function normalizePlan(raw: unknown): 'free' | 'solo' | 'team' {
  const p = String(raw || 'free').toLowerCase()
  if (p === 'solo' || p === 'team' || p === 'free') return p
  return 'free'
}

export default function AiEstimatePage() {
 const { toast } = useToast()
 const [form, setForm] = useState({
 projectType: 'residential',
 city: 'Mumbai',
 sqft: '2500',
 floors: '2',
 specLevel: 'premium',
 notes: '',
 projectId: '',
 })

 const [projects, setProjects] = useState<ProjectOption[]>([])
 const [loading, setLoading] = useState(false)
 const [saving, setSaving] = useState(false)
 const [loadingStep, setLoadingStep] = useState(0)
 const [result, setResult] = useState<EstimateResult | null>(null)
 const [planGateLoading, setPlanGateLoading] = useState(true)
 const [needsUpgrade, setNeedsUpgrade] = useState(false)
 
 // Free limits counter state
 const [remainingCalls, setRemainingCalls] = useState(3)

 const loadingMessages = [
 'Initializing Quantity Surveyor engine...',
 'Fetching current building indices...',
 'Applying specifications multipliers...',
 'Formulating structural concrete volume schedules...',
 'Structuring full itemized Bill of Quantities...'
 ]

 useEffect(() => {
 fetch('/api/projects')
 .then((r) => r.json())
 .then((d) =>
   setProjects(
     (d.projects || []).map((p: any) => ({
       id: p.id,
       name: p.name,
       type: p.type,
       city: p.city,
       total_sqft: p.total_sqft,
       floors: p.floors,
     }))
   )
 )
 .catch(() => {})
 }, [])

 /** Picking a project pulls its real typology, city and area in, so the estimate matches the brief. */
 const applyProject = (projectId: string) => {
   const project = projects.find((p) => p.id === projectId)
   setForm((prev) => ({
     ...prev,
     projectId,
     ...(project
       ? {
           projectType: normalizeTypology(project.type),
           city: project.city || prev.city,
           sqft: project.total_sqft ? String(project.total_sqft) : prev.sqft,
           floors: project.floors ? String(project.floors) : prev.floors,
         }
       : {}),
   }))
 }

 useEffect(() => {
 fetch('/api/me')
   .then((r) => r.json())
   .then((d) => {
     const profile = d.profile || {}
     const plan = normalizePlan(profile.plan || profile.organisations?.plan)
     const aiAddOn = !!profile.ai_add_on
     setNeedsUpgrade(!isTestPeriod() && plan === 'free' && !aiAddOn)
   })
   .catch(() => setNeedsUpgrade(false))
   .finally(() => setPlanGateLoading(false))
 }, [])

 useEffect(() => {
 let interval: any
 if (loading) {
 interval = setInterval(() => {
 setLoadingStep((s) => (s + 1) % loadingMessages.length)
 }, 1200)
 } else {
 setLoadingStep(0)
 }
 return () => clearInterval(interval)
 }, [loading])

 const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
 const { name, value } = e.target
 setForm((prev) => ({ ...prev, [name]: value }))
 }

 const handleGenerate = async (e: React.FormEvent) => {
 e.preventDefault()
 setLoading(true)
 setResult(null)

 try {
 const res = await fetch('/api/ai/estimate', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 projectType: form.projectType,
 city: form.city,
 sqft: parseFloat(form.sqft) || 0,
 floors: parseInt(form.floors, 10) || 1,
 specLevel: form.specLevel,
 notes: form.notes,
 projectId: form.projectId || null,
 }),
 })
 const data = await res.json()
 if (!res.ok) {
 if (res.status === 402) {
 setNeedsUpgrade(true)
 toast(data.error || 'Upgrade required to use the AI estimator', 'warning')
 return
 }
 if (res.status === 429) {
 toast(data.error || 'Daily estimate limit reached — try again tomorrow', 'warning')
 setRemainingCalls(0)
 return
 }
 throw new Error(data.error || 'Estimate failed')
 }

 const estimate = data.data as EstimateResult
 setResult(estimate)
 if (typeof data.remaining === 'number') setRemainingCalls(data.remaining)
 else setRemainingCalls((prev) => Math.max(0, prev - 1))

 const savedChecklist = localStorage.getItem('onboarding_checklist_v1')
 if (savedChecklist) {
 const parsed = JSON.parse(savedChecklist)
 parsed.ai = true
 localStorage.setItem('onboarding_checklist_v1', JSON.stringify(parsed))
 }
 } catch (err: any) {
 console.error(err)
 toast(err?.message || 'Could not generate the estimate. Try again.', 'error')
 } finally {
 setLoading(false)
 }
 }

 const handleExport = () => {
 if (!result) return
 const lines = [
 `5Bloc AI Estimate — ${result.city} / ${result.spec_level}`,
 `Total: ${result.currency || 'INR'} ${result.total_estimate}`,
 `Range: ${result.total_min} – ${result.total_max}`,
 '',
 'Category,Description,Qty,Unit,Rate,Amount',
 ...result.line_items.map(
 (l) =>
 `${l.category},"${l.description}",${l.quantity},${l.unit},${l.rate},${l.amount}`
 ),
 ]
 const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' })
 const url = URL.createObjectURL(blob)
 const a = document.createElement('a')
 a.href = url
 a.download = `5bloc-estimate-${Date.now()}.csv`
 a.click()
 URL.revokeObjectURL(url)
 }

 const handleSaveToProject = async () => {
 if (!result) return
 if (!form.projectId) {
 toast('Pick a project to save this estimate to', 'warning')
 return
 }
 setSaving(true)
 try {
 const res = await fetch(`/api/projects/${form.projectId}/estimates`, {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 result,
 estimated_total: result.total_estimate,
 breakdown: result.line_items,
 project_type: form.projectType,
 city: form.city,
 sqft: parseFloat(form.sqft) || null,
 floors: parseInt(form.floors, 10) || null,
 specLevel: form.specLevel,
 input: form,
 }),
 })
 const data = await res.json()
 if (!res.ok) throw new Error(data.error || 'Save failed')
 const projectName = projects.find((p) => p.id === form.projectId)?.name
 toast(projectName ? `Estimate saved to ${projectName}` : 'Estimate saved to project', 'success')
 } catch (err: any) {
 toast(err?.message || 'Could not save the estimate. Try again.', 'error')
 } finally {
 setSaving(false)
 }
 }

 const handleCellChange = (index: number, field: keyof LineItem, value: any) => {
 if (!result) return
 
 const nextLines = [...result.line_items]
 const line = { ...nextLines[index], [field]: value }
 
 // Recalculate amount if rate or quantity changes
 if (field === 'rate' || field === 'quantity') {
 line.amount = Math.round(line.rate * line.quantity)
 }
 
 nextLines[index] = line
 
 // Recalculate total estimate
 const total = nextLines.reduce((sum, item) => sum + item.amount, 0)
 
 setResult({
 ...result,
 line_items: nextLines,
 total_estimate: total,
 total_min: Math.round(total * 0.92),
 total_max: Math.round(total * 1.08)
 })
 }

 const formatLakhs = (amt: number) => {
 return `₹${(amt / 100000).toFixed(1)} Lakh`
 }

 return (
 <div className="page-m space-y-8">
  {/* Page Title */}
  <div>
    <h1 className="page-m-title">AI Cost Estimator</h1>
    <p className="page-m-sub">Generate highly accurate quantity surveys and editable BOQ estimates using Claude AI.</p>
  </div>

  {planGateLoading ? (
    <div className="card-m p-8 text-center text-stone animate-pulse text-xs">
      Checking plan access…
    </div>
  ) : needsUpgrade ? (
    <UpgradePrompt
      title="AI Estimator is a paid feature"
      message="Free plans cannot run AI cost estimates. Upgrade to Solo or Team, or add the AI add-on, to unlock quantity surveys and BOQ generation."
    />
  ) : null}

  {!needsUpgrade && !planGateLoading && (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      
      {/* Left Column Form inputs */}
      <div className="card-m">
        <div className="card-m-head">
          <h3 className="card-m-title">Parameters</h3>
          <span className="chip-m chip-m-amber text-[10px]">
            {remainingCalls} runs left
          </span>
        </div>

        <form onSubmit={handleGenerate} className="p-5 space-y-4">
          <div>
            <label className="block text-stone text-[10px] font-bold uppercase tracking-wider mb-1.5 font-mono">Project Type</label>
            <div className="select-5bloc w-full">
              <select
                name="projectType"
                value={form.projectType}
                onChange={handleInputChange}
                className="w-full"
              >
                {TYPOLOGY_OPTIONS.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <span className="material-icons-outlined chevron">expand_more</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-stone text-[10px] font-bold uppercase tracking-wider mb-1.5 font-mono">Select City</label>
              <div className="select-5bloc w-full">
                <select
                  name="city"
                  value={form.city}
                  onChange={handleInputChange}
                  className="w-full"
                >
                  <option value="Mumbai">Mumbai</option>
                  <option value="Delhi">Delhi</option>
                  <option value="Bangalore">Bangalore</option>
                  <option value="Pune">Pune</option>
                  <option value="Hyderabad">Hyderabad</option>
                </select>
                <span className="material-icons-outlined chevron">expand_more</span>
              </div>
            </div>

            <div>
              <label className="block text-stone text-[10px] font-bold uppercase tracking-wider mb-1.5 font-mono">Build Area (sqft) *</label>
              <input
                type="number"
                name="sqft"
                required
                value={form.sqft}
                onChange={handleInputChange}
                className="input-5bloc py-1.5 text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-stone text-[10px] font-bold uppercase tracking-wider mb-1.5 font-mono">Number of Floors</label>
            <input
              type="number"
              name="floors"
              value={form.floors}
              onChange={handleInputChange}
              className="input-5bloc py-1.5 text-xs font-mono"
            />
          </div>

          {/* Spec selector radio cards */}
          <div>
            <label className="block text-stone text-[10px] font-bold uppercase tracking-wider mb-2 font-mono">Specification Grade</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'standard', label: 'Standard' },
                { id: 'premium', label: 'Premium' },
                { id: 'luxury', label: 'Luxury' },
              ].map((spec) => (
                <div
                  key={spec.id}
                  onClick={() => setForm(prev => ({ ...prev, specLevel: spec.id }))}
                  className={`card-m p-2.5 text-center cursor-pointer flex items-center justify-center transition-all ${
                    form.specLevel === spec.id ? 'stat-card-active border-amber' : ''
                  }`}
                >
                  <span className={`text-[11px] font-bold ${form.specLevel === spec.id ? 'text-amber' : ''}`}>{spec.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-stone text-[10px] font-bold uppercase tracking-wider mb-1.5 font-mono">Save target project</label>
            <div className="select-5bloc w-full">
              <select
                name="projectId"
                value={form.projectId}
                onChange={(e) => applyProject(e.target.value)}
                className="w-full"
              >
                <option value="">Select project…</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <span className="material-icons-outlined chevron">expand_more</span>
            </div>
          </div>

          <div>
            <label className="block text-stone text-[10px] font-bold uppercase tracking-wider mb-1.5 font-mono">Optional specifications</label>
            <textarea
              name="notes"
              rows={3}
              value={form.notes}
              onChange={handleInputChange}
              className="input-5bloc text-xs resize-none"
              placeholder="Specify structural items e.g. pile foundations needed..."
            />
          </div>

          <button
            type="submit"
            disabled={loading || remainingCalls <= 0}
            className="w-full btn-primary py-3 font-bold mt-3 tracking-wider flex items-center justify-center gap-1.5"
          >
            <span className={`material-icons-outlined text-[18px] ${loading ? 'animate-spin' : ''}`}>
              {loading ? 'sync' : 'auto_awesome'}
            </span>
            {loading ? 'GENERATING ESTIMATE…' : remainingCalls <= 0 ? 'DAILY LIMIT REACHED' : 'GENERATE COST ESTIMATE'}
          </button>
        </form>
      </div>

      {/* Right Column details results / loading progress states */}
      <div className="lg:col-span-2 min-h-[400px]">
        {loading ? (
          /* Loading State card container */
          <div className="card-m flex flex-col items-center justify-center text-center h-[450px] space-y-6 animate-pulse ">
            <div className="w-16 h-16 bg-amber/5 border border-amber/20 rounded-full flex items-center justify-center text-amber animate-spin">
              <span className="material-icons-outlined text-[32px]">sync</span>
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Running Quantity Estimator</h4>
              <p className="text-xs text-stone">{loadingMessages[loadingStep]}</p>
            </div>
            {/* Progress Bar */}
            <div className="w-64 bg-surface-low rounded-full h-1.5 overflow-hidden ">
              <div 
                className="bg-amber h-full transition-all duration-1000"
                style={{ width: `${(loadingStep + 1) * 20}%` }}
              />
            </div>
          </div>
        ) : result ? (
          /* Output Estimate card container */
          <div className="card-m animate-fade-in overflow-hidden">
            <div className="card-m-head border-b border-hairline">
              <div>
                <h3 className="card-m-title">Bill of Quantities (Estimate)</h3>
                <p className="text-[10px] text-stone font-mono mt-0.5 uppercase tracking-wide">Confidence Delta: ±{result.confidence_range_pct}%</p>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-amber">{formatLakhs(result.total_estimate)}</div>
                <div className="text-[10px] text-stone font-mono mt-0.5">
                  Range: {formatLakhs(result.total_min)} - {formatLakhs(result.total_max)}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="table-m">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Description</th>
                    <th className="text-right">Quantity</th>
                    <th>Unit</th>
                    <th className="text-right">Unit Rate (₹)</th>
                    <th className="text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {result.line_items.map((line, idx) => (
                    <tr key={idx}>
                      <td className="font-semibold text-white">{line.category}</td>
                      <td className="text-stone text-[12px] leading-snug">{line.description}</td>
                      
                      {/* Quantity editable input */}
                      <td className="text-right">
                        {line.unit !== 'lumpsum' ? (
                          <input
                            type="number"
                            value={line.quantity}
                            onChange={(e) => handleCellChange(idx, 'quantity', parseFloat(e.target.value) || 0)}
                            className="bg-surface-low border border-hairline px-1.5 py-0.5 text-[12px] text-white font-mono w-16 text-right rounded"
                          />
                        ) : (
                          <span className="font-mono text-stone text-[12px]">1</span>
                        )}
                      </td>

                      <td className="font-mono text-[11px] text-stone">{line.unit}</td>
                      
                      {/* Rate editable input */}
                      <td className="text-right">
                        <input
                          type="number"
                          value={line.rate}
                          onChange={(e) => handleCellChange(idx, 'rate', parseInt(e.target.value) || 0)}
                          className="bg-surface-low border border-hairline px-1.5 py-0.5 text-[12px] text-white font-mono w-20 text-right rounded"
                        />
                      </td>
                      
                      <td className="text-right font-mono font-semibold text-white">
                        {line.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Action buttons */}
            <div className="p-5 flex justify-end gap-3 border-t border-hairline">
              <button 
                onClick={handleExport}
                className="btn-secondary text-xs py-2 px-5"
              >
                EXPORT CSV
              </button>
              <button 
                onClick={handleSaveToProject}
                disabled={saving || !form.projectId}
                className="btn-primary text-xs py-2 px-6 font-bold"
              >
                {saving ? 'SAVING…' : 'SAVE TO PROJECT'}
              </button>
            </div>
          </div>
        ) : (
          /* Idle Screen / Placeholder container */
          <div className="card-m flex flex-col items-center justify-center text-center h-[450px] text-stone p-8">
            <div className="w-16 h-16 bg-surface-low rounded-full flex items-center justify-center text-stone/20 mb-4">
              <span className="material-icons-outlined text-[40px]">auto_awesome</span>
            </div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Quantity Surveyor Engine Idle</h4>
            <p className="text-xs max-w-sm mt-2 text-stone/60 leading-relaxed">Configure parameters in the left panel to execute the Bill of Quantities estimation.</p>
          </div>
        )}
      </div>

    </div>
  )}
 </div>
 )
}

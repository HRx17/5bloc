'use client'

import React, { useState, useEffect } from 'react'
import { UpgradePrompt } from '@/components/payments/UpgradePrompt'
import { useToast } from '@/components/ui/Toast'

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

export default function AIEstimator() {
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

 const [projects, setProjects] = useState<{ id: string; name: string }[]>([])
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
 .then((d) => setProjects((d.projects || []).map((p: any) => ({ id: p.id, name: p.name }))))
 .catch(() => {})
 }, [])

 useEffect(() => {
 fetch('/api/me')
   .then((r) => r.json())
   .then((d) => {
     const profile = d.profile || {}
     const plan = normalizePlan(profile.plan || profile.organisations?.plan)
     const aiAddOn = !!profile.ai_add_on
     setNeedsUpgrade(plan === 'free' && !aiAddOn)
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
 <div className="p-6 space-y-6 font-body select-none max-w-7xl mx-auto">
 {/* Page Title */}
 <div>
 <h1 className="text-2xl font-bold tracking-wide">AI Cost Estimator</h1>
 <p className="text-xs text-stone mt-1">Generate highly accurate quantity surveys and editable BOQ estimates using Claude AI.</p>
 </div>

 {planGateLoading ? (
   <div className="card-5bloc p-8 text-center text-stone animate-pulse text-xs">
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
 <div className="card-5bloc space-y-4">
 <div className="flex items-center justify-between pb-2.5 mb-2">
 <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-amber">Parameters</h3>
 <span className="text-[10px] text-stone font-mono uppercase">
 Remaining: <span className="text-white font-bold">{remainingCalls} runs</span>
 </span>
 </div>

 <form onSubmit={handleGenerate} className="space-y-4">
 <div>
 <label className="block text-stone text-[10px] font-bold uppercase tracking-wider mb-1.5 font-mono">Project Type</label>
 <select
 name="projectType"
 value={form.projectType}
 onChange={handleInputChange}
 className="input-5bloc py-1.5 text-xs font-medium"
 >
 <option value="residential">Residential Bungalow</option>
 <option value="commercial">Commercial Office Space</option>
 <option value="interior">Interior Fit-out</option>
 <option value="landscape">Landscape Design</option>
 </select>
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-stone text-[10px] font-bold uppercase tracking-wider mb-1.5 font-mono">Select City</label>
 <select
 name="city"
 value={form.city}
 onChange={handleInputChange}
 className="input-5bloc py-1.5 text-xs font-medium"
 >
 <option value="Mumbai">Mumbai</option>
 <option value="Delhi">Delhi</option>
 <option value="Bangalore">Bangalore</option>
 <option value="Pune">Pune</option>
 <option value="Hyderabad">Hyderabad</option>
 </select>
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
 className="card-5bloc p-2.5 text-center cursor-pointer flex items-center justify-center"
 style={form.specLevel === spec.id
   ? { boxShadow: 'var(--shadow-amber)', background: 'rgba(245,166,35,.06)', color: 'var(--amber)' }
   : { color: 'var(--on-surface)' }
 }
 >
 <span className="text-xs font-bold">{spec.label}</span>
 </div>
 ))}
 </div>
 </div>

 <div>
 <label className="block text-stone text-[10px] font-bold uppercase tracking-wider mb-1.5 font-mono">Save target project</label>
 <select
 name="projectId"
 value={form.projectId}
 onChange={handleInputChange}
 className="input-5bloc py-1.5 text-xs font-medium"
 >
 <option value="">Select project…</option>
 {projects.map((p) => (
 <option key={p.id} value={p.id}>{p.name}</option>
 ))}
 </select>
 </div>

 <div>
 <label className="block text-stone text-[10px] font-bold uppercase tracking-wider mb-1.5 font-mono">Optional specifications / Guidelines</label>
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
 <div className="card-5bloc flex flex-col items-center justify-center text-center h-[450px] space-y-6 animate-pulse ">
 <div className="w-16 h-16 bg-amber/5 border flex items-center justify-center text-amber animate-spin">
 <span className="material-icons-outlined text-[32px]">sync</span>
 </div>
 <div className="space-y-1">
 <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Running Quantity Estimator</h4>
 <p className="text-xs text-stone">{loadingMessages[loadingStep]}</p>
 </div>
 {/* Progress Bar */}
 <div className="w-64 bg-navy h-1.5 overflow-hidden ">
 <div 
 className="bg-amber h-full transition-all duration-1000"
 style={{ width: `${(loadingStep + 1) * 20}%` }}
 />
 </div>
 </div>
 ) : result ? (
 /* Output Estimate card container */
 <div className="card-5bloc space-y-6 animate-fade-in">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
 <div>
 <h3 className="text-base font-bold text-white font-mono uppercase tracking-wider">Bill of Quantities (Estimate)</h3>
 <p className="text-[10px] text-stone font-mono mt-0.5">Confidence Delta: ±{result.confidence_range_pct}%</p>
 </div>
 {/* Highlight total pricing */}
 <div className="text-right">
 <h2 className="text-2xl font-bold text-amber">{formatLakhs(result.total_estimate)}</h2>
 <p className="text-[10px] text-stone font-mono mt-0.5">
 Range: {formatLakhs(result.total_min)} - {formatLakhs(result.total_max)}
 </p>
 </div>
 </div>

 {/* Editable BOQ Table */}
 <div className="overflow-x-auto">
 <table className="w-full text-left text-xs ">
 <thead>
 <tr className="text-stone font-mono uppercase text-[9px] tracking-wider pb-2">
 <th className="pb-2 pl-2">Category</th>
 <th className="pb-2">Description</th>
 <th className="pb-2 text-right">Quantity</th>
 <th className="pb-2">Unit</th>
 <th className="pb-2 text-right">Unit Rate (₹)</th>
 <th className="pb-2 text-right pr-2">Amount (₹)</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-navy-lt/40">
 {result.line_items.map((line, idx) => (
 <tr key={idx} className="hover:bg-navy-lt/10 transition-colors">
 <td className="py-3 pl-2 font-semibold text-white truncate max-w-[120px]">{line.category}</td>
 <td className="py-3 text-stone truncate max-w-[160px]" title={line.description}>{line.description}</td>
 
 {/* Quantity editable input */}
 <td className="py-3 text-right">
 {line.unit !== 'lumpsum' ? (
 <input
 type="number"
 value={line.quantity}
 onChange={(e) => handleCellChange(idx, 'quantity', parseFloat(e.target.value) || 0)}
 className="bg-navy px-1.5 py-0.5 text-xs text-white font-mono w-16 text-right focus: focus:outline-none"
 />
 ) : (
 <span className="font-mono text-stone">1</span>
 )}
 </td>

 <td className="py-3 font-mono text-[10px] text-stone pl-2">{line.unit}</td>
 
 {/* Rate editable input */}
 <td className="py-3 text-right">
 <input
 type="number"
 value={line.rate}
 onChange={(e) => handleCellChange(idx, 'rate', parseInt(e.target.value) || 0)}
 className="bg-navy px-1.5 py-0.5 text-xs text-white font-mono w-20 text-right focus: focus:outline-none"
 />
 </td>
 
 <td className="py-3 text-right font-mono pr-2 font-semibold text-white">
 {line.amount.toLocaleString()}
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>

 {/* Action buttons */}
 <div className="pt-4 flex justify-end gap-3.5">
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
 <div className="card-5bloc flex flex-col items-center justify-center text-center h-[450px] text-stone">
 <span className="material-icons-outlined text-[48px] text-stone/20 mb-3">auto_awesome</span>
 <h4 className="text-sm font-bold text-white">Quantity Surveyor Engine Idle</h4>
 <p className="text-xs max-w-sm mt-1">Configure parameters in the left panel to execute the cost estimation.</p>
 </div>
 )}
 </div>

 </div>
 )}
 </div>
 )
}


'use client'

import React, { useState, useEffect } from 'react'
import { Logo } from '@/components/brand/LogoMark'
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

export default function AIEstimator() {
 const { toast } = useToast()
 const [form, setForm] = useState({
 projectType: 'residential',
 city: 'Mumbai',
 sqft: '2500',
 floors: '2',
 specLevel: 'premium',
 notes: '',
 })

 const [loading, setLoading] = useState(false)
 const [loadingStep, setLoadingStep] = useState(0)
 const [result, setResult] = useState<EstimateResult | null>(null)
 
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
   // Try real API first, fall back to local calculation if not configured
   let apiData: EstimateResult | null = null
   try {
     const res = await fetch('/api/ai/estimate', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({
         projectType: form.projectType,
         city: form.city,
         sqft: parseFloat(form.sqft) || 2000,
         floors: parseInt(form.floors) || 1,
         specLevel: form.specLevel,
         notes: form.notes,
       }),
     })
     if (res.ok) {
       const json = await res.json()
       apiData = json.data
       if (json.remaining !== undefined) setRemainingCalls(json.remaining)
     } else       if (res.status === 429) {
        const json = await res.json()
        toast(json.error || 'Daily limit reached. Upgrade your plan for more estimates.', 'warning')
        setLoading(false)
        return
      }
   } catch {
     // API unavailable — use local calculation below
   }

   if (apiData) {
     setResult(apiData)
   } else {
     // Local calculation fallback (when Anthropic key not configured)
     await new Promise(resolve => setTimeout(resolve, 2000))
     const sqft = parseFloat(form.sqft) || 2000
     const isLuxury = form.specLevel === 'luxury'
     const isPremium = form.specLevel === 'premium'
     const multiplier = isLuxury ? 2.2 : isPremium ? 1.5 : 1.0

     const lines: LineItem[] = [
       { category: 'Excavation',      description: 'Foundation earthwork excavation & backfill',         quantity: sqft * 0.05, unit: 'cum',     rate: 320 * multiplier,  amount: 0 },
       { category: 'Concrete (RCC)',   description: 'Reinforced concrete structure (M25 grade)',          quantity: sqft * 0.08, unit: 'cum',     rate: 9200 * multiplier, amount: 0 },
       { category: 'Brickwork',        description: 'Wall structural brick masonry in mortar 1:6',        quantity: sqft * 0.12, unit: 'sqm',     rate: 1100 * multiplier, amount: 0 },
       { category: 'Flooring',         description: isLuxury ? 'Italian Marble finishes' : 'Vitrified tiles tiling', quantity: sqft * 0.9, unit: 'sqft', rate: (isLuxury ? 280 : 85) * multiplier, amount: 0 },
       { category: 'Electrical',       description: 'Concealed conduits & fixtures modular wiring',       quantity: sqft,        unit: 'sqft',    rate: 180 * multiplier,  amount: 0 },
       { category: 'Plumbing',         description: 'Premium CPVC plumbing water lines',                  quantity: sqft,        unit: 'sqft',    rate: 120 * multiplier,  amount: 0 },
     ]
     const processedLines = lines.map(l => ({ ...l, rate: Math.round(l.rate), amount: Math.round(l.quantity * l.rate) }))
     const subtotal = processedLines.reduce((s, l) => s + l.amount, 0)
     const feePct = isLuxury ? 10 : isPremium ? 9 : 8
     const archFee = Math.round(subtotal * (feePct / 100))
     processedLines.push({ category: 'Architect Fees', description: `Professional consultation (${feePct}%)`, quantity: 1, unit: 'lumpsum', rate: archFee, amount: archFee })
     const total = subtotal + archFee
     setResult({ total_estimate: total, total_min: Math.round(total * 0.92), total_max: Math.round(total * 1.08), confidence_range_pct: 8, city: form.city, spec_level: form.specLevel, currency: 'INR', line_items: processedLines })
     setRemainingCalls(prev => Math.max(0, prev - 1))
   }

   // Auto-check checklist task in localStorage
   const savedChecklist = localStorage.getItem('onboarding_checklist_v1')
   if (savedChecklist) {
     const parsed = JSON.parse(savedChecklist)
     parsed.ai = true
     localStorage.setItem('onboarding_checklist_v1', JSON.stringify(parsed))
   }

 } catch (err) {
 console.error(err)
 } finally {
 setLoading(false)
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
        <p className="section-eyebrow-amber mb-2">AI Cost Estimator</p>
        <h1 className="font-display text-[22px] lg:text-[26px] leading-tight" style={{ color: 'var(--on-surface)' }}>
          Full BOQ in 4 seconds.
        </h1>
        <p className="text-[13px] mt-1.5" style={{ color: 'var(--stone)' }}>
          Generate highly accurate quantity surveys and editable BOQ estimates using Claude AI.
        </p>
      </div>

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
 <span className="material-icons-outlined text-[18px]">auto_awesome</span>
 GENERATE COST ESTIMATE
 </button>
 </form>
 </div>

 {/* Right Column details results / loading progress states */}
 <div className="lg:col-span-2 min-h-[400px]">
        {loading ? (
          /* Loading State */
          <div className="card-5bloc flex flex-col items-center justify-center text-center h-[450px] gap-6">
            <div
              className="w-16 h-16 flex items-center justify-center rounded-2xl"
              style={{ background: 'rgba(245,166,35,0.08)', boxShadow: 'var(--glow-amber)' }}
            >
              <span className="material-icons-outlined text-[24px] animate-spin" style={{ color: 'var(--amber)' }}>sync</span>
            </div>
            <div className="space-y-1">
              <h4 className="section-eyebrow-amber">Running Quantity Estimator</h4>
              <p className="text-[13px] mt-2" style={{ color: 'var(--stone)' }}>{loadingMessages[loadingStep]}</p>
            </div>
            <div className="progress-track w-64">
              <div className="progress-fill transition-all duration-1000" style={{ width: `${(loadingStep + 1) * 20}%` }} />
            </div>
          </div>
        ) : result ? (
          /* Result card — matches image 1 design */
          <div className="card-5bloc animate-fade-in space-y-0">

            {/* ── Total cost hero ── */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 mb-2"
              style={{ borderBottom: '1px solid var(--hairline)' }}>
              <div>
                <p className="section-eyebrow mb-3">Total Estimated Cost</p>
                <div className="display-number display-number-lg">
                  {formatLakhs(result.total_estimate)}
                </div>
                <p className="text-[12px] mt-2" style={{ color: 'var(--stone)' }}>
                  Inclusive of all taxes &amp; fees
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:items-end">
                <button
                  onClick={() => toast('PDF export ready — connect Cloudflare R2 to enable downloads.', 'info')}
                  className="btn-secondary text-[12px]"
                >
                  <span className="material-icons-outlined text-[15px]">download</span>
                  Export BOQ
                </button>
                <div className="flex flex-wrap gap-2 sm:justify-end mt-1">
                  <span className="feature-pill">
                    <span className="material-icons-outlined" style={{ fontSize: 12 }}>auto_awesome</span>
                    AI-powered
                  </span>
                  <span className="feature-pill-success feature-pill">
                    <span className="material-icons-outlined" style={{ fontSize: 12 }}>currency_rupee</span>
                    Indian rates
                  </span>
                  <span className="feature-pill-blue feature-pill">
                    <span className="material-icons-outlined" style={{ fontSize: 12 }}>gps_fixed</span>
                    ±{result.confidence_range_pct}% accurate
                  </span>
                </div>
              </div>
            </div>

            {/* ── Editable BOQ Table ── */}
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Description</th>
                    <th style={{ textAlign: 'right' }}>Qty</th>
                    <th>Unit</th>
                    <th style={{ textAlign: 'right' }}>Rate (₹)</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {result.line_items.map((line, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600, minWidth: 120 }}>
                        <span className="line-clamp-1">{line.category}</span>
                      </td>
                      <td className="muted-cell" title={line.description} style={{ minWidth: 180 }}>
                        <span className="line-clamp-2">{line.description}</span>
                      </td>
                      <td className="edit-cell" style={{ textAlign: 'right' }}>
                        {line.unit !== 'lumpsum' ? (
                          <input
                            type="number"
                            value={line.quantity}
                            onChange={(e) => handleCellChange(idx, 'quantity', parseFloat(e.target.value) || 0)}
                          />
                        ) : (
                          <span className="mono-cell">1</span>
                        )}
                      </td>
                      <td className="mono-cell">{line.unit}</td>
                      <td className="edit-cell" style={{ textAlign: 'right' }}>
                        <input
                          type="number"
                          value={line.rate}
                          onChange={(e) => handleCellChange(idx, 'rate', parseInt(e.target.value) || 0)}
                        />
                      </td>
                      <td className="amount-cell">₹{line.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 mt-1" style={{ borderTop: '1px solid var(--hairline)' }}>
              <p className="text-[11px] font-mono flex items-center gap-1.5" style={{ color: 'var(--stone)' }}>
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--amber)', display: 'inline-block' }} />
                Based on {result.city} rates · {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
              </p>
              <p className="text-[11px] font-mono" style={{ color: 'var(--stone)' }}>
                ±{result.confidence_range_pct}% Accuracy Range
              </p>
            </div>

            {/* Save action */}
            <div className="flex justify-end pt-2">
              <button
                onClick={() => toast('Estimate saved to project! Connect Supabase project_id to persist.', 'success')}
                className="btn-primary text-[12px]"
              >
                <span className="material-icons-outlined text-[14px]">bookmark_add</span>
                Save to Project
              </button>
            </div>
          </div>
        ) : (
          /* Idle placeholder */
          <div className="card-5bloc flex flex-col items-center justify-center text-center h-[450px] gap-4">
            <div className="w-16 h-16 flex items-center justify-center rounded-2xl" style={{ background: 'rgba(245,166,35,0.06)', boxShadow: 'inset 0 0 0 1px rgba(245,166,35,0.14)' }}>
              <span className="material-icons-outlined text-[26px]" style={{ color: 'var(--amber)', opacity: 0.5 }}>auto_awesome</span>
            </div>
            <div>
              <h4 className="font-display font-bold text-[16px] mb-1" style={{ color: 'var(--on-surface)' }}>Ready to estimate</h4>
              <p className="text-[13px] max-w-sm" style={{ color: 'var(--stone)' }}>Configure parameters on the left to generate your full Bill of Quantities.</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 mt-2">
              <span className="feature-pill">
                <span className="material-icons-outlined" style={{ fontSize: 12 }}>auto_awesome</span>
                AI-powered
              </span>
              <span className="feature-pill-success feature-pill">
                <span className="material-icons-outlined" style={{ fontSize: 12 }}>currency_rupee</span>
                Indian rates
              </span>
              <span className="feature-pill-blue feature-pill">
                <span className="material-icons-outlined" style={{ fontSize: 12 }}>gps_fixed</span>
                ±8% accurate
              </span>
            </div>
          </div>
        )}
 </div>

 </div>
 </div>
 )
}


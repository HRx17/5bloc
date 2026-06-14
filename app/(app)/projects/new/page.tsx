'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Toggle } from '@/components/ui/Toggle'
import { supabaseClient } from '@/lib/supabase/client'
import { getMyOrgId, hasSupabaseEnv } from '@/lib/data/client-data'

const DEFAULT_MILESTONES: { phase_key: string; label: string }[] = [
 { phase_key: 'pre_design', label: 'Pre-Design' },
 { phase_key: 'schematic_design', label: 'Schematic Design' },
 { phase_key: 'design_development', label: 'Design Development' },
 { phase_key: 'construction_docs', label: 'Construction Docs' },
 { phase_key: 'bidding', label: 'Bidding & Tender' },
 { phase_key: 'permits', label: 'Permits & Approvals' },
 { phase_key: 'construction_admin', label: 'Construction Admin' },
 { phase_key: 'complete', label: 'Close Out & Handover' },
]

export default function NewProject() {
 const router = useRouter()
 const [loading, setLoading] = useState(false)
 const [formData, setFormData] = useState({
 name: '',
 client: 'client-1',
 type: 'residential',
 city: '',
 state: '',
 address: '',
 sqft: '',
 floors: '',
 specLevel: 'premium', // standard, premium, luxury
 constructionCost: '',
 startDate: '',
 endDate: '',
 isRera: false,
 reraNumber: '',
 brief: '',
 })

 const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
 const { name, value } = e.target
 setFormData((prev) => ({ ...prev, [name]: value }))
 }

 const handleReraToggle = () => {
 setFormData((prev) => ({ ...prev, isRera: !prev.isRera }))
 }

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault()
 setLoading(true)

 try {
 if (hasSupabaseEnv()) {
 const orgId = await getMyOrgId()
 if (orgId) {
 const { data: proj, error } = await supabaseClient.from('projects').insert({
 org_id: orgId,
 name: formData.name,
 client_name: null,
 type: formData.type,
 status: 'active',
 phase: 1,
 phase_key: 'pre_design',
 city: formData.city || null,
 state: formData.state || null,
 address: formData.address || null,
 total_sqft: formData.sqft ? Number(formData.sqft) : null,
 floors: formData.floors ? Number(formData.floors) : null,
 construction_cost: formData.constructionCost ? Number(formData.constructionCost) : null,
 is_rera_registered: formData.isRera,
 brief: formData.brief || null,
 start_date: formData.startDate || null,
 end_date: formData.endDate || null,
 is_template: false,
 }).select('id').single()

 if (!error && proj?.id) {
 await supabaseClient.from('phase_milestones').insert(
 DEFAULT_MILESTONES.map((m) => ({
 org_id: orgId,
 project_id: proj.id,
 phase_key: m.phase_key,
 label: m.label,
 completion: 0,
 fee: 0,
 paid: false,
 is_template: false,
 }))
 )
 router.push(`/projects/${proj.id}`)
 return
 }
 }
 }
 // Fallback when Supabase is unavailable or no org yet
 await new Promise((resolve) => setTimeout(resolve, 600))
 router.push('/projects')
 } catch (err) {
 console.error(err)
 router.push('/projects')
 } finally {
 setLoading(false)
 }
 }

 return (
 <div className="p-6 font-body max-w-5xl mx-auto select-none">
 {/* Header */}
 <div className="mb-6 flex items-center justify-between">
 <div>
 <h1 className="text-2xl font-bold tracking-wide">Initiate New Project</h1>
 <p className="text-xs text-stone mt-1">Configure project specifications and launch coordination workspace.</p>
 </div>
 <Link href="/projects" className="btn-secondary py-2">
 CANCEL
 </Link>
 </div>

 <form onSubmit={handleSubmit} className="space-y-6">
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
 
 {/* Left Column: Identification and Location */}
 <div className="card-5bloc space-y-4">
 <h3 className="text-sm font-semibold pb-2 mb-4" style={{ color: 'var(--amber)', boxShadow: '0 1px 0 rgba(159,142,122,0.10)' }}>Project & Client Info</h3>
 
 <div>
 <label className="block text-[11px] font-semibold text-stone mb-1 font-body">Project Name *</label>
 <input
 type="text"
 name="name"
 required
 value={formData.name}
 onChange={handleInputChange}
 className="input-5bloc"
 placeholder="e.g. Wadhwa Prime Plaza"
 />
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-[11px] font-semibold text-stone mb-1 font-body">Client Link *</label>
 <select
 name="client"
 value={formData.client}
 onChange={handleInputChange}
 className="input-5bloc font-medium"
 >
 <option value="client-1">Parth Patel (Individual Client)</option>
 <option value="client-2">Wadhwa Developers (Corporate)</option>
 <option value="new">Add new client...</option>
 </select>
 </div>

 <div>
 <label className="block text-[11px] font-semibold text-stone mb-1 font-body">Project Type *</label>
 <select
 name="type"
 value={formData.type}
 onChange={handleInputChange}
 className="input-5bloc font-medium"
 >
 <option value="residential">Residential</option>
 <option value="commercial">Commercial</option>
 <option value="institutional">Institutional</option>
 <option value="industrial">Industrial</option>
 <option value="mixed">Mixed-use</option>
 <option value="interior">Interior fit-out</option>
 <option value="landscape">Landscape Design</option>
 </select>
 </div>
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-[11px] font-semibold text-stone mb-1 font-body">City *</label>
 <input
 type="text"
 name="city"
 required
 value={formData.city}
 onChange={handleInputChange}
 className="input-5bloc"
 placeholder="e.g. Mumbai"
 />
 </div>

 <div>
 <label className="block text-[11px] font-semibold text-stone mb-1 font-body">State</label>
 <input
 type="text"
 name="state"
 value={formData.state}
 onChange={handleInputChange}
 className="input-5bloc"
 placeholder="e.g. Maharashtra"
 />
 </div>
 </div>

 <div>
 <label className="block text-[11px] font-semibold text-stone mb-1 font-body">Site Physical Address</label>
 <input
 type="text"
 name="address"
 value={formData.address}
 onChange={handleInputChange}
 className="input-5bloc"
 placeholder="e.g. Linking Road, Bandra West"
 />
 </div>

 <div>
 <label className="block text-[11px] font-semibold text-stone mb-1 font-body">Project Brief / Notes</label>
 <textarea
 name="brief"
 rows={3}
 value={formData.brief}
 onChange={handleInputChange}
 className="input-5bloc resize-none"
 placeholder="Write any high-level guidelines or expectations here..."
 />
 </div>
 </div>

 {/* Right Column: Specifications and Timeline */}
 <div className="card-5bloc space-y-4">
 <h3 className="text-sm font-semibold pb-2 mb-4" style={{ color: 'var(--amber)', boxShadow: '0 1px 0 rgba(159,142,122,0.10)' }}>Specs, Cost & Timeline</h3>

 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-[11px] font-semibold text-stone mb-1 font-body">Total Area (sqft) *</label>
 <input
 type="number"
 name="sqft"
 required
 value={formData.sqft}
 onChange={handleInputChange}
 className="input-5bloc font-mono"
 placeholder="e.g. 15000"
 />
 </div>

 <div>
 <label className="block text-[11px] font-semibold text-stone mb-1 font-body">Number of Floors</label>
 <input
 type="number"
 name="floors"
 value={formData.floors}
 onChange={handleInputChange}
 className="input-5bloc font-mono"
 placeholder="e.g. 4"
 />
 </div>
 </div>

 {/* Spec Level Radio Cards */}
 <div>
 <label className="block text-[11px] font-semibold text-stone mb-1 font-body">Specification Level</label>
 <div className="grid grid-cols-3 gap-3">
 {[
 { id: 'standard', label: 'Standard', desc: '₹1,800/sqft' },
 { id: 'premium', label: 'Premium', desc: '₹2,700/sqft' },
 { id: 'luxury', label: 'Luxury', desc: '₹4,000/sqft' },
 ].map((spec) => (
 <div
 key={spec.id}
 onClick={() => setFormData(prev => ({ ...prev, specLevel: spec.id }))}
 className="card-5bloc p-3 text-center cursor-pointer flex flex-col justify-center"
 style={formData.specLevel === spec.id
 ? { boxShadow: 'var(--shadow-amber)', background: 'rgba(245,166,35,.06)', color: 'var(--amber)' }
 : { color: 'var(--on-surface)' }
 }
 >
 <span className="text-xs font-bold">{spec.label}</span>
 <span className="text-[10px] text-stone mt-1 font-mono">{spec.desc}</span>
 </div>
 ))}
 </div>
 </div>

 <div>
 <label className="block text-[11px] font-semibold text-stone mb-1 font-body">Estimated Construction Budget (₹)</label>
 <input
 type="number"
 name="constructionCost"
 value={formData.constructionCost}
 onChange={handleInputChange}
 className="input-5bloc font-mono"
 placeholder="e.g. 45000000"
 />
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-[11px] font-semibold text-stone mb-1 font-body">Start Date</label>
 <input
 type="date"
 name="startDate"
 value={formData.startDate}
 onChange={handleInputChange}
 className="input-5bloc font-mono"
 />
 </div>

 <div>
 <label className="block text-[11px] font-semibold text-stone mb-1 font-body">Estimated End Date</label>
 <input
 type="date"
 name="endDate"
 value={formData.endDate}
 onChange={handleInputChange}
 className="input-5bloc font-mono"
 />
 </div>
 </div>

 {/* RERA Section */}
 <div className="pt-4 space-y-4" style={{ boxShadow: '0 -1px 0 rgba(159,142,122,0.10)' }}>
 <div className="flex items-center justify-between">
 <div>
 <h4 className="text-xs font-bold text-white">RERA Registered Project</h4>
 <p className="text-[10px] text-stone">Does this project comply with digital RERA reporting?</p>
 </div>
 <Toggle on={formData.isRera} onChange={(v) => setFormData(prev => ({ ...prev, isRera: v }))} label="RERA compliant" />
 </div>

 {formData.isRera && (
 <div className="animate-fade-in">
 <label className="block text-[11px] font-semibold text-stone mb-1 font-body">RERA Registration Number *</label>
 <input
 type="text"
 name="reraNumber"
 required={formData.isRera}
 value={formData.reraNumber}
 onChange={handleInputChange}
 className="input-5bloc font-mono"
 placeholder="e.g. P51800012345"
 />
 </div>
 )}
 </div>
 </div>
 </div>

 {/* Submit */}
 <div className="flex justify-end pt-2">
 <button
 type="submit"
 disabled={loading}
 className="btn-primary px-10 py-3 text-base tracking-wider font-bold"
 >
 {loading ? 'CREATING PROJECT...' : 'CREATE PROJECT WORKSPACE'}
 </button>
 </div>
 </form>
 </div>
 )
}


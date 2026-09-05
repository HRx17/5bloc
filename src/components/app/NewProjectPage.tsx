import React, { useEffect, useState } from 'react'
import { useRouter } from '@/compat/next-navigation'
import Link from '@/compat/next-link'
import { MARKETPLACE_SERVICES } from '@/lib/marketplace/services'
import { useToast } from '@/components/ui5/Toast'
import { isPaywallEnforced } from '@/lib/payments/gates'

type FieldErrors = Partial<Record<'name' | 'city' | 'sqft' | 'reraNumber' | 'servicesNeeded', string>>

export default function NewProjectPage() {
 const router = useRouter()
 const { toast } = useToast()
 const [loading, setLoading] = useState(false)
 const [errors, setErrors] = useState<FieldErrors>({})
 const [clients, setClients] = useState<any[]>([])
 const [planGate, setPlanGate] = useState<{ blocked: boolean; count: number }>({ blocked: false, count: 0 })
 const [formData, setFormData] = useState({
 name: '',
 client: '',
 type: 'residential',
 city: '',
 state: '',
 address: '',
 sqft: '',
 floors: '',
 specLevel: 'premium',
 constructionCost: '',
 startDate: '',
 endDate: '',
 isRera: false,
 reraNumber: '',
 brief: '',
 openForBidding: false,
 servicesNeeded: [] as string[],
 bidDeadline: '',
 })

 useEffect(() => {
 Promise.all([
 fetch('/api/clients').then((r) => r.json()),
 fetch('/api/projects').then((r) => r.json()),
 fetch('/api/me').then((r) => r.json()).catch(() => ({ profile: { plan: 'free' } })),
 ])
 .then(([c, p, me]) => {
 const list = c.clients || []
 setClients(list)
 if (list[0]) setFormData((prev) => ({ ...prev, client: list[0].id }))
 const count = (p.projects || []).length
 const plan = me.profile?.plan || 'free'
 setPlanGate({ blocked: isPaywallEnforced() && plan === 'free' && count >= 3, count })
 })
 .catch(() =>
 toast('Could not load your CRM contacts. You can still create the project and link a contact later.', 'warning', 6000)
 )
 }, [toast])


 const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
 const { name, value } = e.target
 setFormData((prev) => ({ ...prev, [name]: value }))
 setErrors((prev) => ({ ...prev, [name]: undefined }))
 }

 const handleReraToggle = () => {
 setFormData((prev) => ({ ...prev, isRera: !prev.isRera }))
 }

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault()
 if (loading) return
 if (planGate.blocked) {
 toast('Free plan limit reached: 3 projects. Upgrade to Solo to add more.', 'warning')
 router.push('/settings?tab=billing')
 return
 }

 const nextErrors: FieldErrors = {}
 if (!formData.name.trim()) nextErrors.name = 'Give the project a name your team will recognise.'
 if (!formData.city.trim()) nextErrors.city = 'Enter the city the site is in.'
 if (!formData.sqft.trim()) nextErrors.sqft = 'Enter the built-up area in sqft.'
 else if (!(Number(formData.sqft) > 0)) nextErrors.sqft = 'Area must be a number above zero.'
 if (formData.isRera && !formData.reraNumber.trim()) {
 nextErrors.reraNumber = 'Add the RERA registration number, or turn RERA off.'
 }
 if (formData.openForBidding && formData.servicesNeeded.length === 0) {
 nextErrors.servicesNeeded = 'Pick at least one service so contractors know what to bid on.'
 }
 if (Object.keys(nextErrors).length) {
 setErrors(nextErrors)
 toast('Fix the highlighted fields before creating this project.', 'warning')
 return
 }
 setErrors({})
 setLoading(true)

 try {
 const res = await fetch('/api/projects', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 name: formData.name.trim(),
 client_id: formData.client && formData.client !== 'new' ? formData.client : null,
 type: formData.type,
 city: formData.city,
 state: formData.state,
 address: formData.address,
 total_sqft: formData.sqft ? Number(formData.sqft) : null,
 floors: formData.floors ? Number(formData.floors) : null,
 spec_level: formData.specLevel,
 construction_cost: formData.constructionCost ? Number(formData.constructionCost) : null,
 start_date: formData.startDate || null,
 estimated_end: formData.endDate || null,
 is_rera_registered: formData.isRera,
 rera_number: formData.reraNumber || null,
 brief: formData.brief,
 open_for_bidding: formData.openForBidding,
 services_needed: formData.openForBidding ? formData.servicesNeeded : [],
 bid_deadline: formData.openForBidding && formData.bidDeadline ? formData.bidDeadline : null,
 }),
 })
 const data = await res.json()
 if (!res.ok) throw new Error(data.error || 'Failed to create project')
 if (formData.openForBidding) {
 toast(
 data.open_tender
 ? `Project created and posted to the marketplace for ${formData.servicesNeeded.length} service${formData.servicesNeeded.length === 1 ? '' : 's'}.`
 : 'Project created, but the open bidding post failed. Post a tender from the project workspace.',
 data.open_tender ? 'success' : 'warning',
 6000
 )
 } else {
 toast('Project created', 'success')
 }
 router.push(`/projects/${data.project.id}`)
 } catch (err) {
 console.error(err)
 toast(
 err instanceof Error
 ? `${err.message} — nothing was created, your details are still here.`
 : 'Could not create the project. Nothing was created, your details are still here.',
 'error',
 6000
 )
 setLoading(false)
 }
 }

 return (
 <div className="page-m font-body select-none">
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

 <form onSubmit={handleSubmit} noValidate className="space-y-6">
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
 
 {/* Left Column: Identification and Location */}
 <div className="card-m p-5 space-y-4">
 <h3 className="card-m-title pb-2 mb-2" style={{ color: 'var(--amber-dk)', boxShadow: 'inset 0 -1px 0 var(--hairline)' }}>Project & Client Info</h3>
 
 <div>
 <label className="block text-[11px] font-semibold text-stone mb-1 font-body">Project Name *</label>
 <input
 type="text"
 name="name"
 value={formData.name}
 onChange={handleInputChange}
 className="input-5bloc"
 placeholder="e.g. Wadhwa Prime Plaza"
 aria-invalid={!!errors.name}
 />
 {errors.name && <p className="text-[11px] mt-1" style={{ color: 'var(--error)' }}>{errors.name}</p>}
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
 <option value="">No CRM contact linked</option>
 {clients.map((c) => (
 <option key={c.id} value={c.id}>
 {c.full_name}{c.company ? ` (${c.company})` : ''}
 </option>
 ))}
 </select>
 {planGate.blocked && (
 <p className="text-[11px] mt-2" style={{ color: 'var(--error)' }}>
 Free plan limit reached ({planGate.count}/3 projects).{' '}
 <Link href="/settings" className="underline">Upgrade in Settings</Link>
 </p>
 )}
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
 <p className="text-[11px] text-stone mt-1.5 leading-relaxed">
  Changes the default NOC checklist, bye-law panel and AI cost/fee bands.
  Commercial, institutional and industrial are not treated as residential.
 </p>
 </div>
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-[11px] font-semibold text-stone mb-1 font-body">City *</label>
 <input
 type="text"
 name="city"
 value={formData.city}
 onChange={handleInputChange}
 className="input-5bloc"
 placeholder="e.g. Mumbai"
 aria-invalid={!!errors.city}
 />
 {errors.city && <p className="text-[11px] mt-1" style={{ color: 'var(--error)' }}>{errors.city}</p>}
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
 <div className="card-m p-5 space-y-4">
 <h3 className="card-m-title pb-2 mb-2" style={{ color: 'var(--amber-dk)', boxShadow: 'inset 0 -1px 0 var(--hairline)' }}>Specs, Cost & Timeline</h3>

 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-[11px] font-semibold text-stone mb-1 font-body">Total Area (sqft) *</label>
 <input
 type="number"
 name="sqft"
 min={1}
 value={formData.sqft}
 onChange={handleInputChange}
 className="input-5bloc font-mono"
 placeholder="e.g. 15000"
 aria-invalid={!!errors.sqft}
 />
 {errors.sqft && <p className="text-[11px] mt-1" style={{ color: 'var(--error)' }}>{errors.sqft}</p>}
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
 className="card-m p-3 text-center cursor-pointer flex flex-col justify-center"
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
 <p className="text-[11px] text-stone mt-1.5 leading-relaxed">
  Client&apos;s target build cost — not your fee. Shown as Target Cost on the project,
  used when you quote a fee as a percentage, and becomes the marketplace bid ceiling
  if you post this project for open bidding. Leave blank if you do not know yet.
 </p>
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
 <div className="pt-4 space-y-4" style={{ boxShadow: 'inset 0 1px 0 var(--hairline)' }}>
 <div className="flex items-center justify-between">
 <div>
 <h4 className="text-xs font-bold" style={{ color: 'var(--on-surface)' }}>RERA Registered Project</h4>
 <p className="text-[10px] text-stone">Does this project comply with digital RERA reporting?</p>
 </div>
 <button
 type="button"
 onClick={handleReraToggle}
 className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer border-2 transition-colors duration-200 ease-in-out focus:outline-none ${
 formData.isRera ? 'bg-success' : 'bg-navy-lt'
 }`}
 >
 <span
 className={`pointer-events-none inline-block h-5 w-5 transform bg-white shadow ring-0 transition duration-200 ease-in-out ${
 formData.isRera ? 'translate-x-5' : 'translate-x-0'
 }`}
 />
 </button>
 </div>

 {formData.isRera && (
 <div className="animate-fade-in">
 <label className="block text-[11px] font-semibold text-stone mb-1 font-body">RERA Registration Number *</label>
 <input
 type="text"
 name="reraNumber"
 value={formData.reraNumber}
 onChange={handleInputChange}
 className="input-5bloc font-mono"
 placeholder="e.g. P51800012345"
 aria-invalid={!!errors.reraNumber}
 />
 {errors.reraNumber && (
 <p className="text-[11px] mt-1" style={{ color: 'var(--error)' }}>{errors.reraNumber}</p>
 )}
 </div>
 )}
 </div>
 </div>
 </div>

 {/* Open bidding → marketplace for contractors/vendors */}
 <div className="card-m p-5 space-y-4">
 <div className="flex items-start justify-between gap-4">
 <div>
 <h3 className="card-m-title" style={{ color: 'var(--amber-dk)' }}>Post for open bidding</h3>
 <p className="text-[11px] text-stone mt-1">
 When enabled, this project appears as a card for contractors and vendors in the marketplace — only for the services you select.
 </p>
 </div>
 <button
 type="button"
 onClick={() =>
 setFormData((prev) => ({
 ...prev,
 openForBidding: !prev.openForBidding,
 servicesNeeded: !prev.openForBidding ? prev.servicesNeeded : [],
 }))
 }
 className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer border-2 transition-colors duration-200 ease-in-out focus:outline-none ${
 formData.openForBidding ? 'bg-success' : 'bg-navy-lt'
 }`}
 aria-pressed={formData.openForBidding}
 >
 <span
 className={`pointer-events-none inline-block h-5 w-5 transform bg-white shadow ring-0 transition duration-200 ease-in-out ${
 formData.openForBidding ? 'translate-x-5' : 'translate-x-0'
 }`}
 />
 </button>
 </div>

 {formData.openForBidding && (
 <div className="space-y-4 animate-fade-in">
 <div>
 <label className="block text-[11px] font-semibold text-stone mb-2 font-body">Services needed *</label>
 <div className="flex flex-wrap gap-2">
 {MARKETPLACE_SERVICES.map((svc) => {
 const on = formData.servicesNeeded.includes(svc)
 return (
 <button
 key={svc}
 type="button"
 onClick={() => {
 setErrors((prev) => ({ ...prev, servicesNeeded: undefined }))
 setFormData((prev) => ({
 ...prev,
 servicesNeeded: on
 ? prev.servicesNeeded.filter((s) => s !== svc)
 : [...prev.servicesNeeded, svc],
 }))
 }}
                className={`chip-m text-[11px] ${on ? 'chip-m-amber' : ''}`}
 >
 {svc}
 </button>
 )
 })}
 </div>
 {errors.servicesNeeded && (
 <p className="text-[11px] mt-2" style={{ color: 'var(--error)' }}>{errors.servicesNeeded}</p>
 )}
 </div>
 <div className="max-w-xs">
 <label className="block text-[11px] font-semibold text-stone mb-1 font-body">Bid deadline</label>
 <input
 type="date"
 name="bidDeadline"
 value={formData.bidDeadline}
 onChange={handleInputChange}
 className="input-5bloc font-mono"
 />
 </div>
 </div>
 )}
 </div>

 {/* Submit */}
 <div className="flex justify-end pt-2">
 <button
 type="submit"
 disabled={loading}
 className="btn-primary px-10 py-3 text-base tracking-wider font-bold"
 >
 {loading
 ? 'CREATING PROJECT...'
 : formData.openForBidding
 ? 'CREATE & POST TO MARKETPLACE'
 : 'CREATE PROJECT WORKSPACE'}
 </button>
 </div>
 </form>
 </div>
 )
}


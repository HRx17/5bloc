'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

interface SubmittalItem {
 id: string
 submittal_number: number
 title: string
 spec_section: string
 contractor: string
 status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'revise_resubmit'
 due_date: string
 revision: number
 description?: string
 file_name?: string
 review_note?: string
}

export default function SubmittalsLog() {
 const params = useParams()
 const projectId = params.id as string

 const [submittals, setSubmittals] = useState<SubmittalItem[]>([])
 const [loading, setLoading] = useState(true)
 const [showCreateModal, setShowCreateModal] = useState(false)
 const [activeSubmittal, setActiveSubmittal] = useState<SubmittalItem | null>(null)

 const [newSubmittal, setNewSubmittal] = useState({
 title: '',
 spec_section: '',
 description: '',
 contractor: 'Amit Sharma (Civil Contractor)',
 due_date: '',
 })

 useEffect(() => {
 // Mock load submittals
 const timer = setTimeout(() => {
 setSubmittals([
 {
 id: 'sub-1',
 submittal_number: 1,
 title: 'Vitrified Tiles Shop Drawings',
 spec_section: 'Section 09 30 00 - Tiling',
 contractor: 'Amit Sharma (Civil)',
 status: 'approved',
 due_date: '2026-05-10',
 revision: 1,
 description: 'Joint layouts and adhesive details for the main reception lobby vitrified flooring.',
 file_name: 'tiles_lobby_det_v2.pdf',
 },
 {
 id: 'sub-2',
 submittal_number: 2,
 title: 'Exterior Paint Product Data Sheet',
 spec_section: 'Section 09 90 00 - Painting',
 contractor: 'Amit Sharma (Civil)',
 status: 'pending',
 due_date: '2026-06-20',
 revision: 0,
 description: 'Weatherproof external paint tech sheets confirming UV resistance ratings.',
 file_name: 'asian_paints_apex_data.pdf',
 },
 {
 id: 'sub-3',
 submittal_number: 3,
 title: 'Glass Facade structural calculations',
 spec_section: 'Section 08 44 00 - Glazing',
 contractor: 'Rajesh Glass Works (Glass)',
 status: 'under_review',
 due_date: '2026-06-16',
 revision: 0,
 description: 'Wind pressure load calculations for structural double-glazing frames.',
 file_name: 'facade_wind_loads.pdf',
 }
 ])
 setLoading(false)
 }, 300)
 return () => clearTimeout(timer)
 }, [projectId])

 const handleCreateSubmittal = (e: React.FormEvent) => {
 e.preventDefault()
 
 const subRecord: SubmittalItem = {
 id: `sub-${Date.now()}`,
 submittal_number: submittals.length + 1,
 title: newSubmittal.title,
 spec_section: newSubmittal.spec_section,
 contractor: newSubmittal.contractor,
 status: 'pending',
 due_date: newSubmittal.due_date || new Date().toISOString().split('T')[0],
 revision: 0,
 description: newSubmittal.description,
 file_name: 'data_sheet_attachment.pdf',
 }

 setSubmittals(prev => [subRecord, ...prev])
 setShowCreateModal(false)
 setNewSubmittal({ title: '', spec_section: '', description: '', contractor: 'Amit Sharma (Civil Contractor)', due_date: '' })
 }

 const handleReviewAction = (status: SubmittalItem['status']) => {
 if (!activeSubmittal) return

 setSubmittals(prev => 
 prev.map(s => s.id === activeSubmittal.id ? { 
 ...s, 
 status, 
 review_note: activeSubmittal.review_note 
 } : s)
 )
 setActiveSubmittal(null)
 }

 const getStatusBadge = (status: SubmittalItem['status']) => {
 switch (status) {
 case 'pending': return 'bg-stone/15 text-stone '
 case 'under_review': return 'bg-amber/10 text-amber '
 case 'approved': return 'bg-success/10 text-success '
 case 'rejected':
 case 'revise_resubmit': return 'bg-error/10 text-error '
 }
 }

 return (
 <div className="space-y-6 font-body select-none relative h-full">
 {/* Submittals Log List Card */}
 <div className="card-5bloc flex flex-col justify-between">
 <div className="flex items-center justify-between pb-4 border-b ">
 <div>
 <h3 className="text-sm font-semibold text-white">Product & Material Submittals</h3>
 <p className="text-[11px] text-stone mt-0.5">Review technical spec sheets and contractor sample files.</p>
 </div>
 <button onClick={() => setShowCreateModal(true)} className="btn-primary py-2 text-xs">
 <span className="material-icons-outlined text-[16px]">add</span>
 Log Submittal
 </button>
 </div>

 {loading ? (
 <div className="p-8 text-center text-stone animate-pulse">Loading submittal files...</div>
 ) : submittals.length === 0 ? (
 <div className="py-16 text-center text-stone flex flex-col items-center">
 <span className="material-icons-outlined text-[48px] text-stone/30 mb-3">fact_check</span>
 <h4 className="text-sm font-bold text-white">No submittals logged</h4>
 <p className="text-xs max-w-xs mt-1">Logged submittals must be verified before material procurement.</p>
 </div>
 ) : (
 <div className="overflow-x-auto mt-4">
 <table className="w-full text-left text-xs ">
 <thead>
 <tr className="text-stone border-b font-body text-[10px] tracking-wider font-semibold">
 <th className="pb-3 pl-2">#</th>
 <th className="pb-3">Submittal Title</th>
 <th className="pb-3">Spec Section</th>
 <th className="pb-3">Contractor</th>
 <th className="pb-3">Status</th>
 <th className="pb-3">Due Date</th>
 <th className="pb-3">Revision</th>
 <th className="pb-3 pr-2 text-right">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-navy-lt/40">
 {submittals.map((sub) => (
 <tr 
 key={sub.id} 
 className="hover:bg-navy-lt/20 cursor-pointer transition-colors group"
 onClick={() => setActiveSubmittal(sub)}
 >
 <td className="py-4 pl-2 font-mono text-[10px] text-stone">SUB-{String(sub.submittal_number).padStart(3, '0')}</td>
 <td className="py-4 font-semibold pr-4">
 <span className="text-white group-hover:text-amber transition-colors line-clamp-1">{sub.title}</span>
 {sub.file_name && (
 <span className="text-[10px] text-stone font-mono mt-0.5 block flex items-center gap-0.5">
 <span className="material-icons-outlined text-[13px] text-blue">attachment</span> {sub.file_name}
 </span>
 )}
 </td>
 <td className="py-4 text-stone">{sub.spec_section}</td>
 <td className="py-4 text-stone">{sub.contractor}</td>
 <td className="py-4">
 <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${getStatusBadge(sub.status)}`}>
 {sub.status.replace(/_/g, ' ').toUpperCase()}
 </span>
 </td>
 <td className="py-4 font-mono text-[10px] text-stone">{sub.due_date}</td>
 <td className="py-4 font-mono text-[10px] text-stone">Rev {sub.revision}</td>
 <td className="py-4 pr-2 text-right">
 <span className="material-icons-outlined text-stone group-hover:text-white transition-colors text-[18px]">
 chevron_right
 </span>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )}
 </div>

 {/* Submittal Log Creation Modal */}
 {showCreateModal && (
 <div className="fixed inset-0 bg-navy/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
 <div className="w-full max-w-md bg-navy-mid border rounded-lg p-6 shadow-none relative">
 <div className="flex items-center justify-between border-b pb-3 mb-4">
 <h3 className="text-sm font-semibold text-amber font-body">Log New Material Submittal</h3>
 <button onClick={() => setShowCreateModal(false)} className="text-stone hover:text-white transition">
 <span className="material-icons-outlined text-[18px]">close</span>
 </button>
 </div>

 <form onSubmit={handleCreateSubmittal} className="space-y-4">
 <div>
 <label className="block text-[10px] font-semibold text-stone mb-1 font-body">Submittal Title *</label>
 <input
 type="text"
 required
 placeholder="e.g. Lobby Marble Flooring Tile samples"
 value={newSubmittal.title}
 onChange={(e) => setNewSubmittal(prev => ({ ...prev, title: e.target.value }))}
 className="input-5bloc py-1.5 text-xs"
 />
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-[10px] font-semibold text-stone mb-1 font-body">Spec Section (CSI)</label>
 <input
 type="text"
 placeholder="e.g. Section 09 30 00"
 value={newSubmittal.spec_section}
 onChange={(e) => setNewSubmittal(prev => ({ ...prev, spec_section: e.target.value }))}
 className="input-5bloc py-1.5 text-xs"
 />
 </div>
 <div>
 <label className="block text-[10px] font-semibold text-stone mb-1 font-body">Due Date</label>
 <input
 type="date"
 value={newSubmittal.due_date}
 onChange={(e) => setNewSubmittal(prev => ({ ...prev, due_date: e.target.value }))}
 className="input-5bloc py-1.5 text-xs font-mono"
 />
 </div>
 </div>

 <div>
 <label className="block text-[10px] font-semibold text-stone mb-1 font-body">Spec Description</label>
 <textarea
 rows={3}
 placeholder="Detail sample dimensions, batch lot references, or testing criteria..."
 value={newSubmittal.description}
 onChange={(e) => setNewSubmittal(prev => ({ ...prev, description: e.target.value }))}
 className="input-5bloc text-xs resize-none"
 />
 </div>

 <div>
 <label className="block text-[10px] font-semibold text-stone mb-1 font-body">Select Contractor</label>
 <select
 value={newSubmittal.contractor}
 onChange={(e) => setNewSubmittal(prev => ({ ...prev, contractor: e.target.value }))}
 className="input-5bloc py-1.5 text-xs"
 >
 <option value="Amit Sharma (Civil)">Amit Sharma (Civil)</option>
 <option value="Rajesh Glass Works (Glazing)">Rajesh Glass Works (Glazing)</option>
 </select>
 </div>

 <div className="pt-4 flex justify-end gap-3 border-t ">
 <button 
 type="button" 
 onClick={() => setShowCreateModal(false)}
 className="btn-secondary py-1.5 px-4 text-xs"
 >
 Cancel
 </button>
 <button 
 type="submit"
 className="btn-primary py-1.5 px-6 text-xs font-bold"
 >
 Log Record
 </button>
 </div>
 </form>
 </div>
 </div>
 )}

 {/* Submittal review Slide-over */}
 {activeSubmittal && (
 <div className="fixed inset-0 z-50 flex justify-end bg-navy/60 backdrop-blur-xs select-none">
 <div className="fixed inset-0" onClick={() => setActiveSubmittal(null)} />
 <div className="relative w-full max-w-lg h-screen bg-navy-mid border-l shadow-none flex flex-col justify-between z-10 animate-slide-in">
 {/* Slide-over Header */}
 <div className="px-6 py-4 bg-navy border-b flex items-center justify-between">
 <div>
 <h3 className="text-sm font-semibold text-white">
 SUB-{String(activeSubmittal.submittal_number).padStart(3, '0')}
 </h3>
 <span className="text-[10px] text-stone mt-0.5 block">Contractor: {activeSubmittal.contractor}</span>
 </div>
 <button onClick={() => setActiveSubmittal(null)} className="text-stone hover:text-white transition p-1 hover:bg-navy-lt rounded-md">
 <span className="material-icons-outlined text-[20px]">close</span>
 </button>
 </div>

 {/* Slide-over Body */}
 <div className="flex-1 overflow-y-auto p-6 space-y-6">
 <div className="space-y-2">
 <h4 className="text-sm font-semibold text-white leading-snug">{activeSubmittal.title}</h4>
 <div className="flex flex-wrap gap-2">
 <span className="text-[10px] font-mono text-stone bg-navy border px-2 py-0.5 rounded-md">
 {activeSubmittal.spec_section}
 </span>
 <span className="text-[10px] font-mono text-stone bg-navy border px-2 py-0.5 rounded-md">
 Revision: {activeSubmittal.revision}
 </span>
 </div>

 <p className="text-xs text-stone leading-relaxed bg-navy/30 border p-4 rounded-md mt-3">
 {activeSubmittal.description || 'No additional details provided.'}
 </p>

 {activeSubmittal.file_name && (
 <div className="p-3 bg-navy-lt/50 rounded-md flex items-center justify-between mt-3 border ">
 <div className="flex items-center gap-2 text-xs truncate">
 <span className="material-icons-outlined text-[20px] text-blue">picture_as_pdf</span>
 <span className="text-white truncate font-mono text-[11px]">{activeSubmittal.file_name}</span>
 </div>
 <button className="text-xs text-blue hover:text-blue-lt transition font-semibold">View</button>
 </div>
 )}
 </div>

 {/* Review area */}
 <div className="pt-6 border-t space-y-4">
 <h4 className="text-xs font-semibold text-white">Review Decision</h4>
 
 <textarea
 rows={4}
 placeholder="Provide feedback note for approval validation or revision instructions..."
 value={activeSubmittal.review_note || ''}
 onChange={(e) => setActiveSubmittal(prev => prev ? { ...prev, review_note: e.target.value } : null)}
 className="input-5bloc text-xs resize-none"
 />
 </div>
 </div>

 {/* Slide-over Footer controls */}
 <div className="px-6 py-4 bg-navy border-t flex flex-wrap gap-2.5 items-center justify-end shrink-0">
 <button 
 onClick={() => handleReviewAction('revise_resubmit')}
 className="btn-secondary btn-sm"
                      style={{ color: 'var(--error)' }}
 >
 Revise & Resubmit
 </button>
 <button 
 onClick={() => handleReviewAction('approved')}
 className="btn-primary py-1.5 px-6 text-xs font-bold"
 >
 Approve Submittal
 </button>
 </div>
 </div>
 </div>
 )}
 </div>
 )
}

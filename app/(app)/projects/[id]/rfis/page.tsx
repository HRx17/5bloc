'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import EmailComposer from '@/components/modals/EmailComposer'

interface RFIItem {
 id: string
 rfi_number: number
 title: string
 description: string
 drawing_ref?: string
 status: 'open' | 'in_review' | 'answered' | 'closed'
 raised_by: string
 assigned_to: string
 due_date: string
 response?: string
 is_scope_change: boolean
 scope_change_amount?: number
}

export default function RFILog() {
 const params = useParams()
 const projectId = params.id as string

 const [rfis, setRfis] = useState<RFIItem[]>([])
 const [loading, setLoading] = useState(true)
 const [showCreateModal, setShowCreateModal] = useState(false)
 const [activeRfi, setActiveRfi] = useState<RFIItem | null>(null)
 const [emailComposerData, setEmailComposerData] = useState<{ to: string; subject: string; defaultBody: string } | null>(null)
 
 // Create Form State
 const [newRfi, setNewRfi] = useState({
 title: '',
 description: '',
 drawing_ref: '',
 assigned_to: 'Amit Sharma',
 due_date: '',
 })

 // AI draft state
 const [aiDrafting, setAiDrafting] = useState(false)
 const [aiDraftText, setAiDraftText] = useState('')

 useEffect(() => {
 // Mock load RFIs
 const timer = setTimeout(() => {
 setRfis([
 {
 id: 'rfi-1',
 rfi_number: 1,
 title: 'Beam Reinforcement Revision at Grid B-4',
 description: 'Slab reinforcement details do not match the column layout grid drawings. Please confirm spacing constraints.',
 drawing_ref: 'S-201 (Rev 2)',
 status: 'open',
 raised_by: 'Amit Sharma (Contractor)',
 assigned_to: 'Parth Patel (Architect)',
 due_date: '2026-06-15',
 is_scope_change: false,
 },
 {
 id: 'rfi-2',
 rfi_number: 2,
 title: 'HVAC Duct Clearance in Lobby',
 description: 'Clear ceiling height drops below 2.4m if duct runs according to services layouts. Need structural review.',
 drawing_ref: 'M-104',
 status: 'in_review',
 raised_by: 'Rohan Deshmukh (MEP)',
 assigned_to: 'Aritro Roy (Consultant)',
 due_date: '2026-06-18',
 is_scope_change: true,
 scope_change_amount: 125000,
 },
 {
 id: 'rfi-3',
 rfi_number: 3,
 title: 'Sanitary fittings brand selection',
 description: 'Premium specification calls for Kohler, but local inventory is delayed by 6 weeks. Recommend alternative.',
 drawing_ref: 'A-402',
 status: 'answered',
 raised_by: 'Karan Shah (Builder)',
 assigned_to: 'Parth Patel (Architect)',
 due_date: '2026-05-30',
 response: 'Approved alternate sanitary selection to Toto brand. Premium grade models only.',
 is_scope_change: false,
 }
 ])
 setLoading(false)
 }, 400)
 return () => clearTimeout(timer)
 }, [projectId])

 const handleCreateRfi = (e: React.FormEvent) => {
 e.preventDefault()
 
 const rfiRecord: RFIItem = {
 id: `rfi-${Date.now()}`,
 rfi_number: rfis.length + 1,
 title: newRfi.title,
 description: newRfi.description,
 drawing_ref: newRfi.drawing_ref,
 status: 'open',
 raised_by: 'Parth Patel (Architect)',
 assigned_to: newRfi.assigned_to,
 due_date: newRfi.due_date || new Date().toISOString().split('T')[0],
 is_scope_change: false,
 }

 setRfis(prev => [rfiRecord, ...prev])
 setShowCreateModal(false)
 setNewRfi({ title: '', description: '', drawing_ref: '', assigned_to: 'Amit Sharma', due_date: '' })
 }

 const handleRequestAIDraft = async () => {
 if (!activeRfi) return
 setAiDrafting(true)
 setAiDraftText('')

 try {
 // Simulate Claude RFI Draft API response
 await new Promise(resolve => setTimeout(resolve, 1500))
 
 const draftedResponse = `Based on drawing S-201, column grid overlap is resolved by shifting the main reinforcement bundle by 50mm to the east. We suggest concrete grade M30 casting to compensate for reinforcement spacing offsets. This change is local and does not imply a major structural scope variance.`
 
 setAiDraftText(draftedResponse)
 } catch (err) {
 console.error(err)
 } finally {
 setAiDrafting(false)
 }
 }

 const handleSaveResponse = () => {
 if (!activeRfi) return
 
 setRfis(prev => 
 prev.map(r => r.id === activeRfi.id ? { 
 ...r, 
 status: 'answered', 
 response: activeRfi.response,
 is_scope_change: activeRfi.is_scope_change,
 scope_change_amount: activeRfi.scope_change_amount
 } : r)
 )
 setActiveRfi(null)
 }

 const getStatusStyle = (status: RFIItem['status']): React.CSSProperties => {
 switch (status) {
 case 'open': return { background: 'rgba(255,180,171,.12)', color: 'var(--error)' }
 case 'in_review': return { background: 'rgba(245,166,35,.12)', color: 'var(--amber)' }
 case 'answered': return { background: 'rgba(111,220,140,.12)', color: 'var(--success)' }
 case 'closed': return { background: 'rgba(159,142,122,.10)', color: 'var(--stone)' }
 }
 }

 const openCount = rfis.filter(r => r.status === 'open').length
 const reviewCount = rfis.filter(r => r.status === 'in_review').length
 const answeredCount = rfis.filter(r => r.status === 'answered').length

 return (
 <div className="space-y-6 font-body select-none relative h-full">
 {/* Stats row widget */}
 <div className="grid grid-cols-3 gap-5">
 {[
 { label: 'Unresolved / Open', value: openCount, color: 'text-error' },
 { label: 'Under Review', value: reviewCount, color: 'text-amber' },
 { label: 'Answered / Resolved', value: answeredCount, color: 'text-success' },
 ].map((stat, idx) => (
 <div key={idx} className="card-5bloc p-4">
 <span className="text-xs text-stone font-medium">{stat.label}</span>
 <h4 className={`text-xl font-bold mt-1 ${stat.color}`}>{stat.value}</h4>
 </div>
 ))}
 </div>

 {/* Main RFI table Card container */}
 <div className="card-5bloc flex flex-col justify-between">
 <div className="flex items-center justify-between pb-4" style={{ boxShadow: '0 1px 0 rgba(159,142,122,0.10)' }}>
 <div>
 <h3 className="text-sm font-semibold" style={{ color: 'var(--on-surface)' }}>Request For Information Log</h3>
 <p className="text-[11px] mt-0.5" style={{ color: 'var(--stone)' }}>Track coordination queries between contractors and consultants.</p>
 </div>
 <button onClick={() => setShowCreateModal(true)} className="btn-primary py-2 text-xs">
 <span className="material-icons-outlined text-[16px]">add</span>
 Raise New RFI
 </button>
 </div>

 {loading ? (
 <div className="p-8 text-center text-stone animate-pulse">Loading RFI log...</div>
 ) : rfis.length === 0 ? (
 <div className="py-16 text-center text-stone flex flex-col items-center">
 <span className="material-icons-outlined text-[48px] text-stone/30 mb-3">forum</span>
 <h4 className="text-sm font-bold text-white">No RFIs logged</h4>
 <p className="text-xs max-w-xs mt-1">Contractors can raise RFIs to clarify drawing specifications.</p>
 </div>
 ) : (
 <div className="overflow-x-auto mt-4">
 <table className="w-full text-left text-xs" style={{ borderCollapse: 'collapse' }}>
 <thead>
 <tr className="text-xs font-semibold" style={{ color: 'var(--stone)', boxShadow: '0 1px 0 rgba(159,142,122,0.12)' }}>
 <th className="pb-3 pl-2">#</th>
 <th className="pb-3">Query Title</th>
 <th className="pb-3">Raised By</th>
 <th className="pb-3">Assigned To</th>
 <th className="pb-3">Status</th>
 <th className="pb-3">Due Date</th>
 <th className="pb-3 pr-2 text-right">Actions</th>
 </tr>
 </thead>
 <tbody>
 {rfis.map((rfi) => (
 <tr
 key={rfi.id}
 className="cursor-pointer group"
 style={{ boxShadow: '0 1px 0 rgba(159,142,122,0.08)' }}
 onClick={() => setActiveRfi(rfi)}
 onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-container-high)' }}
 onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '' }}
 >
 <td className="py-4 text-xs text-stone">RFI-{String(rfi.rfi_number).padStart(3, '0')}</td>
 <td className="py-4 font-semibold pr-4">
 <span className="text-white group-hover:text-amber transition-colors line-clamp-1">{rfi.title}</span>
 {rfi.drawing_ref && (
 <span className="text-[11px] text-stone mt-0.5 block">Sheet: {rfi.drawing_ref}</span>
 )}
 </td>
 <td className="py-4 text-stone">{rfi.raised_by}</td>
 <td className="py-4 text-stone">{rfi.assigned_to}</td>
 <td className="py-4">
 <span className="chip" style={getStatusStyle(rfi.status)}>
 {rfi.status.charAt(0).toUpperCase() + rfi.status.slice(1).replace(/_/g, ' ')}
 </span>
 </td>
 <td className="py-4 text-xs text-stone">{rfi.due_date}</td>
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

 {/* RFI Creation Modal */}
 {showCreateModal && (
 <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: 'rgba(12,14,14,0.75)', backdropFilter: 'blur(4px)' }}>
 <div className="w-full max-w-md p-6 relative" style={{ background: 'var(--surface-container)', boxShadow: 'var(--shadow-4)' }}>
 <div className="flex items-center justify-between pb-3 mb-4" style={{ boxShadow: '0 1px 0 rgba(159,142,122,0.10)' }}>
 <h3 className="text-sm font-semibold" style={{ color: 'var(--amber)' }}>Create New Query (RFI)</h3>
 <button onClick={() => setShowCreateModal(false)} style={{ color: 'var(--stone)' }}>
 <span className="material-icons-outlined text-[18px]">close</span>
 </button>
 </div>

 <form onSubmit={handleCreateRfi} className="space-y-4">
 <div>
 <label className="block text-xs text-stone mb-1 font-medium">Query Title *</label>
 <input
 type="text"
 required
 placeholder="e.g. Beam overlapping Grid C-3 spacing details"
 value={newRfi.title}
 onChange={(e) => setNewRfi(prev => ({ ...prev, title: e.target.value }))}
 className="input-5bloc py-1.5 text-xs"
 />
 </div>

 <div>
 <label className="block text-xs text-stone mb-1 font-medium">Detailed Query Description *</label>
 <textarea
 required
 rows={4}
 placeholder="Explain the conflict details clearly..."
 value={newRfi.description}
 onChange={(e) => setNewRfi(prev => ({ ...prev, description: e.target.value }))}
 className="input-5bloc text-xs resize-none"
 />
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-xs text-stone mb-1 font-medium">Drawing Sheet Ref</label>
 <input
 type="text"
 placeholder="e.g. S-201"
 value={newRfi.drawing_ref}
 onChange={(e) => setNewRfi(prev => ({ ...prev, drawing_ref: e.target.value }))}
 className="input-5bloc py-1.5 text-xs"
 />
 </div>
 <div>
 <label className="block text-xs text-stone mb-1 font-medium">Target Due Date</label>
 <input
 type="date"
 value={newRfi.due_date}
 onChange={(e) => setNewRfi(prev => ({ ...prev, due_date: e.target.value }))}
 className="input-5bloc py-1.5 text-xs"
 />
 </div>
 </div>

 <div className="pt-4 flex justify-end gap-3" style={{ boxShadow: '0 -1px 0 rgba(159,142,122,0.10)' }}>
 <button 
 type="button" 
 onClick={() => setShowCreateModal(false)}
 className="btn-secondary py-1.5 px-4 text-xs"
 >
 Cancel
 </button>
 <button 
 type="submit"
 className="btn-primary py-1.5 px-6 text-xs"
 >
 Submit RFI
 </button>
 </div>
 </form>
 </div>
 </div>
 )}

 {/* RFI Detail Slide-over */}
 {activeRfi && (
 <div className="fixed inset-0 z-50 flex justify-end select-none" style={{ background: 'rgba(12,14,14,0.60)', backdropFilter: 'blur(4px)' }}>
 <div className="fixed inset-0" onClick={() => setActiveRfi(null)} />
 <div className="relative w-full max-w-lg h-screen flex flex-col justify-between z-10 animate-slide-in" style={{ background: 'var(--surface-container)', boxShadow: 'var(--shadow-4)' }}>
 {/* Slide-over Header */}
 <div className="px-6 py-4 flex items-center justify-between" style={{ background: 'var(--surface-container-high)', boxShadow: '0 1px 0 rgba(159,142,122,0.10)' }}>
 <div>
 <h3 className="text-sm font-semibold" style={{ color: 'var(--on-surface)' }}>
 RFI-{String(activeRfi.rfi_number).padStart(3, '0')}
 </h3>
 <span className="text-[11px] block mt-0.5" style={{ color: 'var(--stone)' }}>Raised by: {activeRfi.raised_by}</span>
 </div>
 <button onClick={() => setActiveRfi(null)} style={{ color: 'var(--stone)' }}>
 <span className="material-icons-outlined text-[20px]">close</span>
 </button>
 </div>
 
 {/* Slide-over Body */}
 <div className="flex-1 overflow-y-auto p-6 space-y-6">
 {/* Query block details */}
 <div className="space-y-2">
 <h4 className="text-sm font-semibold text-white leading-snug">{activeRfi.title}</h4>
 {activeRfi.drawing_ref && (
 <span className="chip" style={{ background: 'rgba(245,166,35,.10)', color: 'var(--amber)' }}>
 Sheet: {activeRfi.drawing_ref}
 </span>
 )}
 <p className="text-xs leading-relaxed p-4 mt-2" style={{ background: 'var(--surface-container-high)', color: 'var(--stone)', boxShadow: 'var(--shadow-1)' }}>
 {activeRfi.description}
 </p>
 <div className="flex items-center gap-2 mt-3">
 <button
 onClick={() => setEmailComposerData({
 to: activeRfi.assigned_to.includes('Architect') ? 'parth@5bloc.com' : 'contractor@5bloc.com',
 subject: `Action Required: RFI #${activeRfi.rfi_number} - ${activeRfi.title}`,
 defaultBody: `Hi ${activeRfi.assigned_to},\n\nPlease review RFI #${activeRfi.rfi_number}: "${activeRfi.title}".\nDescription: ${activeRfi.description}\nDue Date: ${activeRfi.due_date}\n\nLink: http://app.5bloc.com/projects/${projectId}/rfis`
 })}
 className="btn-secondary py-1.5 px-3 text-xs"
 >
 <span className="material-icons-outlined text-[15px]">mail</span>
 Email Assignee
 </button>
 <a
 href={`https://wa.me/?text=${encodeURIComponent(`RFI Alert: Project ID: ${projectId}\nRFI #${activeRfi.rfi_number} - ${activeRfi.title}\nDue: ${activeRfi.due_date}\nAssigned: ${activeRfi.assigned_to}\nDetails: http://app.5bloc.com/projects/${projectId}/rfis`)}`}
 target="_blank" rel="noopener noreferrer"
 className="btn-secondary py-1.5 px-3 text-xs"
 >
 <span className="material-icons-outlined text-[15px]" style={{ color: '#25D366' }}>chat</span>
 Share via WhatsApp
 </a>
 </div>
 </div>
 
 {/* RFI Response form */}
 <div className="pt-6 space-y-4" style={{ boxShadow: '0 -1px 0 rgba(159,142,122,0.10)' }}>
 <div className="flex items-center justify-between">
 <h4 className="text-xs font-semibold text-white">Resolve Response</h4>
 <button 
 onClick={handleRequestAIDraft}
 disabled={aiDrafting}
 className="btn-secondary btn-sm flex items-center gap-1.5"
 >
 <span className="material-icons-outlined text-[12px]">auto_awesome</span>
 {aiDrafting ? 'Drafting...' : 'Request AI Draft'}
 </button>
 </div>
 
 {/* AI suggested draft display */}
 {aiDraftText && (
 <div className="p-3.5 text-xs leading-relaxed relative animate-fade-in" style={{ background: 'rgba(245,166,35,.08)', boxShadow: 'var(--shadow-1)', color: 'var(--on-surface)' }}>
 <div className="flex items-center gap-1 mb-1.5 text-[11px] text-amber font-medium capitalize">
 <span className="material-icons-outlined text-[13px]">auto_awesome</span> Suggested response (Claude Sonnet)
 </div>
 <p>{aiDraftText}</p>
 <button
 onClick={() => {
 setActiveRfi(prev => prev ? { ...prev, response: aiDraftText } : null)
 setAiDraftText('')
 }}
 className="mt-3 text-[11px] font-medium text-amber hover:text-white transition flex items-center gap-0.5"
 >
 <span className="material-icons-outlined text-[12px]">input</span> Use This Response
 </button>
 </div>
 )}
 
 <textarea
 rows={5}
 placeholder="Write official architect response details..."
 value={activeRfi.response || ''}
 onChange={(e) => setActiveRfi(prev => prev ? { ...prev, response: e.target.value } : null)}
 className="input-5bloc text-xs resize-none"
 />
 
 {/* Scope Change toggle */}
 <div className="pt-3 flex items-center justify-between" style={{ boxShadow: '0 -1px 0 rgba(159,142,122,0.10)' }}>
 <div className="flex items-center gap-2">
 <input
 type="checkbox"
 id="scopeChange"
 checked={activeRfi.is_scope_change}
 onChange={(e) => setActiveRfi(prev => prev ? { ...prev, is_scope_change: e.target.checked } : null)}
 className="w-4 h-4 cursor-pointer accent-amber"
 style={{ accentColor: 'var(--amber-dk)' }}
 />
 <label htmlFor="scopeChange" className="text-xs text-white cursor-pointer select-none">
 Flag as Scope / Material Change
 </label>
 </div>
 {activeRfi.is_scope_change && (
 <div className="flex items-center gap-1.5">
 <span className="text-xs text-stone">Value (₹):</span>
 <input
 type="number"
 placeholder="Amt"
 value={activeRfi.scope_change_amount || ''}
 onChange={(e) => setActiveRfi(prev => prev ? { ...prev, scope_change_amount: parseInt(e.target.value) } : null)}
 className="input-5bloc px-2 py-1 text-xs w-24 text-right"
 />
 </div>
 )}
 </div>
 </div>
 </div>
 
 {/* Slide-over Footer */}
 <div className="px-6 py-4 flex justify-end gap-3 shrink-0" style={{ background: 'var(--surface-container-high)', boxShadow: '0 -1px 0 rgba(159,142,122,0.10)' }}>
 <button 
 onClick={() => setActiveRfi(null)}
 className="btn-secondary py-1.5 px-4 text-xs"
 >
 Cancel
 </button>
 <button 
 onClick={handleSaveResponse}
 className="btn-primary py-1.5 px-6 text-xs"
 >
 Save & Resolve RFI
 </button>
 </div>
 </div>
 </div>
 )}
 {emailComposerData && (
 <EmailComposer
 to={emailComposerData.to}
 subject={emailComposerData.subject}
 defaultBody={emailComposerData.defaultBody}
 onClose={() => setEmailComposerData(null)}
 />
 )}
 </div>
 )
}

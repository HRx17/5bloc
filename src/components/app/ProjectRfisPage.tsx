import React, { useState, useEffect, useCallback } from 'react'
import { useParams } from '@/compat/next-navigation'
import EmailComposer from '@/components/modals/EmailComposer'
import { useToast } from '@/components/ui5/Toast'
import { ErrorState } from '@/components/ui5/ErrorState'
import { EmptyState } from '@/components/ui5/EmptyState'
import { Skeleton } from '@/components/ui5/Skeleton'
import { useLiveReload } from '@/lib/live/useLiveReload'
import {
  CHAT_ACCEPT,
  formatFileMarker,
  parseFileMarker,
  signedFileUrl,
  uploadChatFile,
} from '@/lib/messages/files'

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
 attachment?: { key: string; name: string } | null
}

/** attachment_url holds a `[[5bloc-file|key|name]]` marker, or a bare storage key on older rows. */
function readAttachment(value?: string | null): { key: string; name: string } | null {
  if (!value) return null
  const marked = parseFileMarker(value)
  if (marked) return marked
  return { key: value, name: value.split('/').pop()?.replace(/^\d+-/, '') || 'Attachment' }
}

export default function ProjectRfisPage() {
 const params = useParams()
 const projectId = params.id as string
 const { toast } = useToast()

 const [rfis, setRfis] = useState<RFIItem[]>([])
 const [loading, setLoading] = useState(true)
 const [loadError, setLoadError] = useState<unknown>(null)
 const [showCreateModal, setShowCreateModal] = useState(false)
 const [activeRfi, setActiveRfi] = useState<RFIItem | null>(null)
 const [emailComposerData, setEmailComposerData] = useState<{ to: string; subject: string; defaultBody: string } | null>(null)
 const [members, setMembers] = useState<{ full_name?: string; invite_email?: string; email?: string; role?: string }[]>([])
 
 // Create Form State
 const [newRfi, setNewRfi] = useState({
 title: '',
 description: '',
 drawing_ref: '',
 assigned_to: '',
 due_date: '',
 })
 const [savingRfi, setSavingRfi] = useState(false)
 const [creatingRfi, setCreatingRfi] = useState(false)
 const [newAttachment, setNewAttachment] = useState<{ key: string; name: string } | null>(null)
 const [uploadingAttachment, setUploadingAttachment] = useState(false)

 const handleAttachmentPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
   const file = e.target.files?.[0]
   e.target.value = ''
   if (!file) return
   setUploadingAttachment(true)
   try {
     const { key, filename } = await uploadChatFile(file, { projectId })
     setNewAttachment({ key, name: filename })
   } catch (err: any) {
     toast(err?.message || 'Could not attach that file', 'error')
   } finally {
     setUploadingAttachment(false)
   }
 }

 const openAttachment = async (attachment: { key: string; name: string }) => {
   try {
     const url = await signedFileUrl(attachment.key, attachment.name, true)
     window.open(url, '_blank')
   } catch (err: any) {
     toast(err?.message || 'Could not open that attachment', 'error')
   }
 }

 // AI draft state
 const [aiDrafting, setAiDrafting] = useState(false)
 const [aiDraftText, setAiDraftText] = useState('')

 const appOrigin =
   (typeof window !== 'undefined' && window.location.origin) ||
   import.meta.env['VITE_APP_URL'] ||
   ''

 const resolveAssigneeEmail = (assignedTo: string) => {
   const needle = (assignedTo || '').trim().toLowerCase()
   if (!needle || needle === '—') return ''
   if (needle.includes('@')) return assignedTo.trim()
   const match = members.find((m) => {
     const name = (m.full_name || '').toLowerCase()
     const role = (m.role || '').toLowerCase()
     return name === needle || name.includes(needle) || role === needle || needle.includes(role)
   })
   return match?.email || match?.invite_email || ''
 }

 const load = useCallback(async (opts?: { quiet?: boolean }) => {
 if (!opts?.quiet) {
 setLoading(true)
 setLoadError(null)
 }
 try {
 const [rfiRes, memberRes] = await Promise.all([
   fetch(`/api/projects/${projectId}/rfis`),
   fetch(`/api/projects/${projectId}/members`),
 ])
 const d = await rfiRes.json()
 if (!rfiRes.ok) throw new Error(d.error || 'Failed to load the RFI log')
 setRfis(
 (d.rfis || []).map((r: any) => ({
 id: r.id,
 rfi_number: r.rfi_number,
 title: r.title,
 description: r.description || '',
 drawing_ref: r.drawing_ref,
 status: r.status,
 raised_by: r.raised_by || '—',
 assigned_to: r.assigned_to || '—',
 due_date: r.due_date || '',
 response: r.response,
 is_scope_change: !!r.is_scope_change,
 scope_change_amount: r.scope_change_amount,
 attachment: readAttachment(r.attachment_url),
 }))
 )
 if (memberRes.ok) {
   const md = await memberRes.json()
   setMembers(md.members || [])
 }
 } catch (e) {
 if (!opts?.quiet) setLoadError(e)
 } finally {
 if (!opts?.quiet) setLoading(false)
 }
 }, [projectId])

 useEffect(() => {
 load()
 }, [load])

 useLiveReload(load, ['rfis'])

 const handleCreateRfi = async (e: React.FormEvent) => {
 e.preventDefault()
 if (creatingRfi) return
 setCreatingRfi(true)
 try {
 const res = await fetch(`/api/projects/${projectId}/rfis`, {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
   ...newRfi,
   attachment_url: newAttachment ? formatFileMarker(newAttachment.key, newAttachment.name) : null,
 }),
 })
 const data = await res.json()
 if (!res.ok) {
 toast(data.error || 'Failed to create RFI', 'error')
 return
 }
 const r = data.rfi
 setRfis((prev) => [
 {
 id: r.id,
 rfi_number: r.rfi_number,
 title: r.title,
 description: r.description || '',
 drawing_ref: r.drawing_ref,
 status: r.status,
 raised_by: 'You',
 assigned_to: newRfi.assigned_to,
 due_date: r.due_date || '',
 is_scope_change: false,
 attachment: newAttachment,
 },
 ...prev,
 ])
 setShowCreateModal(false)
 setNewRfi({ title: '', description: '', drawing_ref: '', assigned_to: '', due_date: '' })
 setNewAttachment(null)
 toast(`RFI-${String(r.rfi_number).padStart(3, '0')} raised`, 'success')
 } catch (err: any) {
 toast(err?.message || 'Failed to create RFI', 'error')
 } finally {
 setCreatingRfi(false)
 }
 }

 const handleSaveRfi = async () => {
 if (!activeRfi) return
 setSavingRfi(true)
 const previous = rfis.find((r) => r.id === activeRfi.id)
 setRfis((prev) =>
 prev.map((r) =>
 r.id === activeRfi.id
 ? {
 ...r,
 status: activeRfi.status,
 response: activeRfi.response || aiDraftText || r.response,
 description: activeRfi.description,
 is_scope_change: activeRfi.is_scope_change,
 scope_change_amount: activeRfi.scope_change_amount,
 }
 : r
 )
 )
 try {
 const res = await fetch(`/api/projects/${projectId}/rfis`, {
 method: 'PATCH',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 rfi_id: activeRfi.id,
 status: activeRfi.status,
 response: activeRfi.response || aiDraftText || undefined,
 description: activeRfi.description,
 is_scope_change: activeRfi.is_scope_change,
 scope_change_amount: activeRfi.scope_change_amount,
 }),
 })
 const data = await res.json()
 if (!res.ok) {
 if (previous) setRfis((prev) => prev.map((r) => (r.id === activeRfi.id ? previous : r)))
 toast(data.error || 'Failed to save RFI', 'error')
 return
 }
 const saved = data.rfi || activeRfi
 setRfis((prev) =>
 prev.map((r) =>
 r.id === activeRfi.id
 ? {
 ...r,
 status: saved.status || activeRfi.status,
 response: saved.response ?? activeRfi.response ?? aiDraftText,
 description: saved.description ?? activeRfi.description,
 is_scope_change: activeRfi.is_scope_change,
 scope_change_amount: activeRfi.scope_change_amount,
 }
 : r
 )
 )
 setActiveRfi(null)
 setAiDraftText('')
 toast('RFI updated', 'success')
 } catch (err: any) {
 if (previous) setRfis((prev) => prev.map((r) => (r.id === activeRfi.id ? previous : r)))
 toast(err?.message || 'Failed to save RFI', 'error')
 } finally {
 setSavingRfi(false)
 }
 }

 const handleRequestAIDraft = async () => {
 if (!activeRfi) return
 setAiDrafting(true)
 setAiDraftText('')

 try {
 const res = await fetch('/api/ai/rfi-draft', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 title: activeRfi.title,
 description: activeRfi.description,
 drawing_ref: activeRfi.drawing_ref,
 }),
 })
 const data = await res.json()
 if (res.ok && (data.draft || data.response || data.text)) {
 setAiDraftText(data.draft || data.response || data.text)
 } else {
 setAiDraftText(
 `Review ${activeRfi.drawing_ref || 'the referenced drawing'} against the query "${activeRfi.title}". Confirm coordination with structural / MEP before issuing a formal response.`
 )
 }
 } catch (err) {
 console.error(err)
 setAiDraftText('Unable to reach AI draft service. Write the response manually.')
 toast('AI draft service is unreachable — write the response manually', 'warning')
 } finally {
 setAiDrafting(false)
 }
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
 <div className="mt-4 space-y-3">
 {Array.from({ length: 5 }, (_, i) => (
 <Skeleton key={i} className="h-12 w-full" />
 ))}
 </div>
 ) : loadError ? (
 <ErrorState
 className="mt-4"
 compact
 title="Could not load the RFI log"
 error={loadError}
 onRetry={load}
 />
 ) : rfis.length === 0 ? (
 <EmptyState
 className="mt-4"
 icon="forum"
 title="No RFIs raised yet"
 description="Raise an RFI when a drawing, spec or site condition needs a written clarification — every question and answer stays on the record here."
 actionLabel="Raise new RFI"
 onClick={() => setShowCreateModal(true)}
 />
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
 {rfi.attachment && (
 <span className="text-[11px] text-stone mt-0.5 flex items-center gap-1">
 <span className="material-icons-outlined text-[12px]">attach_file</span>
 {rfi.attachment.name}
 </span>
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

 <div>
 <label className="block text-xs text-stone mb-1 font-medium">Assigned To</label>
 <input
 type="text"
 placeholder="Name or email of assignee"
 value={newRfi.assigned_to}
 onChange={(e) => setNewRfi(prev => ({ ...prev, assigned_to: e.target.value }))}
 className="input-5bloc py-1.5 text-xs"
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

 <div>
 <label className="block text-xs text-stone mb-1 font-medium">Attachment</label>
 {newAttachment ? (
 <div className="flex items-center gap-2 border rounded-md px-3 py-2 bg-navy/40">
 <span className="material-icons-outlined text-[16px] text-amber">attach_file</span>
 <span className="text-xs text-white truncate flex-1">{newAttachment.name}</span>
 <button
 type="button"
 onClick={() => setNewAttachment(null)}
 className="text-[10px] text-stone hover:text-error font-bold uppercase"
 >
 Remove
 </button>
 </div>
 ) : (
 <label className="flex items-center gap-2 border border-dashed rounded-md px-3 py-2 cursor-pointer hover:border-amber/50 transition">
 <span className="material-icons-outlined text-[16px] text-stone">upload_file</span>
 <span className="text-xs text-stone">
 {uploadingAttachment ? 'Uploading…' : 'Attach a markup, photo or drawing (optional)'}
 </span>
 <input
 type="file"
 accept={CHAT_ACCEPT}
 className="hidden"
 disabled={uploadingAttachment}
 onChange={handleAttachmentPick}
 />
 </label>
 )}
 </div>

 <div className="pt-4 flex justify-end gap-3" style={{ boxShadow: '0 -1px 0 rgba(159,142,122,0.10)' }}>
 <button 
 type="button" 
 onClick={() => setShowCreateModal(false)}
 disabled={creatingRfi}
 className="btn-secondary py-1.5 px-4 text-xs"
 >
 Cancel
 </button>
 <button 
 type="submit"
 disabled={creatingRfi}
 className="btn-primary py-1.5 px-6 text-xs"
 >
 {creatingRfi ? 'Submitting…' : 'Submit RFI'}
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
 {activeRfi.attachment && (
 <button
 type="button"
 onClick={() => openAttachment(activeRfi.attachment!)}
 className="flex items-center gap-2 border rounded-md px-3 py-2 bg-navy/40 w-full text-left hover:border-amber/50 transition"
 >
 <span className="material-icons-outlined text-[16px] text-amber">attach_file</span>
 <span className="text-xs text-white truncate flex-1">{activeRfi.attachment.name}</span>
 <span className="material-icons-outlined text-[14px] text-stone">open_in_new</span>
 </button>
 )}
 <div className="mt-2">
 <label className="block text-xs text-stone mb-1 font-medium">Status</label>
 <select
 value={activeRfi.status}
 onChange={(e) =>
 setActiveRfi((prev) =>
 prev ? { ...prev, status: e.target.value as RFIItem['status'] } : null
 )
 }
 className="input-5bloc py-1.5 text-xs"
 >
 <option value="open">Open</option>
 <option value="in_review">In review</option>
 <option value="answered">Answered</option>
 <option value="closed">Closed</option>
 </select>
 </div>
 <div className="mt-2">
 <label className="block text-xs text-stone mb-1 font-medium">Description</label>
 <textarea
 rows={4}
 value={activeRfi.description}
 onChange={(e) =>
 setActiveRfi((prev) => (prev ? { ...prev, description: e.target.value } : null))
 }
 className="input-5bloc text-xs resize-none"
 />
 </div>
 <div className="flex items-center gap-2 mt-3">
 <button
 onClick={() => {
   const to = resolveAssigneeEmail(activeRfi.assigned_to)
   const link = `${appOrigin}/projects/${projectId}/rfis`
   if (!to) {
     toast(
       `No email on file for “${activeRfi.assigned_to}”. Invite them on the Team tab, or type their address in the composer.`,
       'warning',
       7000
     )
   }
   setEmailComposerData({
     to,
     subject: `Action Required: RFI #${activeRfi.rfi_number} - ${activeRfi.title}`,
     defaultBody: `Hi ${activeRfi.assigned_to},\n\nPlease review RFI #${activeRfi.rfi_number}: "${activeRfi.title}".\nDescription: ${activeRfi.description}\nDue Date: ${activeRfi.due_date || '—'}\n\nOpen in 5Bloc: ${link}`,
   })
 }}
 className="btn-secondary py-1.5 px-3 text-xs"
 >
 <span className="material-icons-outlined text-[15px]">mail</span>
 Email Assignee
 </button>
 <a
 href={`https://wa.me/?text=${encodeURIComponent(`RFI Alert\nRFI #${activeRfi.rfi_number} - ${activeRfi.title}\nDue: ${activeRfi.due_date || '—'}\nAssigned: ${activeRfi.assigned_to}\nDetails: ${appOrigin}/projects/${projectId}/rfis`)}`}
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
 className="btn-secondary text-xs py-1 px-3 flex items-center gap-1 hover: hover:text-amber"
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
 onClick={handleSaveRfi}
 disabled={savingRfi}
 className="btn-primary py-1.5 px-6 text-xs"
 >
 {savingRfi ? 'Saving…' : 'Save RFI'}
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

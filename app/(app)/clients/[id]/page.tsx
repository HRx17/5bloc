'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface CommLog {
 id: string
 type: 'call' | 'email' | 'meeting'
 summary: string
 date: string
}

interface ClientDetail {
 id: string
 full_name: string
 email: string
 phone: string
 company: string
 city: string
 state: string
 pipeline_stage: string
 total_value: number
 notes: string
 projects: { id: string; name: string; phase: string }[]
 commLogs: CommLog[]
}

export default function ClientProfile() {
 const params = useParams()
 const clientId = params.id as string

 const [client, setClient] = useState<ClientDetail | null>(null)
 const [savingNotes, setSavingNotes] = useState(false)
 
 // Log entry form state
 const [newLog, setNewLog] = useState({
 type: 'call',
 summary: '',
 })

 useEffect(() => {
 // Mock load client profile
 setClient({
 id: clientId,
 full_name: clientId === 'cli-2' ? 'Harish Wadhwa' : clientId === 'cli-3' ? 'Karan Shah' : 'Parth Patel',
 email: clientId === 'cli-2' ? 'harish@wadhwagroup.in' : clientId === 'cli-3' ? 'karan@karanbuilders.com' : 'parth@5bloc.com',
 phone: clientId === 'cli-2' ? '9988776655' : clientId === 'cli-3' ? '9765432109' : '9876543210',
 company: clientId === 'cli-2' ? 'Wadhwa Developers' : clientId === 'cli-3' ? 'Karan Builders' : 'Self',
 city: clientId === 'cli-3' ? 'Bangalore' : 'Mumbai',
 state: clientId === 'cli-3' ? 'KA' : 'MH',
 pipeline_stage: clientId === 'cli-2' ? 'proposal' : 'won',
 total_value: clientId === 'cli-2' ? 85000000 : clientId === 'cli-3' ? 65000000 : 120000000,
 notes: 'Client requests premium finishes, energy efficiency compliance, and low ceiling heights overrides in core layout.',
 projects: [
 { id: 'proj-1', name: clientId === 'cli-2' ? 'Wadhwa Prime Plaza' : 'Lodha Signature Residences', phase: 'construction_docs' }
 ],
 commLogs: [
 { id: 'log-1', type: 'meeting', summary: 'Met at Bandra site. Reviewed column layouts and steel spacing constraints.', date: '2026-05-10' },
 { id: 'log-2', type: 'call', summary: 'Discussed toilet fittings brand selection. Agreed to Toto premium alternates.', date: '2026-05-28' },
 { id: 'log-3', type: 'email', summary: 'Sent revised schematic layout drafts. Awaiting structural verification.', date: '2026-06-01' }
 ]
 })
 }, [clientId])

 const handleNotesChange = (text: string) => {
 if (!client) return
 setClient({ ...client, notes: text })
 setSavingNotes(true)

 // Simulate auto-save delay
 const debounce = setTimeout(() => {
 setSavingNotes(false)
 }, 1200)

 return () => clearTimeout(debounce)
 }

 const handleAddCommLog = (e: React.FormEvent) => {
 e.preventDefault()
 if (!client || !newLog.summary) return

 const logRecord: CommLog = {
 id: `log-${Date.now()}`,
 type: newLog.type as any,
 summary: newLog.summary,
 date: new Date().toISOString().split('T')[0],
 }

 setClient({
 ...client,
 commLogs: [logRecord, ...client.commLogs]
 })
 setNewLog({ type: 'call', summary: '' })
 }

 if (!client) {
 return (
 <div className="p-8 text-center text-stone animate-pulse">
 Loading client CRM logs...
 </div>
 )
 }

 return (
 <div className="p-6 font-body select-none max-w-6xl mx-auto space-y-6">
 
 {/* Header back link */}
 <div>
 <Link href="/clients" className="text-xs text-stone hover:text-amber transition-colors flex items-center gap-1">
 <span className="material-icons-outlined text-[14px]">arrow_back</span> BACK TO PIPELINE
 </Link>
 </div>

 {/* Main Layout CRM detail splitter */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
 
 {/* Contact details and notes (Left Col Span 1) */}
 <div className="space-y-6">
 {/* Contact Card */}
 <div className="card-5bloc space-y-4">
 <div className="flex items-center justify-between border-b pb-2.5">
 <span className="text-xs font-bold font-mono uppercase tracking-wider text-amber">Contact Details</span>
 <span className="material-icons-outlined text-[16px] text-stone hover:text-white cursor-pointer transition-colors">edit</span>
 </div>

 <div className="space-y-3">
 <div>
 <h2 className="text-base font-bold text-white leading-snug">{client.full_name}</h2>
 <p className="text-[10px] text-stone font-mono uppercase mt-0.5">{client.company}</p>
 </div>

 <div className="space-y-1.5 text-xs text-stone">
 <p className="flex items-center gap-2">
 <span className="material-icons-outlined text-[14px] text-stone">email</span>
 <span>{client.email}</span>
 </p>
 <p className="flex items-center gap-2">
 <span className="material-icons-outlined text-[14px] text-stone">phone</span>
 <span className="font-mono">{client.phone}</span>
 </p>
 <p className="flex items-center gap-2">
 <span className="material-icons-outlined text-[14px] text-stone">place</span>
 <span>{client.city}, {client.state}</span>
 </p>
 </div>
 </div>
 </div>

 {/* Persistent Notes area */}
 <div className="card-5bloc space-y-2 relative">
 <div className="flex justify-between items-center border-b pb-2">
 <span className="text-xs font-bold font-mono uppercase tracking-wider text-stone">Client Notes</span>
 {savingNotes && (
 <span className="text-[9px] font-mono text-amber animate-pulse">Auto-saving...</span>
 )}
 </div>
 <textarea
 rows={4}
 value={client.notes}
 onChange={(e) => handleNotesChange(e.target.value)}
 className="w-full bg-transparent border-0 outline-none text-xs text-white resize-none pt-2 font-body leading-relaxed h-[120px]"
 placeholder="Jot down notes (auto-saves on typing)..."
 />
 </div>

 {/* Linked Projects card list */}
 <div className="card-5bloc space-y-3">
 <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-stone border-b pb-2">Active Commissions</h4>
 {client.projects.map(p => (
 <Link key={p.id} href={`/projects/${p.id}`} className="block p-3 bg-navy/40 border rounded hover: transition-colors">
 <span className="text-xs font-bold text-white block truncate">{p.name}</span>
 <span className="text-[9px] font-mono text-stone uppercase mt-1 block tracking-wider">Phase: {p.phase.replace(/_/g, ' ')}</span>
 </Link>
 ))}
 </div>
 </div>

 {/* Communication Log (Right Col Span 2) */}
 <div className="md:col-span-2 space-y-6">
 
 {/* Log input logger */}
 <div className="card-5bloc space-y-4">
 <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-amber border-b pb-2">Log Interaction</h3>
 
 <form onSubmit={handleAddCommLog} className="flex flex-col sm:flex-row gap-3 items-end">
 <div className="w-full sm:w-32 shrink-0">
 <label className="block text-stone text-[9px] font-bold uppercase tracking-wider mb-1 font-mono">Type</label>
 <select
 value={newLog.type}
 onChange={(e) => setNewLog(prev => ({ ...prev, type: e.target.value }))}
 className="input-5bloc py-1 px-2 text-xs"
 >
 <option value="call">Phone Call</option>
 <option value="email">Email Sent</option>
 <option value="meeting">Site Meeting</option>
 </select>
 </div>

 <div className="flex-1 w-full">
 <label className="block text-stone text-[9px] font-bold uppercase tracking-wider mb-1 font-mono">Summary details *</label>
 <input
 type="text"
 required
 placeholder="e.g. Discussed pricing details for materials procurement..."
 value={newLog.summary}
 onChange={(e) => setNewLog(prev => ({ ...prev, summary: e.target.value }))}
 className="input-5bloc py-1 px-3 text-xs"
 />
 </div>

 <button type="submit" className="btn-primary py-1.5 px-5 text-xs shrink-0 h-[34px]">
 SAVE ENTRY
 </button>
 </form>
 </div>

 {/* Historical Communication timeline logs */}
 <div className="card-5bloc space-y-4">
 <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-stone border-b pb-2">Interaction History</h3>
 
 <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-px before:bg-navy-lt">
 {client.commLogs.map((log) => (
 <div key={log.id} className="flex gap-4 relative items-start text-xs pl-7">
 {/* Timeline icon */}
 <div className="absolute left-1.5 top-1 w-3 h-3 rounded-full bg-navy border-2 ring-4 ring-navy-mid shrink-0" />
 
 <div className="flex-1 space-y-1">
 <div className="flex items-center justify-between text-[10px] font-mono text-stone">
 <span className="uppercase text-amber tracking-wider font-bold">{log.type}</span>
 <span>{log.date}</span>
 </div>
 <p className="text-white leading-relaxed">{log.summary}</p>
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>

 </div>
 </div>
 )
}

'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'

interface Client {
 id: string
 full_name: string
 email: string
 phone: string
 company: string
 city: string
 state: string
 pipeline_stage: 'prospect' | 'briefing' | 'proposal' | 'won' | 'lost'
 total_value: number
 projects_count: number
}

export default function ClientCRM() {
 const [clients, setClients] = useState<Client[]>([])
 const [viewMode, setViewMode] = useState<'table' | 'kanban'>('kanban')
 const [loading, setLoading] = useState(true)
 const [showCreateModal, setShowCreateModal] = useState(false)
 const [newClient, setNewClient] = useState({
 name: '',
 email: '',
 phone: '',
 company: '',
 city: '',
 state: '',
 value: '',
 })

 useEffect(() => {
 // Mock load clients
 const timer = setTimeout(() => {
 setClients([
 { id: 'cli-1', full_name: 'Parth Patel', email: 'parth@5bloc.com', phone: '9876543210', company: 'Self', city: 'Mumbai', state: 'MH', pipeline_stage: 'won', total_value: 120000000, projects_count: 1 },
 { id: 'cli-2', full_name: 'Harish Wadhwa', email: 'harish@wadhwagroup.in', phone: '9988776655', company: 'Wadhwa Developers', city: 'Mumbai', state: 'MH', pipeline_stage: 'proposal', total_value: 85000000, projects_count: 1 },
 { id: 'cli-3', full_name: 'Karan Shah', email: 'karan@karanbuilders.com', phone: '9765432109', company: 'Karan Builders', city: 'Bangalore', state: 'KA', pipeline_stage: 'won', total_value: 65000000, projects_count: 1 },
 { id: 'cli-4', full_name: 'Anita Sen', email: 'anita.sen@gmail.com', phone: '9812345678', company: 'Sen Design Lab', city: 'Pune', state: 'MH', pipeline_stage: 'briefing', total_value: 4500000, projects_count: 0 },
 { id: 'cli-5', full_name: 'Devendra Chawla', email: 'chawla.d@outlook.com', phone: '9543210987', company: 'Chawla Group', city: 'Delhi', state: 'DL', pipeline_stage: 'prospect', total_value: 180000000, projects_count: 0 }
 ])
 setLoading(false)
 }, 400)
 return () => clearTimeout(timer)
 }, [])

 const handleStageChange = (clientId: string, newStage: Client['pipeline_stage']) => {
 setClients(prev => 
 prev.map(c => c.id === clientId ? { ...c, pipeline_stage: newStage } : c)
 )
 }

 const handleCreateClient = (e: React.FormEvent) => {
 e.preventDefault()
 if (!newClient.name) return

 const clientRecord: Client = {
 id: `cli-${Date.now()}`,
 full_name: newClient.name,
 email: newClient.email,
 phone: newClient.phone,
 company: newClient.company || 'Individual',
 city: newClient.city || 'Mumbai',
 state: newClient.state || 'MH',
 pipeline_stage: 'prospect',
 total_value: parseInt(newClient.value) || 0,
 projects_count: 0
 }

 setClients(prev => [clientRecord, ...prev])
 setShowCreateModal(false)
 setNewClient({ name: '', email: '', phone: '', company: '', city: '', state: '', value: '' })

 // Auto check checklist widget task in localStorage
 const savedChecklist = localStorage.getItem('onboarding_checklist_v1')
 if (savedChecklist) {
 const parsed = JSON.parse(savedChecklist)
 parsed.client = true
 localStorage.setItem('onboarding_checklist_v1', JSON.stringify(parsed))
 }
 }

 const formatLakhs = (amt: number) => {
 if (amt >= 10000000) return `₹${(amt / 10000000).toFixed(1)} Cr`
 return `₹${(amt / 100000).toFixed(0)} Lakh`
 }

 const stages: { id: Client['pipeline_stage']; label: string; color: string }[] = [
 { id: 'prospect', label: 'Prospect', color: 'border-t-stone' },
 { id: 'briefing', label: 'Briefing', color: 'border-t-blue' },
 { id: 'proposal', label: 'Proposal', color: 'border-t-amber' },
 { id: 'won', label: 'Won', color: 'border-t-success' },
 { id: 'lost', label: 'Lost', color: 'border-t-error' },
 ]

 return (
 <div className="p-6 space-y-6 font-body select-none max-w-7xl mx-auto">
 {/* Header */}
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-2xl font-bold tracking-wide">Client CRM Pipeline</h1>
 <p className="text-xs text-stone mt-1">Track business development leads and manage client project acquisitions.</p>
 </div>
 <div className="flex items-center gap-3">
 {/* Toggle View Mode */}
 <div className="bg-navy-mid p-0.5 flex">
 <button
 onClick={() => setViewMode('kanban')}
 className={`p-1.5 text-xs font-semibold transition flex items-center ${
 viewMode === 'kanban' ? 'bg-amber text-navy font-bold' : 'text-stone hover:text-white'
 }`}
 >
 <span className="material-icons-outlined text-[16px] mr-1">dashboard</span> Kanban
 </button>
 <button
 onClick={() => setViewMode('table')}
 className={`p-1.5 text-xs font-semibold transition flex items-center ${
 viewMode === 'table' ? 'bg-amber text-navy font-bold' : 'text-stone hover:text-white'
 }`}
 >
 <span className="material-icons-outlined text-[16px] mr-1">view_list</span> Table
 </button>
 </div>

 <button onClick={() => setShowCreateModal(true)} className="btn-primary">
 <span className="material-icons-outlined text-[18px]">add</span>
 ADD NEW LEAD
 </button>
 </div>
 </div>

 {loading ? (
 <div className="p-8 text-center text-stone animate-pulse h-48">Loading pipeline registry...</div>
 ) : viewMode === 'table' ? (
 /* Table View */
 <div className="card-5bloc">
 <div className="overflow-x-auto">
 <table className="w-full text-left text-xs ">
 <thead>
 <tr className="text-stone font-mono uppercase text-[10px] tracking-wider">
 <th className="pb-3 pl-2">Client Name</th>
 <th className="pb-3">Company</th>
 <th className="pb-3">City</th>
 <th className="pb-3">Active Projects</th>
 <th className="pb-3 text-right">Lead Value (₹)</th>
 <th className="pb-3">Stage</th>
 <th className="pb-3 pr-2 text-right">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-navy-lt/40">
 {clients.map((c) => (
 <tr key={c.id} className="hover:bg-navy-lt/20 transition-colors">
 <td className="py-4 pl-2 font-semibold text-white">
 <Link href={`/clients/${c.id}`} className="hover:text-amber transition-colors block">
 {c.full_name}
 </Link>
 <span className="text-[10px] text-stone font-mono block mt-0.5">{c.email}</span>
 </td>
 <td className="py-4 text-stone">{c.company}</td>
 <td className="py-4 text-stone">{c.city}</td>
 <td className="py-4 text-stone font-mono">{c.projects_count}</td>
 <td className="py-4 text-right font-mono font-semibold text-white">{c.total_value.toLocaleString()}</td>
 <td className="py-4">
 <span
   className="chip capitalize"
   style={{
     background:
       c.pipeline_stage === 'won'      ? 'rgba(111,220,140,.12)' :
       c.pipeline_stage === 'lost'     ? 'rgba(255,180,171,.12)' :
       c.pipeline_stage === 'proposal' ? 'rgba(245,166,35,.12)'  :
       'rgba(159,142,122,.10)',
     color:
       c.pipeline_stage === 'won'      ? 'var(--success)' :
       c.pipeline_stage === 'lost'     ? 'var(--error)'   :
       c.pipeline_stage === 'proposal' ? 'var(--amber)'   :
       'var(--stone)',
   }}
 >
   {c.pipeline_stage}
 </span>
 </td>
 <td className="py-4 pr-2 text-right">
 <Link href={`/clients/${c.id}`} className="p-1 text-stone hover:text-white transition">
 <span className="material-icons-outlined text-[16px]">chevron_right</span>
 </Link>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 ) : (
 /* Kanban View columns */
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
 {stages.map((stage) => {
 const stageClients = clients.filter(c => c.pipeline_stage === stage.id)
 return (
 <div key={stage.id} className="space-y-4">
 <div className="flex justify-between items-center px-1 font-mono text-[10px] text-stone">
 <span className="font-bold uppercase tracking-wider text-white">{stage.label}</span>
 <span>({stageClients.length})</span>
 </div>

 <div className={`card-5bloc p-3 bg-navy-mid/40 border-t-2 ${stage.color} min-h-[400px] space-y-3`}>
 {stageClients.map((client) => (
 <div 
 key={client.id}
 className="card-5bloc p-3.5 bg-navy-mid hover: transition cursor-pointer space-y-3 group"
 >
 <div className="space-y-1">
 <h4 className="text-xs font-bold text-white group-hover:text-amber transition-colors line-clamp-1">
 <Link href={`/clients/${client.id}`}>{client.full_name}</Link>
 </h4>
 <p className="text-[10px] text-stone font-mono">{client.company}</p>
 </div>

 <div className="flex justify-between items-center text-[10px] font-mono">
 <span className="text-stone">{client.city}</span>
 <span className="text-white font-semibold">{formatLakhs(client.total_value)}</span>
 </div>

 {/* Small Quick-change dropdown triggers */}
 <div className="flex gap-1 justify-end pt-2 ">
 {stages.filter(s => s.id !== stage.id).map(s => (
 <button
 key={s.id}
 onClick={() => handleStageChange(client.id, s.id)}
 className="w-4 h-4 flex items-center justify-center text-[8px] text-stone hover:text-white hover: transition"
 title={`Move to ${s.label}`}
 >
 <span className="material-icons-outlined text-[10px]">
 {s.id === 'won' ? 'check' : s.id === 'lost' ? 'close' : 'arrow_forward'}
 </span>
 </button>
 ))}
 </div>
 </div>
 ))}
 </div>
 </div>
 )
 })}
 </div>
 )}

 {/* Add Lead Creation Modal */}
 {showCreateModal && (
 <div className="fixed inset-0 bg-navy/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
 <div className="w-full max-w-md bg-navy-mid p-6 shadow-none relative">
 <div className="flex items-center justify-between pb-3 mb-4">
 <h3 className="text-sm font-bold uppercase tracking-wider text-amber font-mono">Add Client Lead</h3>
 <button onClick={() => setShowCreateModal(false)} className="text-stone hover:text-white transition">
 <span className="material-icons-outlined text-[18px]">close</span>
 </button>
 </div>

 <form onSubmit={handleCreateClient} className="space-y-4">
 <div>
 <label className="block text-stone text-[10px] font-bold uppercase tracking-wider mb-1.5 font-mono">Client Name *</label>
 <input
 type="text"
 required
 placeholder="e.g. Harish Wadhwa"
 value={newClient.name}
 onChange={(e) => setNewClient(prev => ({ ...prev, name: e.target.value }))}
 className="input-5bloc py-1.5 text-xs"
 />
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-stone text-[10px] font-bold uppercase tracking-wider mb-1.5 font-mono">Email Address</label>
 <input
 type="email"
 placeholder="client@email.com"
 value={newClient.email}
 onChange={(e) => setNewClient(prev => ({ ...prev, email: e.target.value }))}
 className="input-5bloc py-1.5 text-xs"
 />
 </div>
 <div>
 <label className="block text-stone text-[10px] font-bold uppercase tracking-wider mb-1.5 font-mono">Phone Number</label>
 <input
 type="text"
 placeholder="e.g. 9876543210"
 value={newClient.phone}
 onChange={(e) => setNewClient(prev => ({ ...prev, phone: e.target.value }))}
 className="input-5bloc py-1.5 text-xs font-mono"
 />
 </div>
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-stone text-[10px] font-bold uppercase tracking-wider mb-1.5 font-mono">Company / Firm</label>
 <input
 type="text"
 placeholder="e.g. Wadhwa Group"
 value={newClient.company}
 onChange={(e) => setNewClient(prev => ({ ...prev, company: e.target.value }))}
 className="input-5bloc py-1.5 text-xs"
 />
 </div>
 <div>
 <label className="block text-stone text-[10px] font-bold uppercase tracking-wider mb-1.5 font-mono">Est. Project Budget (₹)</label>
 <input
 type="number"
 placeholder="Budget"
 value={newClient.value}
 onChange={(e) => setNewClient(prev => ({ ...prev, value: e.target.value }))}
 className="input-5bloc py-1.5 text-xs font-mono"
 />
 </div>
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-stone text-[10px] font-bold uppercase tracking-wider mb-1.5 font-mono">City</label>
 <input
 type="text"
 placeholder="Mumbai"
 value={newClient.city}
 onChange={(e) => setNewClient(prev => ({ ...prev, city: e.target.value }))}
 className="input-5bloc py-1.5 text-xs"
 />
 </div>
 <div>
 <label className="block text-stone text-[10px] font-bold uppercase tracking-wider mb-1.5 font-mono">State</label>
 <input
 type="text"
 placeholder="Maharashtra"
 value={newClient.state}
 onChange={(e) => setNewClient(prev => ({ ...prev, state: e.target.value }))}
 className="input-5bloc py-1.5 text-xs"
 />
 </div>
 </div>

 <div className="pt-4 flex justify-end gap-3 ">
 <button 
 type="button" 
 onClick={() => setShowCreateModal(false)}
 className="btn-secondary py-1.5 px-4 text-xs"
 >
 CANCEL
 </button>
 <button 
 type="submit"
 className="btn-primary py-1.5 px-6 text-xs font-bold"
 >
 ADD LEAD
 </button>
 </div>
 </form>
 </div>
 </div>
 )}

 </div>
 )
}


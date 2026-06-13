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
 { id: 'prospect', label: 'Prospect', color: 'var(--on-surface-variant)' },
 { id: 'briefing', label: 'Briefing', color: 'var(--blue)' },
 { id: 'proposal', label: 'Proposal', color: 'var(--amber)' },
 { id: 'won', label: 'Won', color: 'var(--success)' },
 { id: 'lost', label: 'Lost', color: 'var(--error)' },
 ]

 return (
    <div className="min-h-[calc(100vh-64px)] bg-[var(--surface-canvas)] p-8 space-y-8 font-body select-none animate-stitch-reveal text-[var(--on-surface)]">
      <div className="max-w-[1400px] mx-auto space-y-8 relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[var(--surface-container-high)]">
          <div>
            <h1 className="text-4xl md:text-5xl font-display tracking-tight text-[var(--on-surface)] mb-2">
              Client Pipeline
            </h1>
            <p className="text-sm text-[var(--on-surface-variant)] font-editorial max-w-lg">
              Manage your business development lifecycle and track prospect conversions with precision.
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* View Toggles */}
            <div className="bg-[var(--surface-container)] p-1 flex rounded-xl shadow-1">
              <button
                onClick={() => setViewMode('kanban')}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 ${
                  viewMode === 'kanban' ? 'bg-[var(--surface-elevated)] text-[var(--amber)] shadow-[var(--glow-active)]' : 'text-[var(--on-surface-variant)] hover:text-[var(--on-surface)]'
                }`}
              >
                <span className="material-icons-outlined text-[16px]">dashboard</span> Kanban
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 ${
                  viewMode === 'table' ? 'bg-[var(--surface-elevated)] text-[var(--amber)] shadow-[var(--glow-active)]' : 'text-[var(--on-surface-variant)] hover:text-[var(--on-surface)]'
                }`}
              >
                <span className="material-icons-outlined text-[16px]">view_list</span> Table
              </button>
            </div>

            <button 
              onClick={() => setShowCreateModal(true)} 
              className="btn-pill-primary"
            >
              <span className="material-icons-outlined text-[18px]">add</span>
              NEW LEAD
            </button>
          </div>
        </div>

        {loading ? (
          <div className="h-[50vh] flex items-center justify-center">
            <div className="bg-[var(--surface-container)] p-8 rounded-2xl animate-float-slow flex flex-col items-center gap-4 shadow-2">
              <div className="w-8 h-8 border-4 border-[var(--amber)] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-[var(--on-surface-variant)] font-mono text-sm tracking-widest uppercase">Loading Pipeline...</p>
            </div>
          </div>
        ) : viewMode === 'table' ? (
          /* Premium Table View */
          <div className="bg-[var(--surface-container)] rounded-2xl overflow-hidden shadow-2 animate-stitch-reveal delay-100">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-[var(--surface-elevated)] text-[var(--on-surface-variant)] font-mono uppercase text-[10px] tracking-wider">
                    <th className="py-4 px-6 font-semibold">Client Name</th>
                    <th className="py-4 px-6 font-semibold">Company</th>
                    <th className="py-4 px-6 font-semibold">Location</th>
                    <th className="py-4 px-6 font-semibold">Active Projects</th>
                    <th className="py-4 px-6 font-semibold text-right">Lead Value</th>
                    <th className="py-4 px-6 font-semibold">Stage</th>
                    <th className="py-4 px-6 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--surface-container-high)]">
                  {clients.map((c) => (
                    <tr key={c.id} className="group hover:bg-[var(--surface-elevated)] transition-colors duration-200">
                      <td className="py-5 px-6">
                        <Link href={`/clients/${c.id}`} className="font-semibold text-[var(--on-surface)] group-hover:text-[var(--amber)] transition-colors text-base block font-display">
                          {c.full_name}
                        </Link>
                        <span className="text-[11px] text-[var(--on-surface-variant)] font-mono mt-1 block">{c.email}</span>
                      </td>
                      <td className="py-5 px-6 text-[var(--on-surface-variant)]">{c.company}</td>
                      <td className="py-5 px-6 text-[var(--on-surface-variant)]">{c.city}, {c.state}</td>
                      <td className="py-5 px-6">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-[var(--surface-container-high)] text-xs font-mono font-bold text-[var(--on-surface)]">
                          {c.projects_count}
                        </span>
                      </td>
                      <td className="py-5 px-6 text-right font-mono font-semibold text-[var(--amber)]">
                        {c.total_value.toLocaleString()} ₹
                      </td>
                      <td className="py-5 px-6">
                        <span
                          className="px-3 py-1 rounded-full text-xs font-semibold capitalize"
                          style={{
                            background:
                              c.pipeline_stage === 'won'      ? 'rgba(46,204,138,.1)' :
                              c.pipeline_stage === 'lost'     ? 'rgba(255,180,171,.1)' :
                              c.pipeline_stage === 'proposal' ? 'rgba(255,200,128,.1)'  :
                              'var(--surface-container-high)',
                            color:
                              c.pipeline_stage === 'won'      ? 'var(--success)' :
                              c.pipeline_stage === 'lost'     ? 'var(--error)'   :
                              c.pipeline_stage === 'proposal' ? 'var(--amber)'   :
                              'var(--on-surface-variant)'
                          }}
                        >
                          {c.pipeline_stage}
                        </span>
                      </td>
                      <td className="py-5 px-6 text-right">
                        <Link href={`/clients/${c.id}`} className="w-8 h-8 inline-flex items-center justify-center rounded bg-[var(--surface-container-high)] text-[var(--on-surface-variant)] hover:bg-[var(--primary)] hover:text-[var(--on-primary)] transition-all duration-200 transform group-hover:translate-x-1 hover:shadow-[var(--glow-amber)]">
                          <span className="material-icons-outlined text-[16px]">arrow_forward</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Premium Kanban View */
          <div className="flex gap-6 overflow-x-auto pb-8 snap-x">
            {stages.map((stage, i) => {
              const stageClients = clients.filter(c => c.pipeline_stage === stage.id)
              return (
                <div key={stage.id} className="min-w-[300px] w-[320px] shrink-0 snap-center animate-stitch-reveal" style={{ animationDelay: `${i * 100}ms` }}>
                  {/* Column Header */}
                  <div className="flex justify-between items-center px-2 mb-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full`} 
                           style={{ backgroundColor: stage.color }}>
                      </div>
                      <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-[var(--on-surface-variant)]">{stage.label}</span>
                    </div>
                    <span className="bg-[var(--surface-container-high)] text-[var(--on-surface-variant)] px-2 py-0.5 rounded text-[10px] font-mono font-bold">
                      {stageClients.length}
                    </span>
                  </div>

                  {/* Column Body */}
                  <div className="bg-[var(--surface-recessed)] rounded-2xl p-2 min-h-[60vh] space-y-3">
                    {stageClients.length === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center text-[var(--on-surface-variant)] text-xs font-mono opacity-50 m-3">
                        [ Empty ]
                      </div>
                    )}
                    {stageClients.map((client) => (
                      <div 
                        key={client.id}
                        className="bg-[var(--surface-container)] rounded-xl p-5 space-y-4 group cursor-grab active:cursor-grabbing shadow-1 hover:shadow-[var(--glow-blue)] transition-shadow duration-300"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="space-y-1">
                            <h4 className="text-base font-display font-bold text-[var(--on-surface)] group-hover:text-[var(--blue)] transition-colors line-clamp-1">
                              <Link href={`/clients/${client.id}`}>{client.full_name}</Link>
                            </h4>
                            <p className="text-[11px] text-[var(--on-surface-variant)] font-mono flex items-center gap-1">
                              <span className="material-icons-outlined text-[12px]">business</span>
                              {client.company}
                            </p>
                          </div>
                          <Link href={`/clients/${client.id}`} className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded bg-[var(--surface-container-high)] flex items-center justify-center text-[var(--on-surface-variant)] transition-all transform hover:scale-110 hover:text-[var(--blue)]">
                            <span className="material-icons-outlined text-[14px]">open_in_new</span>
                          </Link>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-[var(--on-surface-variant)]">
                          <span className="material-icons-outlined text-[12px]">location_on</span>
                          {client.city}
                        </div>

                        <div className="ghost-cut my-3"></div>

                        <div className="flex justify-between items-center">
                          <span className="text-[var(--amber)] font-mono font-bold text-sm">
                            {formatLakhs(client.total_value)}
                          </span>
                          
                          {/* Quick Actions */}
                          <div className="flex gap-1">
                            {stages.filter(s => s.id !== stage.id).map(s => (
                              <button
                                key={s.id}
                                onClick={() => handleStageChange(client.id, s.id)}
                                className="w-6 h-6 rounded flex items-center justify-center text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-high)] hover:text-[var(--on-surface)] transition-all"
                                title={`Move to ${s.label}`}
                              >
                                <span className="material-icons-outlined text-[12px]">
                                  {s.id === 'won' ? 'check' : s.id === 'lost' ? 'close' : 'arrow_forward'}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Premium Lead Creation Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-stitch-reveal" onClick={() => setShowCreateModal(false)}></div>
            <div className="bg-[var(--surface-container)] w-full max-w-xl p-8 rounded-2xl relative z-10 animate-stitch-reveal shadow-4">
              
              {/* Decorative top glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-[2px] bg-gradient-to-r from-transparent via-[var(--amber)] to-transparent opacity-50"></div>

              <div className="flex items-center justify-between pb-6 mb-6">
                <h3 className="text-2xl font-display tracking-tight text-[var(--on-surface)]">Add New Client Lead</h3>
                <button onClick={() => setShowCreateModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--surface-container-high)] text-[var(--on-surface-variant)] hover:text-[var(--on-surface)] transition-colors">
                  <span className="material-icons-outlined text-[18px]">close</span>
                </button>
              </div>

              <form onSubmit={handleCreateClient} className="space-y-6">
                <div>
                  <label className="block text-[var(--on-surface-variant)] text-[11px] font-bold uppercase tracking-widest mb-2 font-mono">Client Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Harish Wadhwa"
                    value={newClient.name}
                    onChange={(e) => setNewClient(prev => ({ ...prev, name: e.target.value }))}
                    className="input-recessed"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[var(--on-surface-variant)] text-[11px] font-bold uppercase tracking-widest mb-2 font-mono">Email Address</label>
                    <input
                      type="email"
                      placeholder="client@email.com"
                      value={newClient.email}
                      onChange={(e) => setNewClient(prev => ({ ...prev, email: e.target.value }))}
                      className="input-recessed"
                    />
                  </div>
                  <div>
                    <label className="block text-[var(--on-surface-variant)] text-[11px] font-bold uppercase tracking-widest mb-2 font-mono">Phone Number</label>
                    <input
                      type="text"
                      placeholder="e.g. 9876543210"
                      value={newClient.phone}
                      onChange={(e) => setNewClient(prev => ({ ...prev, phone: e.target.value }))}
                      className="input-recessed font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[var(--on-surface-variant)] text-[11px] font-bold uppercase tracking-widest mb-2 font-mono">Company / Firm</label>
                    <input
                      type="text"
                      placeholder="e.g. Wadhwa Group"
                      value={newClient.company}
                      onChange={(e) => setNewClient(prev => ({ ...prev, company: e.target.value }))}
                      className="input-recessed"
                    />
                  </div>
                  <div>
                    <label className="block text-[var(--on-surface-variant)] text-[11px] font-bold uppercase tracking-widest mb-2 font-mono">Est. Budget (₹)</label>
                    <input
                      type="number"
                      placeholder="Budget"
                      value={newClient.value}
                      onChange={(e) => setNewClient(prev => ({ ...prev, value: e.target.value }))}
                      className="input-recessed font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[var(--on-surface-variant)] text-[11px] font-bold uppercase tracking-widest mb-2 font-mono">City</label>
                    <input
                      type="text"
                      placeholder="Mumbai"
                      value={newClient.city}
                      onChange={(e) => setNewClient(prev => ({ ...prev, city: e.target.value }))}
                      className="input-recessed"
                    />
                  </div>
                  <div>
                    <label className="block text-[var(--on-surface-variant)] text-[11px] font-bold uppercase tracking-widest mb-2 font-mono">State</label>
                    <input
                      type="text"
                      placeholder="Maharashtra"
                      value={newClient.state}
                      onChange={(e) => setNewClient(prev => ({ ...prev, state: e.target.value }))}
                      className="input-recessed"
                    />
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-[var(--surface-container-high)] flex justify-end gap-4">
                  <button 
                    type="button" 
                    onClick={() => setShowCreateModal(false)}
                    className="px-6 py-2.5 rounded-full text-[var(--on-surface-variant)] hover:text-[var(--on-surface)] hover:bg-[var(--surface-elevated)] transition-colors text-sm font-semibold tracking-wide"
                  >
                    CANCEL
                  </button>
                  <button 
                    type="submit"
                    className="btn-pill-primary"
                  >
                    ADD LEAD
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
 )
}

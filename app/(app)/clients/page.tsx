'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'

const STAGES = ['prospect', 'briefing', 'proposal', 'won', 'lost'] as const

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'table' | 'pipeline'>('pipeline')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ full_name: '', email: '', company: '', city: '', phone: '' })
  const [error, setError] = useState('')

  const load = () =>
    fetch('/api/clients')
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error)
        setClients(d.clients || [])
      })
      .finally(() => setLoading(false))

  useEffect(() => {
    load()
  }, [])

  const create = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Failed')
      return
    }
    setShowForm(false)
    setForm({ full_name: '', email: '', company: '', city: '', phone: '' })
    load()
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[36px]">CRM contacts</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--stone)' }}>
            Firm pipeline contacts — separate from project client portal users.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary text-[12px]" onClick={() => setView(view === 'table' ? 'pipeline' : 'table')}>
            {view === 'table' ? 'Pipeline view' : 'Table view'}
          </button>
          <button className="btn-primary text-[12px]" onClick={() => setShowForm(true)}>
            Add contact
          </button>
        </div>
      </div>

      {error && <p className="text-sm" style={{ color: 'var(--error)' }}>{error}</p>}

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full max-w-md" />
          <div className="grid md:grid-cols-5 gap-3">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-28 w-full" />
            ))}
          </div>
        </div>
      ) : clients.length === 0 ? (
        <EmptyState
          icon="groups"
          title="No CRM contacts yet"
          description="Add a prospect or client contact to start tracking your firm pipeline."
          actionLabel="Add contact"
          onClick={() => setShowForm(true)}
        />
      ) : view === 'pipeline' ? (
        <div className="grid md:grid-cols-5 gap-3 overflow-x-auto">
          {STAGES.map((stage) => (
            <div key={stage} className="min-w-[160px]">
              <p className="text-[11px] uppercase mb-2 capitalize" style={{ color: 'var(--stone)' }}>
                {stage}
              </p>
              <div className="space-y-2">
                {clients
                  .filter((c) => c.pipeline_stage === stage)
                  .map((c) => (
                    <Link
                      key={c.id}
                      href={`/clients/${c.id}`}
                      className="block p-3 rounded-xl"
                      style={{ background: 'var(--surface-container)' }}
                    >
                      <p className="text-sm font-semibold">{c.full_name}</p>
                      <p className="text-[11px]" style={{ color: 'var(--stone)' }}>
                        {c.company || c.city || '—'}
                      </p>
                    </Link>
                  ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl overflow-x-auto" style={{ background: 'var(--surface-container)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ color: 'var(--stone)' }}>
                <th className="text-left p-4">Name</th>
                <th className="text-left p-4">Company</th>
                <th className="text-left p-4">Stage</th>
                <th className="text-left p-4">Value</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id} style={{ boxShadow: 'inset 0 1px 0 rgba(159,142,122,0.08)' }}>
                  <td className="p-4">
                    <Link href={`/clients/${c.id}`} className="hover:underline">{c.full_name}</Link>
                  </td>
                  <td className="p-4">{c.company || '—'}</td>
                  <td className="p-4 capitalize">{c.pipeline_stage}</td>
                  <td className="p-4">₹{Number(c.total_value || 0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.55)' }}>
          <form onSubmit={create} className="w-full max-w-md p-6 rounded-2xl space-y-3" style={{ background: 'var(--surface-container-high)' }}>
            <h3 className="font-semibold text-lg">Add CRM contact</h3>
            <input className="input-5bloc" required placeholder="Full name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            <input className="input-5bloc" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <input className="input-5bloc" placeholder="Company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
            <input className="input-5bloc" placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            <input className="input-5bloc" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn-primary">Save</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

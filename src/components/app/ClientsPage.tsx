import React, { useCallback, useEffect, useState } from 'react'
import Link from '@/compat/next-link'
import { Skeleton } from '@/components/ui5/Skeleton'
import { EmptyState } from '@/components/ui5/EmptyState'
import { ErrorState } from '@/components/ui5/ErrorState'
import { useToast } from '@/components/ui5/Toast'
import { useLiveReload } from '@/lib/live/useLiveReload'

const STAGES = ['prospect', 'briefing', 'proposal', 'won', 'lost'] as const

const EMPTY_FORM = { full_name: '', email: '', company: '', city: '', phone: '' }

export default function ClientsPage() {
  const { toast } = useToast()
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<unknown>(null)
  const [view, setView] = useState<'table' | 'pipeline'>('pipeline')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{ full_name?: string; email?: string }>({})

  const load = useCallback(async (opts?: { quiet?: boolean }) => {
    if (!opts?.quiet) {
      setLoading(true)
      setError(null)
    }
    try {
      const res = await fetch('/api/clients')
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'Failed to load contacts')
      setClients(data.clients || [])
    } catch (err) {
      if (!opts?.quiet) setError(err)
    } finally {
      if (!opts?.quiet) setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useLiveReload(load, ['clients'])

  const openForm = () => {
    setForm(EMPTY_FORM)
    setFieldErrors({})
    setShowForm(true)
  }

  const create = async (e: React.FormEvent) => {
    e.preventDefault()
    if (saving) return

    const nextErrors: { full_name?: string; email?: string } = {}
    if (!form.full_name.trim()) nextErrors.full_name = 'Enter the contact’s name.'
    if (form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      nextErrors.email = 'That does not look like an email address.'
    }
    setFieldErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    setSaving(true)
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, full_name: form.full_name.trim(), email: form.email.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not save this contact')
      setShowForm(false)
      setForm(EMPTY_FORM)
      if (data.client) {
        setClients((prev) => [data.client, ...prev.filter((c: { id: string }) => c.id !== data.client.id)])
      } else {
        await load({ quiet: true })
      }
      if (!form.email.trim()) {
        toast(
          `${data.client?.full_name || form.full_name.trim()} added — add an email later before sending invoices.`,
          'warning',
          7000
        )
      } else {
        toast(`${data.client?.full_name || form.full_name.trim()} added to your pipeline`, 'success')
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not save this contact', 'error')
    } finally {
      setSaving(false)
    }
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
          <button className="btn-primary text-[12px]" onClick={openForm}>
            Add contact
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full max-w-md" />
          <div className="grid md:grid-cols-5 gap-3">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-28 w-full" />
            ))}
          </div>
        </div>
      ) : error ? (
        <ErrorState title="Could not load your contacts" error={error} onRetry={load} />
      ) : clients.length === 0 ? (
        <EmptyState
          icon="groups"
          title="No CRM contacts yet"
          description="Add a prospect or client contact to start tracking your firm pipeline."
          actionLabel="Add contact"
          onClick={openForm}
        />
      ) : view === 'pipeline' ? (
        <div className="grid md:grid-cols-5 gap-3 overflow-x-auto">
          {STAGES.map((stage) => {
            const inStage = clients.filter((c) => c.pipeline_stage === stage)
            return (
              <div key={stage} className="min-w-[160px]">
                <p className="text-[11px] uppercase mb-2 capitalize" style={{ color: 'var(--stone)' }}>
                  {stage} ({inStage.length})
                </p>
                <div className="space-y-2">
                  {inStage.length === 0 ? (
                    <p className="text-[11px] p-3 rounded-xl" style={{ color: 'var(--stone)', background: 'var(--surface-container-low)' }}>
                      Nobody at this stage.
                    </p>
                  ) : (
                    inStage.map((c) => (
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
                    ))
                  )}
                </div>
              </div>
            )
          })}
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
          <form onSubmit={create} noValidate className="w-full max-w-md p-6 rounded-2xl space-y-3" style={{ background: 'var(--surface-container-high)' }}>
            <h3 className="font-semibold text-lg">Add CRM contact</h3>
            <div>
              <input
                className="input-5bloc"
                placeholder="Full name *"
                value={form.full_name}
                onChange={(e) => {
                  setForm({ ...form, full_name: e.target.value })
                  setFieldErrors((prev) => ({ ...prev, full_name: undefined }))
                }}
              />
              {fieldErrors.full_name && (
                <p className="text-[11px] mt-1" style={{ color: 'var(--error)' }}>{fieldErrors.full_name}</p>
              )}
            </div>
            <div>
              <input
                className="input-5bloc"
                placeholder="Email (needed to send invoices)"
                type="email"
                value={form.email}
                onChange={(e) => {
                  setForm({ ...form, email: e.target.value })
                  setFieldErrors((prev) => ({ ...prev, email: undefined }))
                }}
              />
              {fieldErrors.email && (
                <p className="text-[11px] mt-1" style={{ color: 'var(--error)' }}>{fieldErrors.email}</p>
              )}
              {!form.email.trim() && (
                <p className="text-[11px] mt-1" style={{ color: 'var(--stone)' }}>
                  Without an email you can still track this contact, but you cannot email tax invoices or
                  payment links until one is added.
                </p>
              )}
            </div>
            <input className="input-5bloc" placeholder="Company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
            <input className="input-5bloc" placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            <input className="input-5bloc" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-secondary" disabled={saving} onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

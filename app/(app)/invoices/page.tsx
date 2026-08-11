'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'

interface Invoice {
  id: string
  invoice_number: string
  client_name: string
  project_name: string
  subtotal: number
  total: number
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  due_date: string
  paid_at?: string
}

export default function InvoicesList() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(''), 3200)
  }

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/invoices')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load invoices')
      setInvoices(data.invoices || [])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const getStatusStyle = (status: Invoice['status']): React.CSSProperties => {
    switch (status) {
      case 'draft':
        return { background: 'rgba(159,142,122,.10)', color: 'var(--stone)' }
      case 'sent':
        return { background: 'rgba(122,184,255,.12)', color: 'var(--blue)' }
      case 'paid':
        return { background: 'rgba(111,220,140,.12)', color: 'var(--success)' }
      case 'overdue':
        return { background: 'rgba(255,180,171,.12)', color: 'var(--error)' }
      case 'cancelled':
        return { background: 'rgba(159,142,122,.10)', color: 'var(--stone)' }
      default:
        return {}
    }
  }

  const handleMarkPaid = async (invId: string) => {
    const res = await fetch(`/api/invoices/${invId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'paid' }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Could not mark paid')
      return
    }
    setInvoices((prev) =>
      prev.map((i) =>
        i.id === invId
          ? { ...i, status: 'paid', paid_at: data.invoice?.paid_at || new Date().toISOString() }
          : i
      )
    )
    showToast('Invoice marked paid')
  }

  const handlePdf = (invId: string) => {
    window.open(`/api/invoices/${invId}/pdf`, '_blank', 'noopener,noreferrer')
  }

  const handleSend = async (invId: string) => {
    setBusyId(invId)
    setError('')
    try {
      const res = await fetch(`/api/invoices/${invId}/send`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Send failed')
      setInvoices((prev) =>
        prev.map((i) => (i.id === invId && i.status === 'draft' ? { ...i, status: 'sent' } : i))
      )
      showToast(data.mock ? `Email queued (mock) to ${data.emailed_to}` : `Invoice sent to ${data.emailed_to}`)
    } catch (e: any) {
      setError(e.message || 'Send failed')
    } finally {
      setBusyId(null)
    }
  }

  const paidThisMonth = invoices
    .filter((i) => i.status === 'paid')
    .reduce((sum, i) => sum + Number(i.total || 0), 0)
  const outstanding = invoices
    .filter((i) => i.status === 'sent' || i.status === 'overdue')
    .reduce((sum, i) => sum + Number(i.total || 0), 0)
  const overdueCount = invoices.filter((i) => i.status === 'overdue').length

  return (
    <div className="p-6 space-y-6 font-body select-none max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-wide">Invoices Registry</h1>
          <p className="text-xs text-stone mt-1">
            Manage project billing, calculate CGST/SGST/IGST taxes, and track collections.
          </p>
        </div>
        <Link href="/invoices/new" className="btn-primary">
          <span className="material-icons-outlined text-[18px]">add</span>
          CREATE NEW INVOICE
        </Link>
      </div>

      {error && (
        <p className="text-sm" style={{ color: 'var(--error)' }}>
          {error}
        </p>
      )}
      {toast && (
        <p
          className="text-sm px-3 py-2 rounded-lg"
          style={{ background: 'rgba(111,220,140,.12)', color: 'var(--success)' }}
        >
          {toast}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {[
          {
            label: 'Collected Fees',
            value: `₹${paidThisMonth.toLocaleString()}`,
            trend: 'Paid invoices (GST incl.)',
            color: 'text-success',
          },
          {
            label: 'Outstanding Fees',
            value: `₹${outstanding.toLocaleString()}`,
            trend: 'Awaiting client release',
            color: 'text-blue',
          },
          {
            label: 'Overdue Invoices',
            value: overdueCount,
            trend: 'Requires follow up',
            color: 'text-error',
          },
        ].map((stat, idx) => (
          <div key={idx} className="card-5bloc p-4">
            <span className="text-[10px] text-stone font-mono uppercase tracking-wider">{stat.label}</span>
            <h4 className={`text-xl font-bold mt-1 ${stat.color}`}>{stat.value}</h4>
            <p className="text-[10px] text-stone mt-1 font-mono">{stat.trend}</p>
          </div>
        ))}
      </div>

      <div className="card-5bloc flex flex-col justify-between">
        <div className="flex items-center justify-between pb-4 ">
          <div>
            <h3 className="text-sm font-bold uppercase text-white font-mono">Invoice Records</h3>
            <p className="text-[11px] text-stone mt-0.5">
              Numbers generated server-side. Mark paid when funds clear.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3 py-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : invoices.length === 0 ? (
          <EmptyState
            icon="receipt_long"
            title="No invoice records logged"
            description="Generate your first fee invoice to release project milestone payments."
            actionLabel="Create invoice"
            href="/invoices/new"
            style={{ background: 'transparent' }}
          />
        ) : (
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left text-xs ">
              <thead>
                <tr className="text-stone font-mono uppercase text-[10px] tracking-wider">
                  <th className="pb-3 pl-2">Invoice #</th>
                  <th className="pb-3">Project</th>
                  <th className="pb-3">Client</th>
                  <th className="pb-3 text-right">Subtotal (₹)</th>
                  <th className="pb-3 text-right">Total (₹)</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Due Date</th>
                  <th className="pb-3 pr-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => {
                  const isOverdue = inv.status === 'overdue'
                  return (
                    <tr
                      key={inv.id}
                      className="group"
                      style={isOverdue ? { boxShadow: 'inset 3px 0 0 var(--error)' } : {}}
                    >
                      <td className="py-4 pl-3 font-mono text-[10px] text-white font-semibold">
                        {inv.invoice_number}
                      </td>
                      <td className="py-4 font-semibold text-white truncate max-w-[160px]">
                        {inv.project_name}
                      </td>
                      <td className="py-4 text-stone">{inv.client_name}</td>
                      <td className="py-4 text-right font-mono text-stone">
                        {Number(inv.subtotal || 0).toLocaleString()}
                      </td>
                      <td className="py-4 text-right font-mono font-semibold text-white">
                        {Number(inv.total || 0).toLocaleString()}
                      </td>
                      <td className="py-4">
                        <span className="chip" style={getStatusStyle(inv.status)}>
                          {inv.status.replace(/_/g, ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="py-4 font-mono text-[10px] text-stone">{inv.due_date || '—'}</td>
                      <td className="py-4 pr-2 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handlePdf(inv.id)}
                            className="p-1 text-stone hover:text-amber hover:bg-navy-lt transition"
                            title="View / PDF"
                          >
                            <span className="material-icons-outlined text-[16px]">picture_as_pdf</span>
                          </button>
                          {inv.status !== 'paid' && inv.status !== 'cancelled' && (
                            <button
                              onClick={() => handleSend(inv.id)}
                              disabled={busyId === inv.id}
                              className="p-1 text-stone hover:text-blue hover:bg-navy-lt transition disabled:opacity-40"
                              title="Send to client"
                            >
                              <span className="material-icons-outlined text-[16px]">send</span>
                            </button>
                          )}
                          {inv.status !== 'paid' && (
                            <button
                              onClick={() => handleMarkPaid(inv.id)}
                              className="p-1 text-stone hover:text-success hover:bg-navy-lt transition"
                              title="Mark Paid"
                            >
                              <span className="material-icons-outlined text-[16px]">check_circle</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

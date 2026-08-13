'use client'

import React, { useCallback, useState, useEffect } from 'react'
import Link from 'next/link'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { useToast } from '@/components/ui/Toast'
import { useConfirm } from '@/components/ui/ConfirmProvider'
import { startInvoiceCheckout } from '@/lib/payments/checkout'

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

const money = (v?: number | null) => `₹${Number(v || 0).toLocaleString('en-IN')}`

export default function InvoicesList() {
  const { toast } = useToast()
  const confirm = useConfirm()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<unknown>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/invoices')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load invoices')
      setInvoices(data.invoices || [])
    } catch (e) {
      setError(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

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

  const isUnpaid = (inv: Invoice) => inv.status !== 'paid' && inv.status !== 'cancelled'

  const handleMarkPaid = async (inv: Invoice) => {
    if (busyId) return
    const ok = await confirm({
      title: `Mark ${inv.invoice_number} as paid?`,
      message: `This records ${money(inv.total)} from ${
        inv.client_name || 'this client'
      } as collected and stops any overdue chasing. It does not take a payment.`,
      confirmLabel: 'Mark paid',
    })
    if (!ok) return

    setBusyId(inv.id)
    try {
      const res = await fetch(`/api/invoices/${inv.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'paid' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not mark this invoice paid')
      setInvoices((prev) =>
        prev.map((i) =>
          i.id === inv.id
            ? { ...i, status: 'paid', paid_at: data.invoice?.paid_at || new Date().toISOString() }
            : i
        )
      )
      toast(`${inv.invoice_number} marked paid`, 'success')
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not mark this invoice paid', 'error')
    } finally {
      setBusyId(null)
    }
  }

  const handlePdf = (invId: string) => {
    window.open(`/api/invoices/${invId}/pdf`, '_blank', 'noopener,noreferrer')
  }

  const handleSend = async (inv: Invoice) => {
    if (busyId) return
    const ok = await confirm({
      title: `Email ${inv.invoice_number} to the client?`,
      message: `${
        inv.client_name || 'The client'
      } will receive this invoice for ${money(inv.total)} by email with a pay link, and it will be marked as sent.`,
      confirmLabel: 'Email invoice',
    })
    if (!ok) return

    setBusyId(inv.id)
    try {
      const res = await fetch(`/api/invoices/${inv.id}/send`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not send this invoice')
      setInvoices((prev) =>
        prev.map((i) => (i.id === inv.id && i.status === 'draft' ? { ...i, status: 'sent' } : i))
      )
      if (data.email_warning || data.mock) {
        toast(
          data.email_warning ||
            `Email not actually delivered — no mail provider is configured. It would have gone to ${data.emailed_to}.`,
          'warning',
          8000
        )
      } else {
        toast(`Invoice emailed to ${data.emailed_to} with a pay link.`, 'success')
      }
    } catch (e) {
      toast(
        e instanceof Error ? e.message : 'Could not send this invoice. Nothing was emailed — try again.',
        'error',
        6000
      )
    } finally {
      setBusyId(null)
    }
  }

  const handleCopyPayLink = async (inv: Invoice) => {
    if (busyId) return
    setBusyId(inv.id)
    try {
      const res = await fetch(`/api/invoices/${inv.id}/pay-link`)
      const data = await res.json()
      if (!res.ok || !data.url) throw new Error(data.error || 'Could not create a pay link')
      try {
        await navigator.clipboard.writeText(data.url)
        toast(`Pay link for ${inv.invoice_number} copied`, 'success')
      } catch {
        toast(`Pay link: ${data.url}`, 'success', 10000)
      }
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not copy pay link', 'error')
    } finally {
      setBusyId(null)
    }
  }

  const handleCollectPayment = async (inv: Invoice) => {
    if (busyId) return
    setBusyId(inv.id)
    try {
      const result = await startInvoiceCheckout(inv.id)
      if (result.message) toast(result.message, result.ok ? 'success' : 'warning', 6000)
      if (!result.ok) return

      setInvoices((prev) =>
        prev.map((i) => (i.id === inv.id ? { ...i, status: i.status === 'draft' ? 'sent' : i.status } : i))
      )
      setTimeout(async () => {
        const res = await fetch('/api/invoices')
        if (!res.ok) return
        const data = await res.json()
        const fresh = (data.invoices || []).find((i: Invoice) => i.id === inv.id)
        if (fresh?.status) {
          setInvoices((prev) => prev.map((i) => (i.id === inv.id ? { ...i, status: fresh.status } : i)))
        }
      }, 4000)
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
        ) : error ? (
          <ErrorState
            title="Could not load your invoices"
            error={error}
            onRetry={load}
            style={{ background: 'transparent' }}
          />
        ) : invoices.length === 0 ? (
          <EmptyState
            icon="receipt_long"
            title="No invoices raised yet"
            description="Raise your first fee invoice — GST is calculated for you and the invoice number is issued server-side."
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
                  const unpaid = isUnpaid(inv)
                  const isOverdue = inv.status === 'overdue'
                  const rowBusy = busyId === inv.id
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
                          {unpaid && (
                            <button
                              onClick={() => handleSend(inv)}
                              disabled={busyId !== null}
                              className="p-1 text-stone hover:text-blue hover:bg-navy-lt transition disabled:opacity-40"
                              title={rowBusy ? 'Working…' : inv.status === 'draft' ? 'Email invoice' : 'Re-email invoice'}
                            >
                              <span className="material-icons-outlined text-[16px]">send</span>
                            </button>
                          )}
                          {unpaid && (
                            <button
                              onClick={() => handleCopyPayLink(inv)}
                              disabled={busyId !== null}
                              className="p-1 text-stone hover:text-amber hover:bg-navy-lt transition disabled:opacity-40"
                              title={rowBusy ? 'Working…' : 'Copy pay link'}
                            >
                              <span className="material-icons-outlined text-[16px]">link</span>
                            </button>
                          )}
                          {unpaid && (
                            <button
                              onClick={() => handleCollectPayment(inv)}
                              disabled={busyId !== null}
                              className="p-1 text-stone hover:text-blue hover:bg-navy-lt transition disabled:opacity-40"
                              title={rowBusy ? 'Working…' : 'Collect payment online'}
                            >
                              <span className="material-icons-outlined text-[16px] text-blue">payments</span>
                            </button>
                          )}
                          {unpaid && (
                            <button
                              onClick={() => handleMarkPaid(inv)}
                              disabled={busyId !== null}
                              className="p-1 text-stone hover:text-success hover:bg-navy-lt transition disabled:opacity-40"
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

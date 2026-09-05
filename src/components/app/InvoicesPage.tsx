import React, { useCallback, useState, useEffect } from 'react'
import Link from '@/compat/next-link'
import { Skeleton } from '@/components/ui5/Skeleton'
import { EmptyState } from '@/components/ui5/EmptyState'
import { ErrorState } from '@/components/ui5/ErrorState'
import { useToast } from '@/components/ui5/Toast'
import { useConfirm } from '@/components/ui5/ConfirmProvider'
import { startInvoiceCheckout } from '@/lib/payments/checkout'
import { useLiveReload } from '@/lib/live/useLiveReload'
import { pollUntil } from '@/lib/live/pollUntil'

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

export default function InvoicesPage() {
  const { toast } = useToast()
  const confirm = useConfirm()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<unknown>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async (opts?: { quiet?: boolean }) => {
    if (!opts?.quiet) {
      setLoading(true)
      setError(null)
    }
    try {
      const res = await fetch('/api/invoices')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load invoices')
      setInvoices(data.invoices || [])
    } catch (e) {
      if (!opts?.quiet) setError(e)
    } finally {
      if (!opts?.quiet) setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useLiveReload(load, ['invoices'])

  const getStatusChipClass = (status: Invoice['status']): string => {
    switch (status) {
      case 'draft':
        return 'chip-m'
      case 'sent':
        return 'chip-m chip-m-blue'
      case 'paid':
        return 'chip-m chip-m-green'
      case 'overdue':
        return 'chip-m chip-m-red'
      case 'cancelled':
        return 'chip-m'
      default:
        return 'chip-m'
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
    const paidAt = new Date().toISOString()
    setInvoices((prev) =>
      prev.map((i) => (i.id === inv.id ? { ...i, status: 'paid', paid_at: paidAt } : i))
    )
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
            ? { ...i, status: 'paid', paid_at: data.invoice?.paid_at || paidAt }
            : i
        )
      )
      toast(`${inv.invoice_number} marked paid`, 'success')
    } catch (e) {
      setInvoices((prev) =>
        prev.map((i) => (i.id === inv.id ? { ...i, status: inv.status, paid_at: inv.paid_at } : i))
      )
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
    if (inv.status === 'draft') {
      setInvoices((prev) => prev.map((i) => (i.id === inv.id ? { ...i, status: 'sent' } : i)))
    }
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
      if (inv.status === 'draft') {
        setInvoices((prev) => prev.map((i) => (i.id === inv.id ? { ...i, status: inv.status } : i)))
      }
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
      void pollUntil(
        async () => {
          const res = await fetch('/api/invoices')
          if (!res.ok) return null
          const data = await res.json()
          return (data.invoices || []).find((i: Invoice) => i.id === inv.id) as Invoice | undefined
        },
        (fresh) => !!fresh && (fresh.status === 'paid' || fresh.status === 'cancelled'),
        { attempts: 10, intervalMs: 1500 }
      ).then((fresh) => {
        if (fresh?.status) {
          setInvoices((prev) =>
            prev.map((i) =>
              i.id === inv.id ? { ...i, status: fresh.status, paid_at: fresh.paid_at } : i
            )
          )
        }
      })
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
    <div className="page-m space-y-8 font-body">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-m-title">Invoices Registry</h1>
          <p className="page-m-sub">
            Manage project billing, calculate CGST/SGST/IGST taxes, and track collections.
          </p>
        </div>
        <Link href="/invoices/new" className="btn-primary">
          <span className="material-icons-outlined">add</span>
          CREATE NEW INVOICE
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          {
            label: 'Collected Fees',
            value: `₹${paidThisMonth.toLocaleString()}`,
            trend: 'Paid invoices (GST incl.)',
            accent: 'text-success',
          },
          {
            label: 'Outstanding Fees',
            value: `₹${outstanding.toLocaleString()}`,
            trend: 'Awaiting client release',
            accent: 'text-blue',
          },
          {
            label: 'Overdue Invoices',
            value: overdueCount.toString(),
            trend: 'Requires follow up',
            accent: 'text-error',
          },
        ].map((stat, idx) => (
          <div key={idx} className="card-m stat-m">
            <span className="stat-m-label">{stat.label}</span>
            <div className={`stat-m-value ${stat.accent}`}>{stat.value}</div>
            <p className="stat-m-note">{stat.trend}</p>
          </div>
        ))}
      </div>

      <div className="card-m flex flex-col">
        <div className="card-m-head">
          <div>
            <h3 className="card-m-title">Invoice Records</h3>
            <p className="text-[12px] text-stone mt-0.5">
              Numbers generated server-side. Mark paid when funds clear.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-3/4" />
          </div>
        ) : error ? (
          <div className="p-8">
            <ErrorState
              title="Could not load your invoices"
              error={error}
              onRetry={load}
            />
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-12">
            <EmptyState
              icon="receipt_long"
              title="No invoices raised yet"
              description="Raise your first fee invoice — GST is calculated for you and the invoice number is issued server-side."
              actionLabel="Create invoice"
              href="/invoices/new"
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-m">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Project</th>
                  <th>Client</th>
                  <th className="text-right">Subtotal (₹)</th>
                  <th className="text-right">Total (₹)</th>
                  <th>Status</th>
                  <th>Due Date</th>
                  <th className="text-right">Actions</th>
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
                      className={isOverdue ? 'bg-error/5' : ''}
                    >
                      <td className="font-mono text-[12px] font-semibold">
                        {inv.invoice_number}
                      </td>
                      <td className="font-semibold truncate max-w-[160px]">
                        {inv.project_name}
                      </td>
                      <td className="text-stone">{inv.client_name}</td>
                      <td className="text-right font-mono text-stone">
                        {Number(inv.subtotal || 0).toLocaleString()}
                      </td>
                      <td className="text-right font-mono font-semibold text-amber">
                        {Number(inv.total || 0).toLocaleString()}
                      </td>
                      <td>
                        <span className={getStatusChipClass(inv.status)}>
                          {inv.status.replace(/_/g, ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="font-mono text-[11px] text-stone">{inv.due_date || '—'}</td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handlePdf(inv.id)}
                            className="btn-icon"
                            title="View / PDF"
                          >
                            <span className="material-icons-outlined">picture_as_pdf</span>
                          </button>
                          {unpaid && (
                            <>
                              <button
                                onClick={() => handleSend(inv)}
                                disabled={busyId !== null}
                                className="btn-icon"
                                title={rowBusy ? 'Working…' : inv.status === 'draft' ? 'Email invoice' : 'Re-email invoice'}
                              >
                                <span className="material-icons-outlined">send</span>
                              </button>
                              <button
                                onClick={() => handleCopyPayLink(inv)}
                                disabled={busyId !== null}
                                className="btn-icon"
                                title={rowBusy ? 'Working…' : 'Copy pay link'}
                              >
                                <span className="material-icons-outlined">link</span>
                              </button>
                              <button
                                onClick={() => handleCollectPayment(inv)}
                                disabled={busyId !== null}
                                className="btn-icon"
                                title={rowBusy ? 'Working…' : 'Collect payment online'}
                              >
                                <span className="material-icons-outlined text-blue">payments</span>
                              </button>
                              <button
                                onClick={() => handleMarkPaid(inv)}
                                disabled={busyId !== null}
                                className="btn-icon"
                                title="Mark Paid"
                              >
                                <span className="material-icons-outlined text-success">check_circle</span>
                              </button>
                            </>
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

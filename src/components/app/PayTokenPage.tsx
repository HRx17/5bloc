import React, { useCallback, useEffect, useState } from 'react'
import { useParams } from '@/compat/next-navigation'
import { loadRazorpayScript } from '@/lib/payments/checkout'
import { useToast } from '@/components/ui5/Toast'

type InvoiceSummary = {
  id: string
  invoice_number: string
  client_name: string
  project_name: string
  total: number
  status: string
  due_date: string | null
}

export default function PayTokenPage() {
  const params = useParams()
  const token = decodeURIComponent(String(params.token || ''))
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [invoice, setInvoice] = useState<InvoiceSummary | null>(null)
  const [payable, setPayable] = useState(false)
  const [paying, setPaying] = useState(false)
  const [paid, setPaid] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/public/payments/invoice?token=${encodeURIComponent(token)}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'This payment link is not available.')
      setInvoice(data.invoice)
      setPayable(!!data.payable)
      if (data.invoice?.status === 'paid') setPaid(true)
    } catch (e: any) {
      setError(e.message || 'This payment link is not available.')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    load()
  }, [load])

  const pay = async () => {
    if (paying || !payable) return
    setPaying(true)
    try {
      const res = await fetch('/api/public/payments/invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not start the payment.')
      if (data.mock) {
        toast(data.message || 'Online payment is not available yet.', 'warning', 7000)
        return
      }

      const loaded = await loadRazorpayScript()
      if (!loaded || !(window as any).Razorpay) {
        throw new Error('Payment checkout failed to load. Please try again.')
      }

      await new Promise<void>((resolve, reject) => {
        const rzp = new (window as any).Razorpay({
          key: data.key_id,
          order_id: data.order_id,
          amount: data.amount,
          currency: data.currency,
          name: '5Bloc',
          description: `Invoice ${data.invoice_number || ''}`.trim(),
          image: '/icons/icon-192.png',
          theme: { color: '#F5A623' },
          handler: () => {
            setPaid(true)
            setPayable(false)
            toast('Payment received. Your architect will see it as paid once it confirms.', 'success', 7000)
            resolve()
          },
          modal: {
            ondismiss: () => {
              toast('Payment cancelled — you have not been charged.', 'info')
              reject(new Error('dismissed'))
            },
          },
        })
        rzp.open()
      }).catch((e) => {
        if (e?.message !== 'dismissed') throw e
      })
    } catch (e: any) {
      if (e?.message !== 'dismissed') {
        toast(e.message || 'Could not start the payment.', 'error')
      }
    } finally {
      setPaying(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-body bg-surface-canvas" aria-busy="true">
        <span className="sr-only">Loading invoice…</span>
        <div className="card-m w-full max-w-md mx-4 p-6 space-y-3">
          <div className="h-4 w-32 animate-pulse rounded" style={{ background: 'var(--surface-container-high)' }} />
          <div className="h-8 w-48 animate-pulse rounded" style={{ background: 'var(--surface-container-high)' }} />
          <div className="h-20 w-full animate-pulse rounded-xl" style={{ background: 'var(--surface-container-high)' }} />
        </div>
      </div>
    )
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 font-body bg-surface-canvas">
        <div className="max-w-md text-center" role="alert">
          <h1 className="text-2xl font-semibold text-on-surface">
            Payment link unavailable
          </h1>
          <p className="mt-2 text-sm text-on-surface-var">
            {error || 'We could not find an invoice for this link.'}
          </p>
          <p className="mt-3 text-[13px] text-stone">
            Ask your architect to resend the invoice email — payment links are private and can be reissued.
          </p>
          <button type="button" onClick={load} className="btn-primary mt-6 px-4 py-2 text-[13px]">
            Try again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen font-body bg-surface-canvas text-on-surface">
      <header className="card-m rounded-none px-6 py-5">
        <div className="max-w-md mx-auto">
          <p className="text-[11px] uppercase tracking-wider text-stone">
            Invoice payment
          </p>
          <h1 className="page-m-title mt-1">{invoice.invoice_number}</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-6 py-8 space-y-5">
        <section className="card-m p-5 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-on-surface-var">Billed to</span>
            <span className="font-medium">{invoice.client_name || '—'}</span>
          </div>
          {invoice.project_name && (
            <div className="flex justify-between text-sm">
              <span className="text-on-surface-var">Project</span>
              <span className="font-medium text-right">{invoice.project_name}</span>
            </div>
          )}
          {invoice.due_date && (
            <div className="flex justify-between text-sm">
              <span className="text-on-surface-var">Due</span>
              <span className="font-medium">{invoice.due_date}</span>
            </div>
          )}
          <div className="flex justify-between pt-3 text-sm" style={{ boxShadow: 'inset 0 1px 0 var(--hairline)' }}>
            <span className="font-semibold">Amount due</span>
            <span className="font-semibold text-lg text-amber-dk">
              ₹{Number(invoice.total).toLocaleString('en-IN')}
            </span>
          </div>
        </section>

        {paid || invoice.status === 'paid' ? (
          <div className="card-m p-5 text-center">
            <p className="chip-m chip-m-green mx-auto">
              This invoice is paid
            </p>
            <p className="text-sm mt-2 text-on-surface-var">
              Thank you. No further action is needed.
            </p>
          </div>
        ) : (
          <button
            type="button"
            onClick={pay}
            disabled={paying || !payable}
            className="btn-primary w-full px-4 py-3 text-[14px] disabled:opacity-50"
          >
            {paying ? 'Opening checkout…' : 'Pay online securely'}
          </button>
        )}

        <p className="text-[11px] text-center text-stone">
          Payments are processed by Razorpay. Your card details never touch 5Bloc servers.
        </p>
      </main>
    </div>
  )
}

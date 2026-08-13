'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/ErrorState'
import { useToast } from '@/components/ui/Toast'
import { useConfirm } from '@/components/ui/ConfirmProvider'

interface LineItem {
  description: string
  amount: number
}

type BillToParty = 'client' | 'contractor' | 'consultant' | 'other'

type FieldErrors = {
  billTo?: string
  client?: string
  partyName?: string
  dueDate?: string
  lineItems?: string
  line?: Record<number, string>
}

const BILL_TO_OPTIONS: { value: BillToParty; label: string; hint: string }[] = [
  { value: 'client', label: 'Client', hint: 'Bill a CRM client for project fees' },
  { value: 'contractor', label: 'Contractor', hint: 'Bill a contractor or trade firm' },
  { value: 'consultant', label: 'Consultant', hint: 'Bill a consultant (MEP, structural, etc.)' },
  { value: 'other', label: 'Other party', hint: 'Anyone else who should receive this invoice' },
]

export default function NewInvoice() {
  const router = useRouter()
  const { toast } = useToast()
  const confirm = useConfirm()
  const [submitting, setSubmitting] = useState(false)
  const [loadingRefs, setLoadingRefs] = useState(true)
  const [loadError, setLoadError] = useState<unknown>(null)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [isInterstate, setIsInterstate] = useState(false)
  const [clients, setClients] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [nextNumber, setNextNumber] = useState('INV-…')
  const [billTo, setBillTo] = useState<BillToParty | ''>('')
  const [partyName, setPartyName] = useState('')

  const [formData, setFormData] = useState({
    client: '',
    project: '',
    phase: 'construction_docs',
    dueDate: '',
    notes: '',
  })

  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: 'Architectural fee installment', amount: 0 },
  ])

  const loadRefs = useCallback(async () => {
    setLoadingRefs(true)
    setLoadError(null)
    try {
      const [clientRes, projectRes] = await Promise.all([fetch('/api/clients'), fetch('/api/projects')])
      const [c, p] = await Promise.all([clientRes.json(), projectRes.json()])
      if (!clientRes.ok) throw new Error(c.error || 'Could not load your CRM contacts')
      if (!projectRes.ok) throw new Error(p.error || 'Could not load your projects')
      setClients(c.clients || [])
      setProjects(p.projects || [])
      setNextNumber(`INV-${String((c.clients?.length || 0) + 1).padStart(3, '0')} (auto)`)
    } catch (err) {
      setLoadError(err)
    } finally {
      setLoadingRefs(false)
    }
  }, [])

  useEffect(() => {
    loadRefs()
  }, [loadRefs])

  const selectedClient = useMemo(
    () => (billTo === 'client' ? clients.find((c) => c.id === formData.client) : null),
    [billTo, clients, formData.client]
  )
  const selectedClientEmail = (selectedClient?.email || '').trim()
  const canEmailClient = billTo === 'client' && !!formData.client && !!selectedClientEmail

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  const handleAddLineItem = () => setLineItems((prev) => [...prev, { description: '', amount: 0 }])
  const handleRemoveLineItem = (idx: number) =>
    setLineItems((prev) => prev.filter((_, i) => i !== idx))
  const handleLineItemChange = (idx: number, field: keyof LineItem, value: any) => {
    setLineItems((prev) => prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)))
    setErrors((prev) => ({ ...prev, lineItems: undefined, line: { ...prev.line, [idx]: '' } }))
  }

  const subtotal = lineItems.reduce((sum, item) => sum + (item.amount || 0), 0)
  const gstRate = 0.18
  const totalGst = Math.round(subtotal * gstRate)
  const cgstAmount = isInterstate ? 0 : Math.round(totalGst / 2)
  const sgstAmount = isInterstate ? 0 : totalGst - cgstAmount
  const igstAmount = isInterstate ? totalGst : 0
  const grandTotal = subtotal + totalGst

  const billToLabel = (party: BillToParty | '') =>
    BILL_TO_OPTIONS.find((o) => o.value === party)?.label || 'this party'

  const resolveBillToName = () => {
    if (billTo === 'client') {
      const client = clients.find((c) => c.id === formData.client)
      return client?.full_name || client?.name || ''
    }
    return partyName.trim()
  }

  const validate = (): FieldErrors => {
    const next: FieldErrors = { line: {} }
    if (!billTo) next.billTo = 'Choose who this invoice should go to.'
    if (billTo === 'client' && !formData.client) {
      next.client = 'Select the client this invoice is billed to.'
    }
    if (billTo && billTo !== 'client' && !partyName.trim()) {
      next.partyName = `Enter the ${billToLabel(billTo).toLowerCase()} name.`
    }
    if (!formData.dueDate) next.dueDate = 'Set the date payment is due.'

    lineItems.forEach((item, idx) => {
      if (!item.description.trim()) next.line![idx] = 'Describe what this line covers.'
      else if (!item.amount || item.amount <= 0) next.line![idx] = 'Enter an amount above zero.'
    })
    if (!lineItems.some((item) => item.amount > 0)) {
      next.lineItems = 'An invoice needs at least one line item with an amount.'
    }
    return next
  }

  const copyPayLink = async (invoiceId: string): Promise<string | null> => {
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/pay-link`)
      const data = await res.json()
      if (!res.ok || !data.url) return null
      try {
        await navigator.clipboard.writeText(data.url)
      } catch {
        /* clipboard may be blocked — still return the URL for the toast */
      }
      return data.url as string
    } catch {
      return null
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return

    const found = validate()
    const hasLineError = Object.values(found.line || {}).some(Boolean)
    if (found.billTo || found.client || found.partyName || found.dueDate || found.lineItems || hasLineError) {
      setErrors(found)
      toast('Fix the highlighted fields before saving this invoice.', 'warning')
      return
    }
    setErrors({})

    const partyLabel = resolveBillToName()
    const willEmail = canEmailClient
    const ok = await confirm({
      title: willEmail ? 'Create & email invoice?' : 'Save invoice?',
      message: willEmail
        ? `${partyLabel} will be billed ₹${grandTotal.toLocaleString('en-IN')} (incl. ${
            isInterstate ? 'IGST' : 'CGST + SGST'
          }), due ${formData.dueDate}. We'll email the invoice and pay link to ${selectedClientEmail}. The invoice number is issued on save and cannot be reused.`
        : billTo === 'client' && formData.client && !selectedClientEmail
          ? `${partyLabel} will be billed ₹${grandTotal.toLocaleString('en-IN')} (incl. ${
              isInterstate ? 'IGST' : 'CGST + SGST'
            }), due ${formData.dueDate}. This client has no email on file — the invoice will be saved as a draft and will not be emailed. Add an email on the client record to send it later.`
          : `${partyLabel} will be billed ₹${grandTotal.toLocaleString('en-IN')} (incl. ${
              isInterstate ? 'IGST' : 'CGST + SGST'
            }), due ${formData.dueDate}. The invoice will be saved as a draft (no email). The invoice number is issued on save and cannot be reused.`,
      confirmLabel: willEmail ? 'Create & email invoice' : 'Save invoice',
    })
    if (!ok) return

    setSubmitting(true)
    try {
      const project = projects.find((p) => p.id === formData.project)
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bill_to: billTo,
          client_id: billTo === 'client' ? formData.client : null,
          project_id: formData.project || null,
          client_name: partyLabel,
          project_name: project?.name,
          phase: formData.phase,
          due_date: formData.dueDate || null,
          notes: formData.notes,
          line_items: lineItems,
          subtotal,
          is_interstate: isInterstate,
          status: 'draft',
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create invoice')

      const invoiceId = data.invoice?.id as string | undefined
      const invoiceNumber = data.invoice?.invoice_number || ''

      if (billTo === 'client' && formData.client && invoiceId) {
        const sendRes = await fetch(`/api/invoices/${invoiceId}/send`, { method: 'POST' })
        const sendData = await sendRes.json().catch(() => ({}))

        if (sendRes.ok) {
          const to = sendData.emailed_to || selectedClientEmail
          if (sendData.email_warning || sendData.mock) {
            toast(
              sendData.email_warning ||
                `Invoice ${invoiceNumber} saved — email not actually delivered (mail provider not configured). Pay link was prepared for ${to}.`,
              'warning',
              8000
            )
          } else {
            toast(
              `Invoice ${invoiceNumber} emailed to ${to} with a pay link.`,
              'success',
              7000
            )
          }
          router.push('/invoices')
          return
        }

        const sendError = String(sendData.error || '')
        if (/no client email/i.test(sendError)) {
          toast(
            'Invoice saved as draft — add an email on the client to send it',
            'warning',
            8000
          )
          router.push('/invoices')
          return
        }

        const payUrl = await copyPayLink(invoiceId)
        if (payUrl) {
          toast(
            `Invoice ${invoiceNumber} saved, but email failed (${sendError || 'send error'}). Pay link copied to clipboard.`,
            'warning',
            9000
          )
        } else {
          toast(
            `Invoice ${invoiceNumber} saved as draft, but could not email it${
              sendError ? `: ${sendError}` : ''
            }. You can send or copy the pay link from the invoices list.`,
            'warning',
            9000
          )
        }
        router.push('/invoices')
        return
      }

      toast(
        `Invoice ${invoiceNumber} saved as draft for ${partyLabel}`.replace('  ', ' '),
        'success'
      )
      router.push('/invoices')
    } catch (err) {
      toast(
        err instanceof Error
          ? `${err.message} — nothing was billed, your draft is still here.`
          : 'Could not create this invoice. Nothing was billed, your draft is still here.',
        'error',
        7000
      )
      setSubmitting(false)
    }
  }

  return (
    <div className="p-6 font-body select-none max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-wide">Generate Tax Invoice</h1>
          <p className="text-xs text-stone mt-1">
            Calculates CGST/SGST/IGST dynamically. Numbers are secured server-side.
          </p>
        </div>
        <Link href="/invoices" className="btn-secondary py-2">
          CANCEL
        </Link>
      </div>

      {loadingRefs ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
          <Skeleton className="h-72 w-full" />
        </div>
      ) : loadError ? (
        <ErrorState
          title="Could not load your clients and projects"
          error={loadError}
          description="We need your CRM contacts and projects before you can choose who this invoice goes to."
          onRetry={loadRefs}
        />
      ) : (
      <form onSubmit={handleSubmit} noValidate className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-6">
          <div className="card-5bloc space-y-4">
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-amber pb-2 mb-2">
              Who should this invoice go to?
            </h3>
            <p className="text-[12px] -mt-2 mb-1" style={{ color: 'var(--stone)' }}>
              Pick the party that will pay. If you choose Client, you must select a CRM contact so the
              bill-to name on the tax invoice is correct.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" role="radiogroup" aria-label="Bill to party">
              {BILL_TO_OPTIONS.map((opt) => {
                const selected = billTo === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => {
                      setBillTo(opt.value)
                      setErrors((prev) => ({ ...prev, billTo: undefined, client: undefined, partyName: undefined }))
                      if (opt.value !== 'client') {
                        setFormData((prev) => ({ ...prev, client: '' }))
                      } else {
                        setPartyName('')
                      }
                    }}
                    className="text-left rounded-xl px-3 py-3 transition-colors"
                    style={{
                      background: selected ? 'rgba(245,166,35,0.12)' : 'var(--surface)',
                      boxShadow: selected
                        ? 'inset 0 0 0 1.5px var(--amber)'
                        : 'inset 0 0 0 1px var(--hairline)',
                    }}
                  >
                    <p className="text-[13px] font-semibold" style={{ color: 'var(--on-surface)' }}>
                      {opt.label}
                    </p>
                    <p className="text-[11px] mt-0.5" style={{ color: 'var(--stone)' }}>
                      {opt.hint}
                    </p>
                  </button>
                )
              })}
            </div>
            {errors.billTo && (
              <p className="text-[11px]" style={{ color: 'var(--error)' }}>
                {errors.billTo}
              </p>
            )}

            {billTo === 'client' && (
              <div>
                <label className="block text-stone text-[10px] font-bold uppercase tracking-wider mb-1.5 font-mono">
                  Bill-to client *
                </label>
                <select
                  name="client"
                  value={formData.client}
                  onChange={handleInputChange}
                  className="input-5bloc py-1.5 text-xs font-medium"
                  aria-invalid={!!errors.client}
                >
                  <option value="">Select a client…</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.full_name || c.name}
                      {c.email ? ` · ${c.email}` : ''}
                    </option>
                  ))}
                </select>
                {errors.client && (
                  <p className="text-[11px] mt-1" style={{ color: 'var(--error)' }}>
                    {errors.client}
                  </p>
                )}
                {formData.client && !selectedClientEmail && (
                  <p className="text-[11px] mt-1.5" style={{ color: 'var(--amber)' }}>
                    This client has no email on file — the invoice will be saved as a draft and will
                    not be emailed.{' '}
                    <Link href={`/clients/${formData.client}`} className="underline">
                      Add an email on the client
                    </Link>{' '}
                    before you can send a pay link.
                  </p>
                )}
                {clients.length === 0 && (
                  <p className="text-[11px] mt-1 text-stone">
                    No CRM contacts yet —{' '}
                    <Link href="/clients" className="underline">
                      add one
                    </Link>{' '}
                    before billing a client.
                  </p>
                )}
              </div>
            )}

            {billTo && billTo !== 'client' && (
              <div>
                <label className="block text-stone text-[10px] font-bold uppercase tracking-wider mb-1.5 font-mono">
                  {billToLabel(billTo)} name *
                </label>
                <input
                  type="text"
                  value={partyName}
                  onChange={(e) => {
                    setPartyName(e.target.value)
                    setErrors((prev) => ({ ...prev, partyName: undefined }))
                  }}
                  className="input-5bloc py-1.5 text-xs"
                  placeholder={`Name of the ${billToLabel(billTo).toLowerCase()}`}
                  aria-invalid={!!errors.partyName}
                />
                {errors.partyName && (
                  <p className="text-[11px] mt-1" style={{ color: 'var(--error)' }}>
                    {errors.partyName}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="card-5bloc space-y-4">
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-amber pb-2 mb-2">
              Invoice Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-stone text-[10px] font-bold uppercase tracking-wider mb-1.5 font-mono">
                  Invoice Number (Auto)
                </label>
                <input
                  type="text"
                  disabled
                  value={nextNumber}
                  className="input-5bloc opacity-60 cursor-not-allowed font-mono py-1.5 text-xs"
                />
              </div>
              <div>
                <label className="block text-stone text-[10px] font-bold uppercase tracking-wider mb-1.5 font-mono">
                  Payment Due Date *
                </label>
                <input
                  type="date"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleInputChange}
                  className="input-5bloc font-mono py-1.5 text-xs"
                  aria-invalid={!!errors.dueDate}
                />
                {errors.dueDate && (
                  <p className="text-[11px] mt-1" style={{ color: 'var(--error)' }}>
                    {errors.dueDate}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-stone text-[10px] font-bold uppercase tracking-wider mb-1.5 font-mono">
                  Associated Project
                </label>
                <select
                  name="project"
                  value={formData.project}
                  onChange={handleInputChange}
                  className="input-5bloc py-1.5 text-xs font-medium"
                >
                  <option value="">—</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-stone text-[10px] font-bold uppercase tracking-wider mb-1.5 font-mono">
                  Target Phase
                </label>
                <select
                  name="phase"
                  value={formData.phase}
                  onChange={handleInputChange}
                  className="input-5bloc py-1.5 text-xs font-medium"
                >
                  <option value="pre_design">Pre-Design</option>
                  <option value="schematic_design">Schematic Design</option>
                  <option value="design_development">Design Development</option>
                  <option value="construction_docs">Construction Docs</option>
                  <option value="bidding">Bidding</option>
                  <option value="construction_admin">Construction Admin</option>
                </select>
              </div>
            </div>
          </div>

          <div className="card-5bloc space-y-4">
            <div className="flex items-center justify-between pb-2 mb-2">
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-amber">Line Items</h3>
              <button
                type="button"
                onClick={handleAddLineItem}
                className="text-[11px] text-amber hover:text-amber-lt transition font-mono uppercase flex items-center gap-0.5"
              >
                <span className="material-icons-outlined text-[14px]">add</span> ADD LINE ITEM
              </button>
            </div>

            <div className="space-y-3">
              {lineItems.map((item, idx) => {
                const lineError = errors.line?.[idx]
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex gap-4 items-center">
                      <div className="flex-grow">
                        <input
                          type="text"
                          placeholder="Item description / milestone name..."
                          value={item.description}
                          onChange={(e) => handleLineItemChange(idx, 'description', e.target.value)}
                          className="input-5bloc py-1.5 text-xs"
                          aria-invalid={!!lineError}
                        />
                      </div>
                      <div className="w-36 shrink-0 relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone text-xs font-mono">
                          ₹
                        </span>
                        <input
                          type="number"
                          min={0}
                          placeholder="Amount"
                          value={item.amount || ''}
                          onChange={(e) =>
                            handleLineItemChange(idx, 'amount', parseInt(e.target.value) || 0)
                          }
                          className="input-5bloc pl-7 py-1.5 text-xs font-mono text-right"
                          aria-invalid={!!lineError}
                        />
                      </div>
                      {lineItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveLineItem(idx)}
                          className="text-stone hover:text-error transition p-1 hover:bg-navy"
                        >
                          <span className="material-icons-outlined text-[18px]">delete</span>
                        </button>
                      )}
                    </div>
                    {lineError && (
                      <p className="text-[11px]" style={{ color: 'var(--error)' }}>
                        {lineError}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
            {errors.lineItems && (
              <p className="text-[11px]" style={{ color: 'var(--error)' }}>
                {errors.lineItems}
              </p>
            )}
          </div>
        </div>

        <div className="card-5bloc space-y-5">
          <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-amber pb-2">
            Tax Calculation
          </h3>

          <div className="flex items-center justify-between text-xs pt-1">
            <div>
              <span className="text-white font-semibold">Interstate Transaction</span>
              <p className="text-[10px] text-stone">Applies IGST 18% instead of CGST+SGST</p>
            </div>
            <button
              type="button"
              onClick={() => setIsInterstate(!isInterstate)}
              className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer border-2 transition-colors duration-200 ease-in-out focus:outline-none ${
                isInterstate ? 'bg-success' : 'bg-navy-lt'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  isInterstate ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className=" pt-4 space-y-2.5 text-xs font-mono text-stone">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="text-white font-semibold">₹{subtotal.toLocaleString()}</span>
            </div>
            {isInterstate ? (
              <div className="flex justify-between">
                <span>IGST (18%):</span>
                <span className="text-white">₹{igstAmount.toLocaleString()}</span>
              </div>
            ) : (
              <>
                <div className="flex justify-between">
                  <span>CGST (9%):</span>
                  <span className="text-white">₹{cgstAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>SGST (9%):</span>
                  <span className="text-white">₹{sgstAmount.toLocaleString()}</span>
                </div>
              </>
            )}
            <div className=" pt-3 flex justify-between text-sm text-white font-bold font-body">
              <span>GRAND TOTAL:</span>
              <span className="text-amber">₹{grandTotal.toLocaleString()}</span>
            </div>
          </div>

          <div>
            <label className="block text-stone text-[10px] font-bold uppercase tracking-wider mb-1.5 font-mono">
              Invoice Notes
            </label>
            <textarea
              name="notes"
              rows={3}
              value={formData.notes}
              onChange={handleInputChange}
              className="input-5bloc text-xs resize-none"
              placeholder="Bank account details or payment terms..."
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full btn-primary py-2.5 text-xs font-bold tracking-wider"
          >
            {submitting
              ? canEmailClient
                ? 'CREATING & EMAILING…'
                : 'SAVING INVOICE…'
              : canEmailClient
                ? 'CREATE & EMAIL INVOICE'
                : 'SAVE INVOICE'}
          </button>
        </div>
      </form>
      )}
    </div>
  )
}

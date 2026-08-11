'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface LineItem {
  description: string
  amount: number
}

export default function NewInvoice() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isInterstate, setIsInterstate] = useState(false)
  const [clients, setClients] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [nextNumber, setNextNumber] = useState('INV-…')

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

  useEffect(() => {
    Promise.all([fetch('/api/clients').then((r) => r.json()), fetch('/api/projects').then((r) => r.json())])
      .then(([c, p]) => {
        setClients(c.clients || [])
        setProjects(p.projects || [])
        if (c.clients?.[0]) setFormData((prev) => ({ ...prev, client: c.clients[0].id }))
        if (p.projects?.[0]) setFormData((prev) => ({ ...prev, project: p.projects[0].id }))
        setNextNumber(`INV-${String((c.clients?.length || 0) + 1).padStart(3, '0')} (auto)`)
      })
      .catch(() => setError('Failed to load clients/projects'))
  }, [])

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleAddLineItem = () => setLineItems((prev) => [...prev, { description: '', amount: 0 }])
  const handleRemoveLineItem = (idx: number) =>
    setLineItems((prev) => prev.filter((_, i) => i !== idx))
  const handleLineItemChange = (idx: number, field: keyof LineItem, value: any) => {
    setLineItems((prev) => prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)))
  }

  const subtotal = lineItems.reduce((sum, item) => sum + (item.amount || 0), 0)
  const gstRate = 0.18
  const totalGst = Math.round(subtotal * gstRate)
  const cgstAmount = isInterstate ? 0 : Math.round(totalGst / 2)
  const sgstAmount = isInterstate ? 0 : totalGst - cgstAmount
  const igstAmount = isInterstate ? totalGst : 0
  const grandTotal = subtotal + totalGst

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const client = clients.find((c) => c.id === formData.client)
      const project = projects.find((p) => p.id === formData.project)
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: formData.client || null,
          project_id: formData.project || null,
          client_name: client?.full_name || client?.name,
          project_name: project?.name,
          phase: formData.phase,
          due_date: formData.dueDate || null,
          notes: formData.notes,
          line_items: lineItems,
          subtotal,
          is_interstate: isInterstate,
          status: 'sent',
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create invoice')
      router.push('/invoices')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
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

      {error && (
        <p className="text-sm" style={{ color: 'var(--error)' }}>
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-6">
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
                  required
                  value={formData.dueDate}
                  onChange={handleInputChange}
                  className="input-5bloc font-mono py-1.5 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-stone text-[10px] font-bold uppercase tracking-wider mb-1.5 font-mono">
                  Select Client
                </label>
                <select
                  name="client"
                  value={formData.client}
                  onChange={handleInputChange}
                  className="input-5bloc py-1.5 text-xs font-medium"
                >
                  <option value="">—</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.full_name || c.name}
                    </option>
                  ))}
                </select>
              </div>
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
              {lineItems.map((item, idx) => (
                <div key={idx} className="flex gap-4 items-center">
                  <div className="flex-grow">
                    <input
                      type="text"
                      required
                      placeholder="Item description / milestone name..."
                      value={item.description}
                      onChange={(e) => handleLineItemChange(idx, 'description', e.target.value)}
                      className="input-5bloc py-1.5 text-xs"
                    />
                  </div>
                  <div className="w-36 shrink-0 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone text-xs font-mono">
                      ₹
                    </span>
                    <input
                      type="number"
                      required
                      placeholder="Amount"
                      value={item.amount || ''}
                      onChange={(e) =>
                        handleLineItemChange(idx, 'amount', parseInt(e.target.value) || 0)
                      }
                      className="input-5bloc pl-7 py-1.5 text-xs font-mono text-right"
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
              ))}
            </div>
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
            disabled={loading || subtotal <= 0}
            className="w-full btn-primary py-2.5 text-xs font-bold tracking-wider"
          >
            {loading ? 'GENERATING...' : 'SAVE & SEND INVOICE'}
          </button>
        </div>
      </form>
    </div>
  )
}

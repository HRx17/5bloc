'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { startInvoiceCheckout } from '@/lib/payments/checkout'
import { useToast } from '@/components/ui/Toast'

interface Invoice {
  id: string
  invoice_number: string
  client_name: string
  project_name: string
  subtotal: number
  total: number
  status: 'draft' | 'sent' | 'paid' | 'overdue'
  due_date: string
  milestone_label: string
}

interface ConsultantPayment {
  id: string
  consultant_name: string
  discipline: 'Structural' | 'MEP' | 'Landscape'
  milestone_phase: string
  amount: number
  status: 'pending' | 'approved' | 'paid'
  due_date: string
  paid_date?: string
}

interface Expense {
  id: string
  title: string
  category: 'Site Travel' | 'Printing/Plotting' | 'Municipal/Permit Fees' | 'Consultant Fees' | 'Other'
  amount: number
  date: string
}

export default function ProjectInvoices() {
  const params = useParams()
  const projectId = params.id as string
  const { toast } = useToast()
  const [payingInvoice, setPayingInvoice] = useState<string | null>(null)

  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [consultantPayments, setConsultantPayments] = useState<ConsultantPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  
  // Invoice Form state
  const [newInvoice, setNewInvoice] = useState({
    milestone_label: 'Schematic Floor layouts approval',
    subtotal: 1200000,
    due_date: '',
  })

  // Expense Tracker state
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [newExpense, setNewExpense] = useState({
    title: '',
    category: 'Site Travel' as Expense['category'],
    amount: '',
    date: new Date().toISOString().split('T')[0]
  })

  // Fee Calculator state
  const [calcType, setCalcType] = useState('commercial')
  const [calcSize, setCalcSize] = useState(12000)
  const [calcRate, setCalcRate] = useState(180)

  const phases = [
    { name: 'Concept Design', pct: 10 },
    { name: 'Schematic Design', pct: 15 },
    { name: 'Design Development', pct: 20 },
    { name: 'Construction Documentation', pct: 25 },
    { name: 'Tender & Procurement', pct: 10 },
    { name: 'Construction Administration', pct: 15 },
    { name: 'Project Closeout', pct: 5 }
  ]
  const totalCalc = calcSize * calcRate

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const [invRes, expRes, payRes] = await Promise.all([
          fetch(`/api/invoices?project_id=${projectId}`),
          fetch(`/api/projects/${projectId}/expenses`),
          fetch(`/api/projects/${projectId}/consultant-payments`),
        ])
        const invData = await invRes.json()
        const expData = await expRes.json()
        const payData = await payRes.json()
        if (!invRes.ok) throw new Error(invData.error || 'Failed to load')
        if (cancelled) return
        setInvoices(
          (invData.invoices || []).map((inv: any) => ({
            id: inv.id,
            invoice_number: inv.invoice_number,
            client_name: inv.client_name,
            project_name: inv.project_name,
            subtotal: Number(inv.subtotal || 0),
            total: Number(inv.total || 0),
            status: inv.status,
            due_date: inv.due_date || '',
            milestone_label: inv.milestone_label || inv.phase || 'Fee installment',
          }))
        )
        if (expRes.ok) {
          setExpenses(
            (expData.expenses || []).map((e: any) => ({
              id: e.id,
              title: e.title,
              category: e.category,
              amount: Number(e.amount || 0),
              date: e.date,
            }))
          )
        }
        if (payRes.ok) {
          setConsultantPayments(
            (payData.payments || []).map((p: any) => ({
              id: p.id,
              consultant_name: p.consultant_name,
              discipline: p.discipline,
              milestone_phase: p.milestone_phase || '',
              amount: Number(p.amount || 0),
              status: p.status,
              due_date: p.due_date || '',
              paid_date: p.paid_date || undefined,
            }))
          )
        }
      } catch {
        if (!cancelled) setInvoices([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [projectId])

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: projectId,
        milestone_label: newInvoice.milestone_label,
        subtotal: newInvoice.subtotal,
        due_date: newInvoice.due_date || null,
        status: 'draft',
        is_interstate: false,
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      alert(data.error || 'Failed to create invoice')
      return
    }
    const inv = data.invoice
    setInvoices((prev) => [
      {
        id: inv.id,
        invoice_number: inv.invoice_number,
        client_name: inv.client_name,
        project_name: inv.project_name,
        subtotal: Number(inv.subtotal || 0),
        total: Number(inv.total || 0),
        status: inv.status,
        due_date: inv.due_date || '',
        milestone_label: inv.milestone_label || newInvoice.milestone_label,
      },
      ...prev,
    ])
    setShowCreateModal(false)
    setNewInvoice({ milestone_label: 'Schematic Floor layouts approval', subtotal: 1200000, due_date: '' })
  }

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newExpense.title || !newExpense.amount) return
    const amountVal = parseFloat(newExpense.amount) || 0
    const res = await fetch(`/api/projects/${projectId}/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: newExpense.title,
        category: newExpense.category,
        amount: amountVal,
        date: newExpense.date || new Date().toISOString().split('T')[0],
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      alert(data.error || 'Failed to save expense')
      return
    }
    setExpenses((prev) => [
      {
        id: data.expense.id,
        title: data.expense.title,
        category: data.expense.category,
        amount: Number(data.expense.amount || 0),
        date: data.expense.date,
      },
      ...prev,
    ])
    setNewExpense({
      title: '',
      category: 'Site Travel',
      amount: '',
      date: new Date().toISOString().split('T')[0],
    })
  }

  const handleCollectPayment = async (inv: Invoice) => {
    if (payingInvoice) return
    setPayingInvoice(inv.id)
    try {
      const result = await startInvoiceCheckout(inv.id)
      if (result.message) toast(result.message, result.ok ? 'success' : 'warning', 6000)
      if (!result.ok) return

      // Razorpay confirms capture over the webhook, so poll once for the settled status
      setInvoices((prev) =>
        prev.map((i) => (i.id === inv.id ? { ...i, status: i.status === 'draft' ? 'sent' : i.status } : i))
      )
      setTimeout(async () => {
        const res = await fetch(`/api/invoices?project_id=${projectId}`)
        if (!res.ok) return
        const data = await res.json()
        const fresh = (data.invoices || []).find((i: any) => i.id === inv.id)
        if (fresh?.status) {
          setInvoices((prev) => prev.map((i) => (i.id === inv.id ? { ...i, status: fresh.status } : i)))
        }
      }, 4000)
    } finally {
      setPayingInvoice(null)
    }
  }

  const handleDeleteExpense = async (id: string) => {
    const res = await fetch(`/api/projects/${projectId}/expenses?expense_id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      alert(data.error || 'Failed to delete expense')
      return
    }
    setExpenses((prev) => prev.filter((exp) => exp.id !== id))
  }

  const handleMarkPaymentPaid = async (payId: string) => {
    const res = await fetch(`/api/projects/${projectId}/consultant-payments`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payment_id: payId, status: 'paid' }),
    })
    const data = await res.json()
    if (!res.ok) {
      alert(data.error || 'Failed to update payment')
      return
    }
    setConsultantPayments((prev) =>
      prev.map((p) =>
        p.id === payId
          ? {
              ...p,
              status: 'paid',
              paid_date: data.payment?.paid_date || new Date().toISOString().split('T')[0],
            }
          : p
      )
    )
  }

  const getInvoiceStatusStyle = (st: Invoice['status']) => {
    switch (st) {
      case 'draft': return 'bg-stone/15 text-stone '
      case 'sent': return 'bg-blue/10 text-blue '
      case 'paid': return 'bg-success/15 text-success '
      case 'overdue': return 'bg-error/15 text-error '
    }
  }

  const getPaymentStatusStyle = (st: ConsultantPayment['status']) => {
    switch (st) {
      case 'pending': return 'bg-stone/15 text-stone '
      case 'approved': return 'bg-blue/10 text-blue '
      case 'paid': return 'bg-success/15 text-success '
    }
  }

  // practice revenue calculations
  const totalBilled = invoices
    .filter(inv => inv.status !== 'draft')
    .reduce((sum, inv) => sum + inv.total, 0)

  const totalCollected = invoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.total, 0)

  const totalOutstanding = invoices
    .filter(inv => inv.status === 'sent' || inv.status === 'overdue')
    .reduce((sum, inv) => sum + inv.total, 0)

  const collectionRate = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0

  const clientRevenue = invoices
    .filter(inv => inv.status !== 'draft')
    .reduce((sum, inv) => sum + inv.subtotal, 0)

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0) +
    consultantPayments
      .filter(p => p.status === 'paid' || p.status === 'approved')
      .reduce((sum, p) => sum + p.amount, 0)

  const netProfit = clientRevenue - totalExpenses
  const profitMargin = clientRevenue > 0 ? Math.round((netProfit / clientRevenue) * 100) : 0

  return (
    <div className="space-y-6 font-body select-none">
      
      {/* ── PRACTICE REVENUE DASHBOARD ── */}
      <div className="card-5bloc space-y-4">
        <div className="border-b pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-xs font-bold font-mono text-white uppercase tracking-wider">Practice Revenue Analytics</h3>
            <p className="text-[10px] text-stone mt-0.5 font-mono">Billed fees vs. realized cash collection tracking.</p>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-stone font-mono uppercase block">Realized collection rate</span>
            <span className="text-sm font-bold text-success font-mono">{collectionRate}%</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 bg-navy/40 border">
            <span className="text-[9px] text-stone font-mono uppercase block">Total Billed Fees</span>
            <span className="text-base font-bold text-white font-mono mt-1 block">₹{totalBilled.toLocaleString()}</span>
            <span className="text-[9px] text-stone font-mono mt-1 block font-mono">Active invoice totals</span>
          </div>
          <div className="p-3 bg-navy/40 border">
            <span className="text-[9px] text-stone font-mono uppercase block">Realized Cash (Paid)</span>
            <span className="text-base font-bold text-success font-mono mt-1 block">₹{totalCollected.toLocaleString()}</span>
            <span className="text-[9px] text-stone font-mono mt-1 block font-mono">Cleared in bank</span>
          </div>
          <div className="p-3 bg-navy/40 border">
            <span className="text-[9px] text-stone font-mono uppercase block">Outstanding Revenue</span>
            <span className="text-base font-bold text-amber font-mono mt-1 block">₹{totalOutstanding.toLocaleString()}</span>
            <span className="text-[9px] text-stone font-mono mt-1 block font-mono">Pending client transfer</span>
          </div>
          <div className="p-3 bg-navy/40 border">
            <span className="text-[9px] text-stone font-mono uppercase block">Net Project Profit</span>
            <span className={`text-base font-bold font-mono mt-1 block ${netProfit >= 0 ? 'text-success' : 'text-error'}`}>
              ₹{netProfit.toLocaleString()}
            </span>
            <span className="text-[9px] text-stone font-mono mt-1 block font-mono">Margin: {profitMargin}%</span>
          </div>
        </div>

        <div className="space-y-1.5 pt-2">
          <div className="flex justify-between text-[10px] text-stone font-mono">
            <span>COLLECTED CASH (₹{totalCollected.toLocaleString()})</span>
            <span>OUTSTANDING LIQUIDITY (₹{totalOutstanding.toLocaleString()})</span>
          </div>
          <div className="w-full bg-navy-mid border h-2 flex overflow-hidden">
            <div className="bg-success h-full transition-all" style={{ width: `${collectionRate}%` }} />
            <div className="bg-amber h-full transition-all" style={{ width: `${totalBilled > 0 ? (totalOutstanding / totalBilled) * 100 : 0}%` }} />
          </div>
        </div>
      </div>

      {/* 2-Column Split: Client Invoices & Expenses (Left) + Calculator & Consultants (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Column: Client Invoices registry & Expense Tracker */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card-5bloc space-y-4">
            <div className="border-b pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold font-mono text-white uppercase tracking-wider">Client Fee Invoices</h3>
                <p className="text-[10px] text-stone mt-0.5">Calculated tax distributions and online payments status.</p>
              </div>
              <button onClick={() => setShowCreateModal(true)} className="btn-primary py-1.5 text-xs font-bold">
                <span className="material-icons-outlined text-[16px]">add</span>
                NEW INVOICE
              </button>
            </div>

            {loading ? (
              <div className="p-8 text-center text-stone animate-pulse">Loading billing logs...</div>
            ) : invoices.length === 0 ? (
              <div className="py-12 text-center text-stone">No invoice records logged.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-stone font-mono uppercase text-[10px] tracking-wider border-b pb-2">
                      <th className="pb-3 pl-2">Invoice #</th>
                      <th className="pb-3">Milestone Scope</th>
                      <th className="pb-3 text-right">Subtotal (₹)</th>
                      <th className="pb-3 text-right">Total (₹)</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3 pr-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-navy-lt/30">
                    {invoices.map(inv => (
                      <tr key={inv.id} className="hover:bg-navy-lt/20 transition-colors">
                        <td className="py-4 pl-2 font-mono text-white font-semibold">{inv.invoice_number}</td>
                        <td className="py-4 font-semibold text-white">
                          <span>{inv.milestone_label}</span>
                          <span className="text-[10px] text-stone block font-mono mt-0.5">Due: {inv.due_date}</span>
                        </td>
                        <td className="py-4 text-right font-mono text-stone">{inv.subtotal.toLocaleString()}</td>
                        <td className="py-4 text-right font-mono text-white font-bold">{inv.total.toLocaleString()}</td>
                        <td className="py-4">
                          <span className={`px-2 py-0.5 border text-[10px] font-semibold uppercase ${getInvoiceStatusStyle(inv.status)}`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="py-4 pr-2 text-right">
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => handleCollectPayment(inv)}
                              disabled={inv.status === 'paid' || payingInvoice === inv.id}
                              className="p-1 text-stone hover:text-white hover:bg-navy-lt transition disabled:opacity-40"
                              title={inv.status === 'paid' ? 'Already paid' : 'Collect payment online'}
                            >
                              <span className="material-icons-outlined text-[16px] text-blue">payments</span>
                            </button>
                            <button
                              onClick={() => {
                                const lines = [
                                  `Invoice ${inv.invoice_number}`,
                                  `Milestone: ${inv.milestone_label}`,
                                  `Due: ${inv.due_date}`,
                                  `Subtotal: ${inv.subtotal}`,
                                  `Total: ${inv.total}`,
                                  `Status: ${inv.status}`,
                                ]
                                const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
                                const url = URL.createObjectURL(blob)
                                const a = document.createElement('a')
                                a.href = url
                                a.download = `${inv.invoice_number || 'invoice'}.txt`
                                a.click()
                                URL.revokeObjectURL(url)
                              }}
                              className="p-1 text-stone hover:text-white hover:bg-navy-lt transition"
                              title="Download invoice summary"
                            >
                              <span className="material-icons-outlined text-[16px]">picture_as_pdf</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Project Expense Tracker */}
          <div className="card-5bloc space-y-4">
            <div className="border-b pb-3 flex justify-between items-center">
              <div>
                <h3 className="text-xs font-bold font-mono text-white uppercase tracking-wider">Project Expense Log</h3>
                <p className="text-[10px] text-stone mt-0.5 font-mono">Travel, prints, and municipal transaction audits.</p>
              </div>
              <span className="label-sm font-bold text-stone font-mono">EXPENSES: {expenses.length}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-stone font-mono uppercase text-[10px] tracking-wider border-b pb-2">
                    <th className="pb-3 pl-2">Date</th>
                    <th className="pb-3">Title</th>
                    <th className="pb-3">Category</th>
                    <th className="pb-3 text-right">Amount (₹)</th>
                    <th className="pb-3 pr-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-lt/30">
                  {expenses.map(exp => (
                    <tr key={exp.id} className="hover:bg-navy-lt/20 transition-colors">
                      <td className="py-2.5 pl-2 font-mono text-stone">{exp.date}</td>
                      <td className="py-2.5 font-semibold text-white">{exp.title}</td>
                      <td className="py-2.5 text-stone font-mono text-[10px]">{exp.category}</td>
                      <td className="py-2.5 text-right font-mono text-white font-bold">{exp.amount.toLocaleString()}</td>
                      <td className="py-2.5 pr-2 text-right">
                        <button
                          onClick={() => handleDeleteExpense(exp.id)}
                          className="p-1 text-stone hover:text-error transition"
                          title="Delete Expense"
                        >
                          <span className="material-icons-outlined text-[15px]">delete</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-navy/10 font-bold border-t">
                    <td colSpan={3} className="py-3 pl-2 font-mono text-stone text-[10px] uppercase">Total Logged Expenses</td>
                    <td className="py-3 text-right font-mono text-amber">₹{expenses.reduce((s, e) => s + e.amount, 0).toLocaleString()}</td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Quick Expense Form */}
            <form onSubmit={handleCreateExpense} className="pt-3 border-t border-navy-lt/60 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
              <div className="sm:col-span-2">
                <label className="block text-stone text-[9px] font-bold uppercase tracking-wider mb-1 font-mono">Expense Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Travel to client office"
                  value={newExpense.title}
                  onChange={e => setNewExpense(prev => ({ ...prev, title: e.target.value }))}
                  className="input-5bloc py-1.5 text-xs"
                />
              </div>
              <div>
                <label className="block text-stone text-[9px] font-bold uppercase tracking-wider mb-1 font-mono">Category</label>
                <select
                  value={newExpense.category}
                  onChange={e => setNewExpense(prev => ({ ...prev, category: e.target.value as Expense['category'] }))}
                  className="input-5bloc py-1.5 text-xs font-mono"
                >
                  <option value="Site Travel">Site Travel</option>
                  <option value="Printing/Plotting">Printing/Plotting</option>
                  <option value="Municipal/Permit Fees">Municipal Fees</option>
                  <option value="Consultant Fees">Consultant Fees</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-stone text-[9px] font-bold uppercase tracking-wider mb-1 font-mono">Amount (₹)</label>
                  <input
                    type="number"
                    required
                    placeholder="0"
                    value={newExpense.amount}
                    onChange={e => setNewExpense(prev => ({ ...prev, amount: e.target.value }))}
                    className="input-5bloc py-1.5 text-xs font-mono"
                  />
                </div>
                <button type="submit" className="btn-primary py-1.5 px-3 shrink-0" style={{ height: '32px' }} title="Log Expense">
                  <span className="material-icons-outlined text-[16px]">add</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Fee Calculator Card & Consultant Disbursements */}
        <div className="space-y-6">
          {/* Fee Calculator Card */}
          <div className="card-5bloc space-y-4">
            <div className="border-b pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold font-mono text-amber uppercase tracking-wider">Fee Calculator</h3>
                <p className="text-[10px] text-stone mt-0.5 font-mono">Project scale calculations per phase.</p>
              </div>
              <span className="material-icons-outlined text-stone text-[18px]">calculate</span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-stone text-[9px] font-bold uppercase tracking-wider mb-1 font-mono">Project Type</label>
                <select
                  value={calcType}
                  onChange={e => setCalcType(e.target.value)}
                  className="input-5bloc py-1 text-xs"
                >
                  <option value="residential">Residential Villa/Apts</option>
                  <option value="commercial">Commercial Office/Retail</option>
                  <option value="industrial">Industrial Warehouse/Factory</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone text-[9px] font-bold uppercase tracking-wider mb-1 font-mono">Size (Sq.Ft.)</label>
                  <input
                    type="number"
                    value={calcSize}
                    onChange={e => setCalcSize(parseInt(e.target.value) || 0)}
                    className="input-5bloc py-1 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-stone text-[9px] font-bold uppercase tracking-wider mb-1 font-mono">Rate (₹/Sq.Ft.)</label>
                  <input
                    type="number"
                    value={calcRate}
                    onChange={e => setCalcRate(parseInt(e.target.value) || 0)}
                    className="input-5bloc py-1 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="p-3 bg-navy/40 border text-xs">
                <span className="text-[9px] text-stone font-mono uppercase block">Estimated Base Architectural Fee</span>
                <span className="text-lg font-bold text-white font-mono">₹{totalCalc.toLocaleString()}</span>
              </div>

              {/* Phases break downs */}
              <div className="space-y-2 border-t border-navy-lt/60 pt-3">
                <span className="text-[9px] text-stone font-mono uppercase block font-semibold mb-1">Fee Allocation across 7 Phases:</span>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 text-[11px]">
                  {phases.map((ph, idx) => {
                    const phaseFee = Math.round(totalCalc * (ph.pct / 100))
                    return (
                      <div key={idx} className="flex justify-between border-b pb-1 border-navy-lt/30 last:border-b-0">
                        <span className="text-stone">{ph.name} ({ph.pct}%)</span>
                        <span className="font-mono text-white font-semibold">₹{phaseFee.toLocaleString()}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <button
                onClick={() => {
                  // Pre-fill modal floor layouts or milestone amount
                  setNewInvoice({
                    milestone_label: `Schematic Design Stage fee (calculated)`,
                    subtotal: Math.round(totalCalc * 0.15),
                    due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                  })
                  setShowCreateModal(true)
                }}
                className="w-full btn-secondary py-1.5 text-xs font-bold font-mono uppercase flex items-center justify-center gap-1.5"
              >
                <span className="material-icons-outlined text-[15px]">send_and_archive</span>
                GENERATE INVOICE FROM CALC
              </button>
            </div>
          </div>

          {/* Consultant Disbursements */}
          <div className="card-5bloc space-y-4">
            <div className="border-b pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold font-mono text-amber uppercase tracking-wider">Consultant Disbursements</h3>
                <p className="text-[10px] text-stone mt-0.5">Fees owed to MEP & structural engineers.</p>
              </div>
              <button
                type="button"
                className="btn-secondary text-[10px] py-1 px-2"
                onClick={async () => {
                  const name = prompt('Consultant name')
                  if (!name) return
                  const amountStr = prompt('Amount (INR)', '50000')
                  const amount = Number(amountStr)
                  if (!Number.isFinite(amount)) return
                  const res = await fetch(`/api/projects/${projectId}/consultant-payments`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      consultant_name: name,
                      discipline: 'Structural',
                      milestone_phase: 'Design Development',
                      amount,
                      status: 'pending',
                    }),
                  })
                  const data = await res.json()
                  if (!res.ok) {
                    alert(data.error || 'Failed to add')
                    return
                  }
                  setConsultantPayments((prev) => [
                    {
                      id: data.payment.id,
                      consultant_name: data.payment.consultant_name,
                      discipline: data.payment.discipline,
                      milestone_phase: data.payment.milestone_phase || '',
                      amount: Number(data.payment.amount || 0),
                      status: data.payment.status,
                      due_date: data.payment.due_date || '',
                    },
                    ...prev,
                  ])
                }}
              >
                Add payout
              </button>
            </div>

            {loading ? (
              <div className="p-8 text-center text-stone animate-pulse">Loading payout records...</div>
            ) : consultantPayments.length === 0 ? (
              <div className="py-12 text-center text-stone">No consultant payouts recorded.</div>
            ) : (
              <div className="space-y-4">
                {consultantPayments.map(p => (
                  <div key={p.id} className="p-3 bg-navy/40 border space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-xs font-bold text-white">{p.consultant_name}</h4>
                        <p className="text-[10px] text-stone font-mono">{p.discipline} Consultant</p>
                      </div>
                      <span className={`px-2 py-0.5 border text-[9px] font-mono font-semibold uppercase ${getPaymentStatusStyle(p.status)}`}>
                        {p.status}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-navy-lt/60 flex justify-between items-center text-xs">
                      <div>
                        <span className="text-[9px] text-stone font-mono uppercase block">Milestone Phase</span>
                        <span className="text-white font-semibold">{p.milestone_phase}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] text-stone font-mono uppercase block">Fee Amount</span>
                        <span className="text-amber font-bold font-mono">₹{p.amount.toLocaleString()}</span>
                      </div>
                    </div>

                    {p.status !== 'paid' ? (
                      <button
                        onClick={() => handleMarkPaymentPaid(p.id)}
                        className="w-full btn-secondary py-1 text-[11px] font-bold"
                      >
                        MARK PAID & RELEASE
                      </button>
                    ) : (
                      <div className="text-[10px] text-stone font-mono italic text-center py-1 bg-navy/25">
                        Paid on: {p.paid_date}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Invoice Creator Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-navy/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md bg-navy-mid border p-6 space-y-4">
            <div className="border-b pb-3 flex justify-between items-center">
              <h3 className="text-xs font-bold font-mono text-amber uppercase tracking-wider">Generate Fee Invoice</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-stone hover:text-white transition">
                <span className="material-icons-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-4">
              <div>
                <label className="block text-stone text-[10px] font-bold uppercase tracking-wider mb-1 font-mono">Milestone Scope Label *</label>
                <input
                  type="text"
                  required
                  value={newInvoice.milestone_label}
                  onChange={e => setNewInvoice(prev => ({ ...prev, milestone_label: e.target.value }))}
                  className="input-5bloc py-1.5 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-stone text-[10px] font-bold uppercase tracking-wider mb-1.5 font-mono">Subtotal Fee (₹) *</label>
                  <input
                    type="number"
                    required
                    value={newInvoice.subtotal}
                    onChange={e => setNewInvoice(prev => ({ ...prev, subtotal: parseInt(e.target.value) || 0 }))}
                    className="input-5bloc py-1.5 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-stone text-[10px] font-bold uppercase tracking-wider mb-1.5 font-mono">Invoice Due Date</label>
                  <input
                    type="date"
                    value={newInvoice.due_date}
                    onChange={e => setNewInvoice(prev => ({ ...prev, due_date: e.target.value }))}
                    className="input-5bloc py-1.5 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="p-3 bg-navy border text-xs space-y-1 text-stone">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-mono text-white">₹{newInvoice.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>CGST (9%):</span>
                  <span className="font-mono text-white">₹{Math.round(newInvoice.subtotal * 0.09).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>SGST (9%):</span>
                  <span className="font-mono text-white">₹{Math.round(newInvoice.subtotal * 0.09).toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-navy-lt/60 font-semibold">
                  <span className="text-white">Gross Invoice Total (18% GST):</span>
                  <span className="font-mono text-amber">
                    ₹{Math.round(newInvoice.subtotal * 1.18).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t flex justify-end gap-3">
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary py-1.5 px-4 text-xs">
                  Cancel
                </button>
                <button type="submit" className="btn-primary py-1.5 px-6 text-xs font-bold">
                  Generate Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

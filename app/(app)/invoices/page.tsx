'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useToast } from '@/components/ui/Toast'
import { supabaseClient } from '@/lib/supabase/client'
import { hasSupabaseEnv } from '@/lib/data/client-data'

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
 const { toast } = useToast()

 useEffect(() => {
 let cancelled = false
 async function load() {
 try {
 if (hasSupabaseEnv()) {
 const { data, error } = await supabaseClient
 .from('invoices')
 .select('*, projects(name)')
 .order('created_at', { ascending: false })
 if (!error && data && data.length > 0) {
 if (!cancelled) {
 setInvoices(data.map((inv) => ({
 id: inv.id,
 invoice_number: inv.invoice_number,
 client_name: inv.client_name,
 project_name: (inv as { projects?: { name?: string } | null }).projects?.name ?? '—',
 subtotal: Number(inv.amount ?? 0),
 total: Number(inv.amount ?? 0),
 status: (['draft','sent','paid','overdue','cancelled'].includes(inv.status) ? inv.status : 'draft') as Invoice['status'],
 due_date: inv.due_date ?? '',
 })))
 setLoading(false)
 }
 return
 }
 }
 } catch (e) { console.warn('Invoices Supabase fallback:', e) }
 if (!cancelled) {
 setInvoices([
 { id: 'inv-1', invoice_number: 'INV-001', client_name: 'Parth Patel', project_name: 'Wadhwa Prime Plaza', subtotal: 350000, total: 413000, status: 'paid', due_date: '2026-02-15', paid_at: '2026-02-12' },
 { id: 'inv-2', invoice_number: 'INV-002', client_name: 'Wadhwa Developers', project_name: 'Wadhwa Prime Plaza', subtotal: 1200000, total: 1416000, status: 'sent', due_date: '2026-06-25' },
 { id: 'inv-3', invoice_number: 'INV-003', client_name: 'Karan Shah', project_name: 'Lodha Signature Residences', subtotal: 585000, total: 690300, status: 'overdue', due_date: '2026-05-30' },
 ])
 setLoading(false)
 }
 }
 load()
 return () => { cancelled = true }
 }, [])

 const getStatusStyle = (status: Invoice['status']): React.CSSProperties => {
 switch (status) {
   case 'draft':     return { background: 'rgba(159,142,122,.10)', color: 'var(--stone)'   }
   case 'sent':      return { background: 'rgba(122,184,255,.12)', color: 'var(--blue)'    }
   case 'paid':      return { background: 'rgba(111,220,140,.12)', color: 'var(--success)' }
   case 'overdue':   return { background: 'rgba(255,180,171,.12)', color: 'var(--error)'   }
   case 'cancelled': return { background: 'rgba(159,142,122,.10)', color: 'var(--stone)'   }
   default:          return {}
 }
}

 const handleMarkPaid = async (invId: string) => {
 setInvoices(prev => 
 prev.map(i => i.id === invId ? { ...i, status: 'paid', paid_at: new Date().toISOString().split('T')[0] } : i)
 )
 toast('Invoice marked as paid', 'success')
 try {
 if (hasSupabaseEnv() && !invId.startsWith('inv-')) {
 await supabaseClient.from('invoices').update({ status: 'paid' }).eq('id', invId)
 }
 } catch (e) { console.warn('Invoice update skipped:', e) }
 }

 // Stats
 const paidThisMonth = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total, 0)
 const outstanding = invoices.filter(i => i.status === 'sent' || i.status === 'overdue').reduce((sum, i) => sum + i.total, 0)
 const overdueCount = invoices.filter(i => i.status === 'overdue').length

 return (
 <div className="p-6 space-y-6 font-body select-none max-w-7xl mx-auto">
 {/* Header */}
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-2xl font-bold tracking-wide">Invoices Registry</h1>
 <p className="text-xs text-stone mt-1">Manage project billing, calculate CGST/SGST/IGST taxes, and track collections.</p>
 </div>
 <Link href="/invoices/new" className="btn-primary">
 <span className="material-icons-outlined text-[18px]">add</span>
 CREATE NEW INVOICE
 </Link>
 </div>

 {/* Stats row widget */}
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
 {[
 { label: 'Collected Fees', value: `₹${paidThisMonth.toLocaleString()}`, trend: 'This month (GST incl.)', color: 'text-success' },
 { label: 'Outstanding Fees', value: `₹${outstanding.toLocaleString()}`, trend: 'Awaiting client release', color: 'text-blue' },
 { label: 'Overdue Invoices', value: overdueCount, trend: 'Requires follow up', color: 'text-error' },
 ].map((stat, idx) => (
 <div key={idx} className="card-5bloc p-4">
 <span className="text-[10px] text-stone font-mono uppercase tracking-wider">{stat.label}</span>
 <h4 className={`text-xl font-bold mt-1 ${stat.color}`}>{stat.value}</h4>
 <p className="text-[10px] text-stone mt-1 font-mono">{stat.trend}</p>
 </div>
 ))}
 </div>

 {/* Main Invoices list log table */}
 <div className="card-5bloc flex flex-col justify-between">
 <div className="flex items-center justify-between pb-4 ">
 <div>
 <h3 className="text-sm font-bold uppercase text-white font-mono">Invoice Records</h3>
 <p className="text-[11px] text-stone mt-0.5">Automated billing numbers generated server-side. Click rows to inspect.</p>
 </div>
 </div>

 {loading ? (
 <div className="p-8 text-center text-stone animate-pulse">Loading invoices directory...</div>
 ) : invoices.length === 0 ? (
 <div className="py-16 text-center text-stone flex flex-col items-center">
 <span className="material-icons-outlined text-[48px] text-stone/30 mb-3">receipt_long</span>
 <h4 className="text-sm font-bold text-white">No invoice records logged</h4>
 <p className="text-xs max-w-xs mt-1">Generate your first fee invoice to release project milestone payments.</p>
 </div>
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
 onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-container-high)' }}
 onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '' }}
 >
 <td className="py-4 pl-3 font-mono text-[10px] text-white font-semibold">{inv.invoice_number}</td>
 <td className="py-4 font-semibold" style={{ color: 'var(--on-surface)', maxWidth: '220px' }}><span className="line-clamp-1">{inv.project_name}</span></td>
 <td className="py-4 text-stone">{inv.client_name}</td>
 <td className="py-4 text-right font-mono text-stone">{inv.subtotal.toLocaleString()}</td>
 <td className="py-4 text-right font-mono font-semibold text-white">{inv.total.toLocaleString()}</td>
 <td className="py-4">
 <span className="chip" style={getStatusStyle(inv.status)}>
   {inv.status.replace(/_/g, ' ').toUpperCase()}
 </span>
 </td>
 <td className="py-4 font-mono text-[10px] text-stone">{inv.due_date}</td>
 <td className="py-4 pr-2 text-right">
 <div className="flex items-center justify-end gap-2">
 {inv.status !== 'paid' && (
 <button
 onClick={() => handleMarkPaid(inv.id)}
 className="p-1 text-stone hover:text-success hover:bg-navy-lt transition"
 title="Mark Paid manually"
 >
 <span className="material-icons-outlined text-[16px]">check_circle</span>
 </button>
 )}
 <button
 onClick={() => toast(`PDF export for ${inv.invoice_number} — connect Cloudflare R2 to enable.`, 'info')}
 className="p-1 text-stone hover:text-white hover:bg-navy-lt transition"
 title="Download PDF Invoice"
 >
 <span className="material-icons-outlined text-[16px]">picture_as_pdf</span>
 </button>
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


'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Logo } from '@/components/brand/LogoMark'

interface DocumentItem {
 id: string
 name: string
 extension: string
 version: number
 approval_status: 'pending' | 'approved' | 'rejected' | 'revision_requested'
}

interface PaymentMilestone {
 phase: string
 label: string
 amount: number
 completed: boolean
 paid: boolean
}

export default function ClientPortal() {
 const params = useParams()
 const token = params.token as string

 const [loading, setLoading] = useState(true)
 const [project, setProject] = useState({
 name: 'Wadhwa Prime Plaza',
 city: 'Mumbai',
 firmName: 'Apex Architects',
 phase: 'construction_docs',
 status: 'In progress',
 lastUpdate: 'Slab reinforcement details for Grid B-4 columns were reviewed and resolved on June 5, 2026.',
 })

 const [docs, setDocs] = useState<DocumentItem[]>([])
 const [payments, setPayments] = useState<PaymentMilestone[]>([])
 const [question, setQuestion] = useState('')
 const [questionSent, setQuestionSent] = useState(false)

 useEffect(() => {
 // Mock load client portal data based on token
 const timer = setTimeout(() => {
 setDocs([
 { id: 'doc-1', name: 'Site Layout Plan v3', extension: 'pdf', version: 3, approval_status: 'approved' },
 { id: 'doc-2', name: 'Reception Lobby 3D render design', extension: 'png', version: 1, approval_status: 'pending' },
 { id: 'doc-3', name: 'Electrical conduits layout sheets', extension: 'pdf', version: 1, approval_status: 'pending' }
 ])

 setPayments([
 { phase: 'pre_design', label: 'Initial Brief & Site Analysis', amount: 350000, completed: true, paid: true },
 { phase: 'design_development', label: 'Schematic Floor layouts approval', amount: 1200000, completed: true, paid: true },
 { phase: 'construction_docs', label: 'Detailed BOQ & Structural release', amount: 2500000, completed: true, paid: false },
 { phase: 'permits', label: 'Municipal Sanction NOC clear', amount: 1200000, completed: false, paid: false },
 ])
 setLoading(false)
 }, 400)
 return () => clearTimeout(timer)
 }, [token])

 const handleDocApproval = (docId: string, status: DocumentItem['approval_status']) => {
 setDocs(prev => 
 prev.map(d => d.id === docId ? { ...d, approval_status: status } : d)
 )
 alert(`Document status updated to ${status} (simulated)`)
 }

 const handlePay = (milestoneLabel: string, amount: number) => {
 alert(`Razorpay checkout opened for ${milestoneLabel} (Amount: ₹${amount.toLocaleString()})`)
 }

 const handleAskQuestion = (e: React.FormEvent) => {
 e.preventDefault()
 if (!question) return
 setQuestionSent(true)
 setTimeout(() => {
 setQuestion('')
 setQuestionSent(false)
 alert('Your question has been sent to the architect.')
 }, 1500)
 }

 if (loading) {
 return (
 <div className="min-h-screen bg-[#F7F5F0] text-navy flex items-center justify-center font-body">
 <span className="material-icons-outlined animate-spin mr-2">sync</span> Loading portal workspace...
 </div>
 )
 }

 return (
 <div className="min-h-screen bg-[#F7F5F0] text-navy font-body flex flex-col justify-between pb-12 select-none">
 
 {/* Light-theme Header */}
 <header className="bg-white border-b border-[#EDE9E2] px-6 py-4">
 <div className="max-w-5xl mx-auto flex items-center justify-between">
 <div className="flex items-center gap-3">
 {/* Custom dark logo on light background */}
 <svg width={32} height={32} viewBox="0 0 40 40" fill="none">
 <rect x="6" y="6" width="28" height="6" rx="1.5" fill="#0C1220"/>
 <rect x="6" y="15" width="22" height="6" rx="1.5" fill="#0C1220" opacity="0.75"/>
 <rect x="6" y="24" width="16" height="6" rx="1.5" fill="#0C1220" opacity="0.5"/>
 <rect x="6" y="33" width="10" height="5" rx="1.5" fill="#0C1220" opacity="0.28"/>
 </svg>
 <div className="line-height-1">
 <div className="font-display text-lg text-navy tracking-wider">5BLOC</div>
 <div className="text-[11px] text-stone font-medium">Client Portal</div>
 </div>
 </div>

 <div className="text-right">
 <span className="text-xs text-stone font-medium">Architect firm:</span>
 <h4 className="text-xs font-bold text-navy">{project.firmName}</h4>
 </div>
 </div>
 </header>

 {/* Main content Area */}
 <main className="max-w-5xl w-full mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start flex-grow">
 
 {/* Left column details (Col Span 2) */}
 <div className="lg:col-span-2 space-y-6">
 
 {/* Welcome status block */}
 <div className="bg-white border border-[#EDE9E2] rounded-lg p-6 shadow-none space-y-3">
 <div className="flex items-center justify-between border-b border-[#EDE9E2] pb-3">
 <div>
 <h1 className="text-lg font-bold text-navy">{project.name}</h1>
 <p className="text-xs text-stone font-medium">Site: {project.city}</p>
 </div>
 <span className="bg-blue/10 text-blue border text-xs font-medium px-3 py-1 rounded-md">
 {project.status}
 </span>
 </div>

 <div>
 <span className="text-xs text-stone font-medium">Latest Milestone Update</span>
 <p className="text-xs text-navy leading-relaxed mt-1">{project.lastUpdate}</p>
 </div>
 </div>

 {/* Design Approvals section */}
 <div className="bg-white border border-[#EDE9E2] rounded-lg p-6 shadow-none space-y-4">
 <h3 className="text-xs font-semibold text-stone border-b border-[#EDE9E2] pb-2.5">Design & Layout Approvals</h3>
 
 <div className="space-y-3">
 {docs.map(doc => (
 <div key={doc.id} className="p-3.5 bg-[#F7F5F0]/60 border border-[#EDE9E2] rounded-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
 <div className="flex items-center gap-2">
 <span className="material-icons-outlined text-stone text-[22px]">
 {doc.extension === 'pdf' ? 'picture_as_pdf' : 'image'}
 </span>
 <div>
 <h4 className="text-xs font-bold text-navy truncate max-w-[200px]">{doc.name}</h4>
 <p className="text-[11px] text-stone">Format: .{doc.extension.toLowerCase()} (v{doc.version})</p>
 </div>
 </div>

 {/* Actions buttons */}
 <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
 {doc.approval_status === 'pending' ? (
 <>
 <button
 onClick={() => handleDocApproval(doc.id, 'revision_requested')}
 className="bg-transparent border border-[#EDE9E2] text-error hover:bg-error/5 text-xs font-medium py-1.5 px-3 rounded-md transition"
 >
 Request Revision
 </button>
 <button
 onClick={() => handleDocApproval(doc.id, 'approved')}
 className="bg-navy hover:bg-navy-mid text-white text-xs font-medium py-1.5 px-4 rounded-md transition"
 >
 Approve
 </button>
 </>
 ) : (
 <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-medium border capitalize ${
 doc.approval_status === 'approved' 
 ? 'bg-success/10 text-success ' 
 : 'bg-error/10 text-error '
 }`}>
 {doc.approval_status}
 </span>
 )}
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>

 {/* Right column details (Col Span 1) */}
 <div className="space-y-6">
 
 {/* Payment Schedule */}
 <div className="bg-white border border-[#EDE9E2] rounded-lg p-6 shadow-none space-y-4">
 <h3 className="text-xs font-semibold text-stone border-b border-[#EDE9E2] pb-2.5">Milestone Payments</h3>
 
 <div className="space-y-4">
 {payments.map((p, idx) => (
 <div key={idx} className="flex justify-between items-start gap-3 border-b border-[#F7F5F0] pb-3 last:border-b-0 last:pb-0">
 <div className="space-y-1">
 <span className="text-[11px] text-stone block font-medium">Milestone {idx + 1}</span>
 <h4 className="text-xs font-semibold text-navy leading-tight">{p.label}</h4>
 <p className="text-xs text-stone">₹{p.amount.toLocaleString()}</p>
 </div>
 
 <div className="shrink-0 pt-0.5">
 {p.paid ? (
 <span className="text-[11px] font-medium text-success border bg-success/10 px-2 py-0.5 rounded-md capitalize">
 Paid
 </span>
 ) : p.completed ? (
 <button
 onClick={() => handlePay(p.label, p.amount)}
 className="bg-[#F5A623] hover:bg-[#FFB94A] text-navy text-xs font-medium py-1.5 px-3 rounded-md transition"
 >
 Pay online
 </button>
 ) : (
 <span className="text-[11px] text-stone border border-[#EDE9E2] px-2 py-0.5 rounded-md capitalize">
 Pending
 </span>
 )}
 </div>
 </div>
 ))}
 </div>
 </div>

 {/* Ask question form */}
 <div className="bg-white border border-[#EDE9E2] rounded-lg p-6 shadow-none space-y-4">
 <h3 className="text-xs font-semibold text-stone border-b border-[#EDE9E2] pb-2.5">Ask a Question</h3>
 
 <form onSubmit={handleAskQuestion} className="space-y-3">
 <p className="text-[11px] text-stone leading-relaxed">
 Need details regarding drawing releases or construction progress? Submit queries directly to your architect inbox.
 </p>
 
 <textarea
 required
 rows={3}
 value={question}
 onChange={(e) => setQuestion(e.target.value)}
 placeholder="Ask your question here..."
 className="w-full bg-[#F7F5F0] border border-[#EDE9E2] text-xs text-navy p-2.5 rounded-md focus:outline-none focus:border-navy resize-none"
 />

 <button
 type="submit"
 disabled={questionSent}
 className="w-full bg-navy hover:bg-navy-mid text-white font-semibold py-2 text-xs rounded-md transition"
 >
 {questionSent ? 'Sending...' : 'Send question'}
 </button>
 </form>
 </div>

 </div>

 </main>

 </div>
 )
}

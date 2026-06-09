'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

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

interface Tender {
  id: string
  title: string
  city: string
  budget: string
  specialism: string
  deadline: string
}

interface SiteUpdate {
  id: string
  date: string
  title: string
  description: string
  inspector: string
  hasPhoto: boolean
}

export default function ClientPortal() {
  const params = useParams()
  const token = params.token as string

  const [loading, setLoading] = useState(true)
  const [activeRole, setActiveRole] = useState<'client' | 'builder' | 'contractor' | 'consultant'>('client')
  
  const [project] = useState({
    name: 'Wadhwa Prime Plaza',
    city: 'Mumbai',
    firmName: 'Apex Architects',
    phase: 'construction_docs',
    status: 'In progress',
    lastUpdate: 'Slab reinforcement details for Grid B-4 columns were reviewed and resolved on June 5, 2026.',
  })

  // State lists
  const [docs, setDocs] = useState<DocumentItem[]>([])
  const [payments, setPayments] = useState<PaymentMilestone[]>([])
  const [tenders, setTenders] = useState<Tender[]>([])
  
  // Site Updates list
  const [siteUpdates] = useState<SiteUpdate[]>([
    {
      id: 'su-1',
      date: 'June 5, 2026',
      title: 'Lobby Slab Cast Inspection',
      description: 'Lobby slab reinforcement layout and covers approved. Concrete hydration logs check completed. Casting cleared for next floor column starters.',
      inspector: 'Aritro Roy (Structural Engineer)',
      hasPhoto: true,
    },
    {
      id: 'su-2',
      date: 'May 24, 2026',
      title: 'Excavation Level Depth Audit',
      description: 'Basement retaining wall level checked. Ground water pumping channels aligned. Excavation dimensions audit passed.',
      inspector: 'Amit Sharma (Civil Consultant)',
      hasPhoto: true,
    },
    {
      id: 'su-3',
      date: 'May 12, 2026',
      title: 'Initial Foundation Layout Marker Check',
      description: 'Footing marking layout matched with structural CAD sheets v2. Grid lines alignment verified.',
      inspector: 'Apex Survey Team',
      hasPhoto: false,
    }
  ])
  
  // Forms states
  const [question, setQuestion] = useState('')
  const [questionSent, setQuestionSent] = useState(false)
  
  // Recommend vendor form state
  const [vendorForm, setVendorForm] = useState({ name: '', spec: 'Civil', email: '', note: '' })
  
  // Builder Approval Queue state
  const [approvalQueue, setApprovalQueue] = useState<{ id: string; type: string; item: string; details: string; status: string }[]>([])

  useEffect(() => {
    // Mock load data based on token
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

      setTenders([
        { id: 't-1', title: 'Main Lobby Structural Grouting & Masonry', city: 'Mumbai', budget: '₹14 Lakhs', specialism: 'Civil', deadline: '2026-06-25' },
        { id: 't-2', title: 'High-Tension Sub-station Transformer Installation', city: 'Mumbai', budget: '₹42 Lakhs', specialism: 'Electrical', deadline: '2026-07-10' },
        { id: 't-3', title: 'Double-glazed Unit Curtain Wall Facade structural fitments', city: 'Pune', budget: '₹28 Lakhs', specialism: 'Facade', deadline: '2026-06-30' }
      ])

      setApprovalQueue([
        { id: 'q-1', type: 'drawing', item: 'Reception Lobby 3D render design', details: 'Render package showcasing layout and finishes v1', status: 'pending' },
        { id: 'q-2', type: 'material', item: 'Lobby flooring Italian Marble sample', details: '30mm polished beige marble sample tile specifications', status: 'pending' },
        { id: 'q-3', type: 'invoice', item: 'Milestone payment #3 - Construction Docs', details: 'Architect fee claim for CD stage release (₹2,500,000)', status: 'pending' }
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

  const handleQueueApproval = (qId: string, action: 'approved' | 'rejected') => {
    setApprovalQueue(prev => prev.filter(q => q.id !== qId))
    alert(`Item ${action === 'approved' ? 'approved and signed off' : 'returned for revisions'} (simulated)`)
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
    }, 1200)
  }

  const handleRecommendVendor = (e: React.FormEvent) => {
    e.preventDefault()
    if (!vendorForm.name) return
    alert(`Recommendation submitted! Invited ${vendorForm.name} (${vendorForm.spec}) via email.`)
    setVendorForm({ name: '', spec: 'Civil', email: '', note: '' })
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
      <header className="bg-white border-b border-[#EDE9E2] px-6 py-4 space-y-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <svg width={32} height={32} viewBox="0 0 40 40" fill="none">
              <rect x="6" y="6" width="28" height="6" rx="1.5" fill="#0C1220"/>
              <rect x="6" y="15" width="22" height="6" rx="1.5" fill="#0C1220" opacity="0.75"/>
              <rect x="6" y="24" width="16" height="6" rx="1.5" fill="#0C1220" opacity="0.5"/>
              <rect x="6" y="33" width="10" height="5" rx="1.5" fill="#0C1220" opacity="0.28"/>
            </svg>
            <div className="line-height-1">
              <div className="font-display text-lg text-navy tracking-wider">5BLOC</div>
              <div className="text-[11px] text-stone font-medium">Collaborator Workspace Portal</div>
            </div>
          </div>

          <div className="text-center sm:text-right">
            <span className="text-xs text-stone font-medium">Project: <span className="text-navy font-bold">{project.name}</span></span>
            <h4 className="text-[11px] font-semibold text-stone">Architect: {project.firmName}</h4>
          </div>
        </div>

        {/* Role Switcher Toolbar */}
        <div className="max-w-5xl mx-auto border-t border-[#EDE9E2] pt-3 flex flex-wrap gap-2 justify-center items-center">
          <span className="text-[11px] text-stone font-mono uppercase tracking-wider mr-2">Switch Workspace:</span>
          {(['client', 'builder', 'contractor', 'consultant'] as const).map(role => (
            <button
              key={role}
              onClick={() => setActiveRole(role)}
              className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wide border transition-all ${
                activeRole === role 
                  ? 'bg-navy text-white border-navy font-bold shadow-sm' 
                  : 'bg-white text-stone border-[#EDE9E2] hover:text-navy'
              }`}
              style={{ borderRadius: '0px' }}
            >
              {role} portal
            </button>
          ))}
        </div>
      </header>

      {/* Main content Area */}
      <main className="max-w-5xl w-full mx-auto px-6 py-8 flex-grow">
        
        {/* ── CLIENT PORTAL UI ── */}
        {activeRole === 'client' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 space-y-6">
              {/* Welcome block */}
              <div className="bg-white border border-[#EDE9E2] rounded-lg p-6 space-y-3">
                <div className="flex items-center justify-between border-b border-[#EDE9E2] pb-3">
                  <div>
                    <h1 className="text-lg font-bold text-navy">Client Dashboard</h1>
                    <p className="text-xs text-stone font-medium">Site: {project.city}</p>
                  </div>
                  <span className="bg-blue/10 text-blue border text-xs font-medium px-3 py-1 rounded-md">
                    {project.status}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-stone font-mono uppercase block font-semibold">Latest Update</span>
                  <p className="text-xs text-navy leading-relaxed mt-1">{project.lastUpdate}</p>
                </div>
              </div>

              {/* Site Updates Feed (Teal feature) */}
              <div className="bg-white border border-[#EDE9E2] rounded-lg p-6 space-y-4">
                <div className="border-b border-[#EDE9E2] pb-2.5 flex justify-between items-center">
                  <div>
                    <h3 className="text-xs font-bold text-stone uppercase tracking-wide">Site & Field Updates Feed</h3>
                    <p className="text-[11px] text-stone mt-0.5 font-mono">Timeline of site inspections, approvals, and photos logged.</p>
                  </div>
                  <span className="material-icons-outlined text-stone text-[18px]">timeline</span>
                </div>

                <div className="relative border-l-2 border-[#EDE9E2] ml-2 pl-6 space-y-6 py-2">
                  {siteUpdates.map(update => (
                    <div key={update.id} className="relative space-y-1.5">
                      {/* Timeline dot */}
                      <span className="absolute -left-[31px] top-1 bg-white border-2 border-navy w-3.5 h-3.5 rounded-full" />
                      
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <span className="text-[10px] text-stone font-mono font-bold">{update.date}</span>
                        <span className="text-[10px] bg-[#EDE9E2] text-navy font-mono px-2 py-0.5 self-start">
                          Inspector: {update.inspector}
                        </span>
                      </div>
                      
                      <h4 className="text-xs font-bold text-navy">{update.title}</h4>
                      <p className="text-xs text-stone leading-relaxed">{update.description}</p>
                      
                      {update.hasPhoto && (
                        <div className="mt-2.5 inline-flex items-center gap-1.5 p-2 bg-[#F7F5F0] border border-[#EDE9E2] rounded text-[11px] text-navy font-medium">
                          <span className="material-icons-outlined text-[16px] text-stone">photo_camera</span>
                          <span>Blueprint & site-photo-logs.jpg attached</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Approvals */}
              <div className="bg-white border border-[#EDE9E2] rounded-lg p-6 space-y-4">
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
                            doc.approval_status === 'approved' ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
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

            <div className="space-y-6">
              {/* Payment Schedule */}
              <div className="bg-white border border-[#EDE9E2] rounded-lg p-6 space-y-4">
                <h3 className="text-xs font-semibold text-stone border-b border-[#EDE9E2] pb-2.5">Milestone Payments</h3>
                <div className="space-y-4">
                  {payments.map((p, idx) => (
                    <div key={idx} className="flex justify-between items-start gap-3 border-b border-[#F7F5F0] pb-3 last:border-b-0 last:pb-0">
                      <div className="space-y-1">
                        <span className="text-[10px] text-stone block font-medium">Milestone {idx + 1}</span>
                        <h4 className="text-xs font-semibold text-navy leading-tight">{p.label}</h4>
                        <p className="text-xs text-stone">₹{p.amount.toLocaleString()}</p>
                      </div>
                      <div className="shrink-0 pt-0.5">
                        {p.paid ? (
                          <span className="text-[11px] font-medium text-success border bg-success/10 px-2 py-0.5 rounded-md">Paid</span>
                        ) : p.completed ? (
                          <button
                            onClick={() => handlePay(p.label, p.amount)}
                            className="bg-[#F5A623] hover:bg-[#FFB94A] text-navy text-xs font-medium py-1.5 px-3 rounded-md transition"
                          >
                            Pay online
                          </button>
                        ) : (
                          <span className="text-[11px] text-stone border border-[#EDE9E2] px-2 py-0.5 rounded-md">Pending</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ask question */}
              <div className="bg-white border border-[#EDE9E2] rounded-lg p-6 space-y-4">
                <h3 className="text-xs font-semibold text-stone border-b border-[#EDE9E2] pb-2.5">Ask a Question</h3>
                <form onSubmit={handleAskQuestion} className="space-y-3">
                  <textarea
                    required
                    rows={3}
                    value={question}
                    onChange={e => setQuestion(e.target.value)}
                    placeholder="Ask details regarding progress..."
                    className="w-full bg-[#F7F5F0] border border-[#EDE9E2] text-xs text-navy p-2.5 rounded-md focus:outline-none resize-none"
                  />
                  <button type="submit" disabled={questionSent} className="w-full bg-navy hover:bg-navy-mid text-white font-semibold py-2 text-xs rounded-md">
                    {questionSent ? 'Sending...' : 'Send Question'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* ── BUILDER / DEVELOPER PORTAL UI ── */}
        {activeRole === 'builder' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 space-y-6">
              {/* Approval Queue Section (Green feature) */}
              <div className="bg-white border border-[#EDE9E2] rounded-lg p-6 space-y-4">
                <div className="border-b border-[#EDE9E2] pb-3">
                  <h2 className="text-sm font-bold font-mono text-navy uppercase tracking-wider">Builder Pending Approvals Queue</h2>
                  <p className="text-xs text-stone mt-0.5">Approve drawings, variations, materials, and phase fee claims.</p>
                </div>

                {approvalQueue.length === 0 ? (
                  <div className="py-8 text-center text-stone text-xs">All items are approved and processed.</div>
                ) : (
                  <div className="space-y-3">
                    {approvalQueue.map(item => (
                      <div key={item.id} className="p-4 bg-[#F7F5F0]/60 border border-[#EDE9E2] rounded flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-[10px] font-mono text-stone uppercase">
                            <span className="material-icons-outlined text-[13px]">{
                              item.type === 'drawing' ? 'architecture' : item.type === 'material' ? 'palette' : 'receipt_long'
                            }</span>
                            <span>{item.type}</span>
                          </div>
                          <h4 className="text-xs font-bold text-navy">{item.item}</h4>
                          <p className="text-[11px] text-stone leading-relaxed">{item.details}</p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button
                            onClick={() => handleQueueApproval(item.id, 'rejected')}
                            className="bg-transparent border border-[#EDE9E2] text-error hover:bg-error/5 text-xs font-medium py-1.5 px-3 rounded transition"
                          >
                            REVISE
                          </button>
                          <button
                            onClick={() => handleQueueApproval(item.id, 'approved')}
                            className="bg-navy hover:bg-navy-mid text-white text-xs font-semibold py-1.5 px-4 rounded transition"
                          >
                            APPROVE
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Progress overview */}
              <div className="bg-white border border-[#EDE9E2] rounded-lg p-6 space-y-4">
                <h3 className="text-xs font-semibold text-stone border-b border-[#EDE9E2] pb-2">Multi-Project Pipeline Progress</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span>Wadhwa Prime Plaza (Commercial)</span>
                      <span>54% complete</span>
                    </div>
                    <div className="w-full bg-[#F7F5F0] h-2 border rounded-full overflow-hidden">
                      <div className="bg-amber h-full" style={{ width: '54%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span>Lodha Signature Residences (Residential)</span>
                      <span>85% complete</span>
                    </div>
                    <div className="w-full bg-[#F7F5F0] h-2 border rounded-full overflow-hidden">
                      <div className="bg-success h-full" style={{ width: '85%' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Recommend Vendor form (Green feature) */}
              <div className="bg-white border border-[#EDE9E2] rounded-lg p-6 space-y-4">
                <h3 className="text-xs font-semibold text-stone border-b border-[#EDE9E2] pb-2.5">Recommend Trusted Vendor</h3>
                <p className="text-[11px] text-stone leading-relaxed">
                  Uncle's Objection Answered: Recommend trusted contractors/subcontractors directly to the architect project team.
                </p>
                <form onSubmit={handleRecommendVendor} className="space-y-3">
                  <div>
                    <label className="block text-[10px] text-stone font-mono uppercase mb-1">Vendor/Contractor Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rajesh Glass Works"
                      value={vendorForm.name}
                      onChange={e => setVendorForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-[#F7F5F0] border border-[#EDE9E2] text-xs p-2 rounded-md focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-stone font-mono uppercase mb-1">Specialism Specialty</label>
                    <select
                      value={vendorForm.spec}
                      onChange={e => setVendorForm(prev => ({ ...prev, spec: e.target.value }))}
                      className="w-full bg-[#F7F5F0] border border-[#EDE9E2] text-xs p-2 rounded-md focus:outline-none"
                    >
                      <option value="Civil">Civil / Foundation</option>
                      <option value="MEP">MEP (HVAC/Drainage)</option>
                      <option value="Facade">Facade (Glass/Aluminium)</option>
                      <option value="Interior">Interior Decoration</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-stone font-mono uppercase mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="vendor@company.com"
                      value={vendorForm.email}
                      onChange={e => setVendorForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full bg-[#F7F5F0] border border-[#EDE9E2] text-xs p-2 rounded-md focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-stone font-mono uppercase mb-1">Recommendation Note</label>
                    <textarea
                      rows={2}
                      placeholder="They did excellent framing work for Juhu Project..."
                      value={vendorForm.note}
                      onChange={e => setVendorForm(prev => ({ ...prev, note: e.target.value }))}
                      className="w-full bg-[#F7F5F0] border border-[#EDE9E2] text-xs p-2 rounded-md focus:outline-none resize-none"
                    />
                  </div>
                  <button type="submit" className="w-full bg-[#F5A623] hover:bg-[#FFB94A] text-navy font-bold py-2 text-xs rounded-md">
                    SEND RECOMMENDATION
                  </button>
                </form>
              </div>

              {/* Vendor Rolodex list */}
              <div className="bg-white border border-[#EDE9E2] rounded-lg p-6 space-y-3">
                <h3 className="text-xs font-semibold text-stone border-b border-[#EDE9E2] pb-2">My Vendor Rolodex</h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between border-b pb-1.5">
                    <span className="font-semibold text-navy">Amit Sharma Civil</span>
                    <span className="text-stone">Civil (Mumbai)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-navy">GreenScapes Landscape</span>
                    <span className="text-stone">Landscape (Bangalore)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── CONTRACTOR / VENDOR PORTAL UI ── */}
        {activeRole === 'contractor' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 space-y-6">
              {/* Active Projects (Green feature) */}
              <div className="bg-white border border-[#EDE9E2] rounded-lg p-6 space-y-4">
                <h3 className="text-xs font-bold font-mono text-navy uppercase tracking-wider border-b border-[#EDE9E2] pb-2.5">
                  My Active Invited Projects
                </h3>
                <div className="space-y-3.5">
                  <div className="p-4 bg-[#F7F5F0]/60 border border-[#EDE9E2] rounded flex justify-between items-center">
                    <div>
                      <h4 className="text-xs font-bold text-navy">{project.name}</h4>
                      <p className="text-[10px] text-stone font-mono">Role: Civil & Masonry Subcontractor</p>
                    </div>
                    <span className="text-[10px] bg-success/10 text-success border px-2 py-0.5 rounded font-bold uppercase">
                      ACTIVE
                    </span>
                  </div>
                </div>
              </div>

              {/* Open Tenders Feed (Green feature) */}
              <div className="bg-white border border-[#EDE9E2] rounded-lg p-6 space-y-4">
                <h3 className="text-xs font-bold font-mono text-navy uppercase tracking-wider border-b border-[#EDE9E2] pb-2.5">
                  Open Tenders matching specialism (Civil / Electrical)
                </h3>
                <div className="space-y-4">
                  {tenders.map(t => (
                    <div key={t.id} className="p-4 border border-[#EDE9E2] rounded-md space-y-3">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <h4 className="text-xs font-bold text-navy leading-normal">{t.title}</h4>
                          <span className="text-[10px] text-stone font-mono">Location: {t.city} • Spec: {t.specialism}</span>
                        </div>
                        <span className="bg-amber/10 text-amber border text-[10px] font-mono px-2 py-0.5 rounded">
                          Budget: {t.budget}
                        </span>
                      </div>
                      <div className="flex justify-between items-center border-t border-[#F7F5F0] pt-2 text-xs">
                        <span className="text-[10px] text-stone font-mono">Deadline: {t.deadline}</span>
                        <button
                          onClick={() => alert(`Opening bid submission form for: ${t.title}`)}
                          className="bg-navy hover:bg-navy-mid text-white text-[11px] font-bold py-1 px-3.5 rounded"
                        >
                          SUBMIT BID PROPOSAL
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Contractor Dashboard KPIs (Green feature) */}
            <div className="space-y-6">
              <div className="bg-white border border-[#EDE9E2] rounded-lg p-6 space-y-4">
                <h3 className="text-xs font-semibold text-stone border-b border-[#EDE9E2] pb-2.5">Contractor Dashboard KPIs</h3>
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="p-3 bg-[#F7F5F0]/60 border border-[#EDE9E2] rounded">
                    <span className="text-[9px] text-stone font-mono uppercase block">Active Projects</span>
                    <span className="text-base font-bold text-navy mt-1 block">1</span>
                  </div>
                  <div className="p-3 bg-[#F7F5F0]/60 border border-[#EDE9E2] rounded">
                    <span className="text-[9px] text-stone font-mono uppercase block">Open Tenders Feed</span>
                    <span className="text-base font-bold text-amber mt-1 block">3</span>
                  </div>
                  <div className="p-3 bg-[#F7F5F0]/60 border border-[#EDE9E2] rounded col-span-2">
                    <span className="text-[9px] text-stone font-mono uppercase block">Profile Views This Month</span>
                    <span className="text-base font-bold text-blue mt-1 block">142 views</span>
                  </div>
                </div>
              </div>

              {/* Verified Badge info */}
              <div className="bg-white border border-[#EDE9E2] rounded-lg p-6 text-center space-y-2.5">
                <span className="material-icons-outlined text-success text-[36px]">verified</span>
                <h4 className="text-xs font-bold text-navy">Verified Badge Profile Upgrade</h4>
                <p className="text-[11px] text-stone leading-relaxed">
                  Pay ₹999/month for verified partner status and get priority tender leads routing.
                </p>
                <button
                  onClick={() => alert('Proceeding to Razorpay checkout for Verified badge upgrade')}
                  className="w-full bg-[#6fdc8c] hover:bg-[#5bc878] text-[#0A2E1A] font-bold py-2 text-xs rounded-md"
                >
                  Upgrade to Verified Partner
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── CONSULTANT PORTAL UI ── */}
        {activeRole === 'consultant' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 space-y-6">
              {/* Consultant Assignments */}
              <div className="bg-white border border-[#EDE9E2] rounded-lg p-6 space-y-4">
                <h3 className="text-xs font-bold font-mono text-navy uppercase tracking-wider border-b border-[#EDE9E2] pb-2.5">
                  My Discipline Assignments (MEP & Structural)
                </h3>
                <div className="space-y-3">
                  <div className="p-4 bg-[#F7F5F0]/60 border border-[#EDE9E2] rounded space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold text-navy">{project.name}</h4>
                      <span className="bg-stone/10 text-stone border text-[10px] font-mono px-2 py-0.5 rounded">
                        Discipline: Engineering
                      </span>
                    </div>
                    <p className="text-xs text-stone leading-normal">
                      Required deliverables: SD structural reports, CD rebar detailed schedules, and HVAC shaft reviews.
                    </p>
                  </div>
                </div>
              </div>

              {/* Scoped RFI Inbox */}
              <div className="bg-white border border-[#EDE9E2] rounded-lg p-6 space-y-4">
                <h3 className="text-xs font-bold font-mono text-navy uppercase tracking-wider border-b border-[#EDE9E2] pb-2.5">
                  Engineering RFI Inbox
                </h3>
                <div className="space-y-3.5 text-xs text-stone">
                  <div className="p-3.5 border border-[#EDE9E2] rounded-md space-y-1.5">
                    <div className="flex justify-between font-mono text-[10px]">
                      <span>RFI #002</span>
                      <span className="text-error font-bold">DUE TODAY</span>
                    </div>
                    <h4 className="font-semibold text-navy">HVAC Duct Clearance in Lobby</h4>
                    <p className="text-[11px] leading-relaxed">Clear ceiling height falls below 2.4m specifications due to cantilever cantilever frames.</p>
                    <button
                      onClick={() => alert('Opening RFI editor to submit formal engineering clarification')}
                      className="btn-secondary py-1 text-[11px] px-3.5 mt-2"
                    >
                      SUBMIT FORMAL CLARIFICATION
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Consultant Fee Claims */}
              <div className="bg-white border border-[#EDE9E2] rounded-lg p-6 space-y-4">
                <h3 className="text-xs font-semibold text-stone border-b border-[#EDE9E2] pb-2.5">Submit Fee Claim</h3>
                <p className="text-[11px] text-stone leading-relaxed">
                  Submit fee invoice claims to the Architect firm based on milestone phases completed.
                </p>
                <form 
                  onSubmit={e => {
                    e.preventDefault();
                    alert('Consultant fee claim submitted successfully to Apex Architects office inbox.');
                  }} 
                  className="space-y-3"
                >
                  <div>
                    <label className="block text-[10px] text-stone font-mono uppercase mb-1">Select Assignment Milestone</label>
                    <select className="w-full bg-[#F7F5F0] border border-[#EDE9E2] text-xs p-2 rounded focus:outline-none">
                      <option value="sd">Schematic design review completion</option>
                      <option value="dd">Design development coordinator signoff</option>
                      <option value="cd">Construction Docs drawings release</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-stone font-mono uppercase mb-1">Claim Fee Amount (₹)</label>
                    <input
                      type="number"
                      required
                      defaultValue={150000}
                      className="w-full bg-[#F7F5F0] border border-[#EDE9E2] text-xs p-2 rounded focus:outline-none font-mono"
                    />
                  </div>
                  <button type="submit" className="w-full bg-navy text-white py-2 text-xs font-semibold rounded-md">
                    SUBMIT FEE CLAIM
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  )
}

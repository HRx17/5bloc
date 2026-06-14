'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

interface PhaseMilestone {
 phase: string
 label: string
 date: string
 completion: number
 fee: number
 paid: boolean
 reraCertified: boolean
 notes: string
}

export default function ProjectOverview() {
 const params = useParams()
 const projectId = params.id as string

 // Project statistics
 const [projectStats, setProjectStats] = useState({
 sqft: 0,
 floors: 0,
 cost: 0,
 feePercent: 0,
 feeAmount: 0,
 startDate: '',
 endDate: '',
 brief: '',
 })

 // Milestones State
 const [milestones, setMilestones] = useState<PhaseMilestone[]>([])
 const [expandedPhase, setExpandedPhase] = useState<string | null>(null)
 const [loading, setLoading] = useState(true)

 useEffect(() => {
 // Simulated loading of project details & milestones
 const timer = setTimeout(() => {
 setProjectStats({
 sqft: projectId === 'proj-2' ? 22000 : projectId === 'proj-3' ? 75000 : 45000,
 floors: projectId === 'proj-2' ? 3 : projectId === 'proj-3' ? 1 : 12,
 cost: projectId === 'proj-2' ? 65000000 : projectId === 'proj-3' ? 180000000 : 120000000,
 feePercent: projectId === 'proj-2' ? 9 : projectId === 'proj-3' ? 8 : 10,
 feeAmount: projectId === 'proj-2' ? 5850000 : projectId === 'proj-3' ? 14400000 : 12000000,
 startDate: '2026-01-15',
 endDate: '2026-12-20',
 brief: 'Deliver a state-of-the-art structure matching high energy-efficiency ratings and local green standards.',
 })

 setMilestones([
 { phase: 'pre_design', label: 'Pre-Design', date: '2026-02-10', completion: 100, fee: 350000, paid: true, reraCertified: false, notes: 'Client brief, surveys, and site analysis compiled.' },
 { phase: 'schematic_design', label: 'Schematic Design', date: '2026-03-25', completion: 100, fee: 650000, paid: true, reraCertified: false, notes: 'Alternative layouts and massing models approved by builder.' },
 { phase: 'design_development', label: 'Design Development', date: '2026-05-15', completion: 100, fee: 1200000, paid: true, reraCertified: false, notes: 'Structural framing models and core detailing finalized.' },
 { phase: 'construction_docs', label: 'Construction Docs', date: '2026-07-20', completion: 40, fee: 2500000, paid: false, reraCertified: false, notes: 'Detailed drawings, sections, and BOQs in progress.' },
 { phase: 'bidding', label: 'Bidding & Tender', date: '2026-08-30', completion: 0, fee: 800000, paid: false, reraCertified: false, notes: 'RFP templates ready for contractor bidding.' },
 { phase: 'permits', label: 'Permits & Approvals', date: '2026-09-25', completion: 0, fee: 1200000, paid: false, reraCertified: false, notes: 'Local municipal fire and zoning documents filed.' },
 { phase: 'construction_admin', label: 'Construction Admin', date: '2026-11-30', completion: 0, fee: 4000000, paid: false, reraCertified: false, notes: 'On-site inspections and RFI resolution.' },
 { phase: 'complete', label: 'Close Out & Handover', date: '2026-12-15', completion: 0, fee: 1700000, paid: false, reraCertified: false, notes: 'Defect checklists and occupancy certificate file audits.' },
 ])
 setExpandedPhase('construction_docs') // default open active phase
 setLoading(false)
 }, 400)
 return () => clearTimeout(timer)
 }, [projectId])

 const toggleExpand = (phase: string) => {
 if (expandedPhase === phase) {
 setExpandedPhase(null)
 } else {
 setExpandedPhase(phase)
 }
 }

 const handleMilestoneFieldChange = (phase: string, field: keyof PhaseMilestone, value: any) => {
 setMilestones(prev => 
 prev.map(m => {
 if (m.phase === phase) {
 return { ...m, [field]: value }
 }
 return m
 })
 )
 }

 const saveMilestone = (phase: string) => {
 const milestone = milestones.find(m => m.phase === phase)
 alert(`Milestone ${milestone?.label} changes saved successfully (simulated)`)
 }

 const exportMilestonesToCSV = () => {
 const headers = ['Phase', 'Target Date', 'Completion %', 'Fee Amount (INR)', 'Paid Status', 'Notes']
 const rows = milestones.map(m => [
 m.label,
 m.date,
 `${m.completion}%`,
 m.fee,
 m.paid ? 'PAID' : 'UNPAID',
 m.notes.replace(/"/g, '""')
 ])

 const csvContent = [
 headers.join(','),
 ...rows.map(r => r.map(val => `"${val}"`).join(','))
 ].join('\n')

 const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
 const url = URL.createObjectURL(blob)
 const link = document.createElement('a')
 link.setAttribute('href', url)
 link.setAttribute('download', `milestones_schedule_${projectId}.csv`)
 link.style.visibility = 'hidden'
 document.body.appendChild(link)
 link.click()
 document.body.removeChild(link)
 }

 const downloadICS = (m: PhaseMilestone) => {
 const formattedDate = m.date.replace(/-/g, '')
 const icsString = [
 'BEGIN:VCALENDAR',
 'VERSION:2.0',
 'PRODID:-//5Bloc//Coordination Workspace//EN',
 'BEGIN:VEVENT',
 `UID:milestone-${m.phase}-${projectId}@5bloc.com`,
 `DTSTAMP:${formattedDate}T090000Z`,
 `DTSTART:${formattedDate}T090000Z`,
 `DTEND:${formattedDate}T100000Z`,
 `SUMMARY:Milestone: ${m.label} - Project ${projectId}`,
 `DESCRIPTION:Completion Target for Phase: ${m.label}. Progress: ${m.completion}%. Fee Status: ${m.paid ? 'PAID' : 'UNPAID'}. Notes: ${m.notes}`,
 'STATUS:CONFIRMED',
 'END:VEVENT',
 'END:VCALENDAR'
 ].join('\r\n')

 const blob = new Blob([icsString], { type: 'text/calendar;charset=utf-8;' })
 const url = URL.createObjectURL(blob)
 const link = document.createElement('a')
 link.setAttribute('href', url)
 link.setAttribute('download', `${m.phase}_deadline.ics`)
 link.style.visibility = 'hidden'
 document.body.appendChild(link)
 link.click()
 document.body.removeChild(link)
 }

 if (loading) {
 return (
 <div className="space-y-6 animate-pulse">
 <div className="card-5bloc h-28" />
 <div className="card-5bloc h-96" />
 </div>
 )
 }

 return (
 <div className="space-y-8 max-h-full font-body select-none">
 {/* 2-Column Overview Summary Cards */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 
 {/* Specifications Card */}
 <div className="card-5bloc space-y-3 md:col-span-2">
 <h3 className="text-xs font-semibold text-amber">Project Specifications</h3>
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1.5">
 <div>
 <p className="text-[11px] font-medium text-stone">Total Built Area</p>
 <h4 className="text-base font-semibold mt-1">{projectStats.sqft.toLocaleString()} sqft</h4>
 </div>
 <div>
 <p className="text-[11px] font-medium text-stone">Floors / Heights</p>
 <h4 className="text-base font-semibold mt-1">{projectStats.floors} Floors</h4>
 </div>
 <div>
 <p className="text-[11px] font-medium text-stone">Target Cost</p>
 <h4 className="text-base font-semibold mt-1">₹{(projectStats.cost / 10000000).toFixed(2)} Cr</h4>
 </div>
 <div>
 <p className="text-[11px] font-medium text-stone">Architect Fee</p>
 <h4 className="text-base font-semibold mt-1">
 ₹{(projectStats.feeAmount / 100000).toFixed(1)}L <span className="text-xs text-stone">({projectStats.feePercent}%)</span>
 </h4>
 </div>
 </div>
 <div className="pt-3 border-t ">
 <p className="text-[11px] font-medium text-stone mb-1">Project Brief Summary</p>
 <p className="text-xs text-white leading-relaxed">{projectStats.brief}</p>
 </div>
 </div>

 {/* Schedule timeline card */}
 <div className="card-5bloc flex flex-col justify-between">
 <h3 className="text-xs font-semibold text-amber">Project Schedule</h3>
 <div className="space-y-3.5 my-3">
 <div className="flex items-center justify-between text-xs">
 <span className="text-stone">Start Date:</span>
 <span className="font-semibold text-white">{projectStats.startDate}</span>
 </div>
 <div className="flex items-center justify-between text-xs">
 <span className="text-stone">Estimated End:</span>
 <span className="font-semibold text-white">{projectStats.endDate}</span>
 </div>
 </div>
 <div className="pt-3 border-t flex items-center gap-2 text-[11px] text-stone">
 <span className="w-2 h-2 rounded-full bg-success"></span>
 <span>Est. Duration: 11 Months</span>
 </div>
 </div>

 </div>

 {/* Interactive Phase Stepper Checklist */}
 <div className="space-y-4">
 <div className="flex items-center justify-between">
 <h2 className="text-base font-bold text-white tracking-wide">Phase Milestones & Deliverables</h2>
 <div className="flex items-center gap-3">
 <button 
 onClick={exportMilestonesToCSV}
 className="btn-secondary btn-sm flex items-center gap-1.5"
 >
 <span className="material-icons-outlined text-[16px]">file_download</span>
 Export Schedule (CSV)
 </button>
 <span className="text-xs text-stone hidden sm:inline">Click cards to edit details</span>
 </div>
 </div>

 <div className="space-y-3">
 {milestones.map((m, index) => {
 const isExpanded = expandedPhase === m.phase
 const isActive = m.completion > 0 && m.completion < 100
 const isCompleted = m.completion === 100

 return (
 <div 
 key={m.phase} 
 className={`border rounded-md overflow-hidden transition-all bg-navy-mid ${
 isExpanded ? '' : ''
 }`}
 >
 {/* Stepper Card Header */}
 <div 
 onClick={() => toggleExpand(m.phase)}
 className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-navy-lt/40 transition-colors"
 >
 <div className="flex items-center gap-3.5">
 {/* Visual Check/Indicator number */}
 <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
 isCompleted 
 ? 'bg-success/20 text-success border ' 
 : isActive 
 ? 'bg-amber/20 text-amber border animate-pulse'
 : 'bg-navy border text-stone'
 }`}>
 {isCompleted ? (
 <span className="material-icons-outlined text-[16px]">check</span>
 ) : (
 <span>{index + 1}</span>
 )}
 </div>
 
 <div>
 <h4 className="text-sm font-semibold text-white">{m.label}</h4>
 <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-stone">
 <span>Target: {m.date}</span>
 <button
 onClick={(e) => {
 e.stopPropagation()
 downloadICS(m)
 }}
 className="hover:text-amber transition p-0.5 flex items-center justify-center"
 title="Add to Google Calendar / iCal"
 >
 <span className="material-icons-outlined text-[13px]">calendar_today</span>
 </button>
 </div>
 </div>
 </div>

 {/* Badges / Progression right */}
 <div className="flex items-center gap-4 self-end sm:self-auto">
 {/* RERA Certificate Badge */}
 {m.reraCertified && (
 <span className="text-[10px] font-medium bg-success/10 text-success border px-2 py-0.5 rounded capitalize flex items-center gap-0.5">
 <span className="material-icons-outlined text-[12px]">gavel</span> Rera certified
 </span>
 )}

 {/* Paid status badge */}
 <span className={`text-[10px] font-medium px-2 py-0.5 rounded border capitalize ${
 m.paid 
 ? 'bg-success/10 text-success ' 
 : 'bg-slate/10 text-slate '
 }`}>
 {m.paid ? 'Fee paid' : 'Fee unpaid'}
 </span>

 {/* Progress Slider Display */}
 <div className="flex items-center gap-2">
 <span className="text-xs font-semibold text-white w-8 text-right">{m.completion}%</span>
 <div className="w-16 bg-navy h-1.5 rounded-full overflow-hidden border ">
 <div 
 className={`h-full rounded-full ${isCompleted ? 'bg-success' : 'bg-amber'}`}
 style={{ width: `${m.completion}%` }}
 />
 </div>
 </div>

 <span className={`material-icons-outlined text-stone transition-transform duration-200 ${
 isExpanded ? 'rotate-180' : ''
 }`}>
 expand_more
 </span>
 </div>
 </div>

 {/* Expanded Details Form Panel */}
 {isExpanded && (
 <div className="px-5 pb-5 pt-4 border-t bg-navy/30 space-y-4 animate-slide-down">
 <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
 {/* Date & Completion sliders */}
 <div className="space-y-3.5">
 <div>
 <label className="block text-xs text-stone mb-1 font-medium">Target Date</label>
 <input
 type="date"
 value={m.date}
 onChange={(e) => handleMilestoneFieldChange(m.phase, 'date', e.target.value)}
 className="input-5bloc py-1.5 text-xs"
 />
 </div>

 <div>
 <label className="block text-xs text-stone mb-1 font-medium">Completion Progress</label>
 <div className="flex items-center gap-3 mt-2">
 <input
 type="range"
 min="0"
 max="100"
 step="5"
 value={m.completion}
 onChange={(e) => handleMilestoneFieldChange(m.phase, 'completion', parseInt(e.target.value))}
 className="w-full accent-amber bg-navy border rounded-lg h-2 cursor-pointer"
 />
 </div>
 </div>
 </div>

 {/* Fees Configuration */}
 <div className="space-y-3.5">
 <div>
 <label className="block text-xs text-stone mb-1 font-medium">Phase Fee Amount (₹)</label>
 <input
 type="number"
 value={m.fee}
 onChange={(e) => handleMilestoneFieldChange(m.phase, 'fee', parseInt(e.target.value))}
 className="input-5bloc py-1.5 text-xs"
 />
 </div>

 <div className="flex flex-wrap items-center gap-4 pt-1">
 <label className="flex items-center gap-2 text-xs text-white cursor-pointer select-none">
 <input
 type="checkbox"
 checked={m.paid}
 onChange={(e) => handleMilestoneFieldChange(m.phase, 'paid', e.target.checked)}
 className="rounded bg-navy accent-amber w-4 h-4 cursor-pointer"
 />
 <span>Mark Fee as Paid</span>
 </label>

 <label className="flex items-center gap-2 text-xs text-white cursor-pointer select-none">
 <input
 type="checkbox"
 checked={m.reraCertified}
 onChange={(e) => handleMilestoneFieldChange(m.phase, 'reraCertified', e.target.checked)}
 className="rounded bg-navy accent-amber w-4 h-4 cursor-pointer"
 />
 <span>RERA Milestone Certified</span>
 </label>
 </div>
 </div>

 {/* Notes panel */}
 <div>
 <label className="block text-xs text-stone mb-1 font-medium">Phase Notes & Deliverables</label>
 <textarea
 rows={3}
 value={m.notes}
 onChange={(e) => handleMilestoneFieldChange(m.phase, 'notes', e.target.value)}
 className="input-5bloc text-xs resize-none h-[80px]"
 placeholder="List drawings, approvals, or milestones delivered in this phase..."
 />
 </div>
 </div>
 
 <div className="flex justify-end pt-3 border-t ">
 <button 
 onClick={() => saveMilestone(m.phase)}
 className="btn-primary py-1.5 px-6 text-xs"
 >
 Save Milestone
 </button>
 </div>
 </div>
 )}
 </div>
 )
 })}
 </div>
 </div>

 </div>
 )
}

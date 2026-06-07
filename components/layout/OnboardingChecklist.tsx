'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'

interface TaskItem {
 id: string
 label: string
 url: string
 completed: boolean
}

export default function OnboardingChecklist() {
 const [tasks, setTasks] = useState<TaskItem[]>([
 { id: 'client', label: 'Add your first client', url: '/clients', completed: false },
 { id: 'project', label: 'Create your first project', url: '/projects/new', completed: false },
 { id: 'document', label: 'Upload a project document', url: '/projects', completed: false },
 { id: 'ai', label: 'Try the AI cost estimator', url: '/ai/estimate', completed: false },
 { id: 'invite', label: 'Invite a team member', url: '/settings', completed: false },
 ])

 const [minimized, setMinimized] = useState(false)
 const [dismissed, setDismissed] = useState(true) // Start dismissed, then check client side

 useEffect(() => {
 // Read state from localStorage
 const saved = localStorage.getItem('onboarding_checklist_v1')
 if (saved) {
 try {
 const parsed = JSON.parse(saved) as Record<string, boolean>
 setTasks((prev) =>
 prev.map((t) => ({ ...t, completed: !!parsed[t.id] }))
 )
 // If all are completed, keep dismissed
 const allDone = prevCheckDone(parsed)
 setDismissed(allDone || localStorage.getItem('onboarding_checklist_dismissed') === 'true')
 } catch (e) {
 setDismissed(false)
 }
 } else {
 setDismissed(false)
 }
 }, [])

 const prevCheckDone = (states: Record<string, boolean>) => {
 return ['client', 'project', 'document', 'ai', 'invite'].every(id => !!states[id])
 }

 const handleToggle = (id: string) => {
 const nextTasks = tasks.map((t) => {
 if (t.id === id) return { ...t, completed: !t.completed }
 return t
 })
 setTasks(nextTasks)

 // Save to localStorage
 const states = nextTasks.reduce((acc, t) => {
 acc[t.id] = t.completed
 return acc
 }, {} as Record<string, boolean>)
 
 localStorage.setItem('onboarding_checklist_v1', JSON.stringify(states))

 if (prevCheckDone(states)) {
 setTimeout(() => {
 setDismissed(true)
 localStorage.setItem('onboarding_checklist_dismissed', 'true')
 }, 1000)
 }
 }

 const handleDismiss = () => {
 setDismissed(true)
 localStorage.setItem('onboarding_checklist_dismissed', 'true')
 }

 if (dismissed) return null

 const completedCount = tasks.filter((t) => t.completed).length
 const progressPercent = Math.round((completedCount / tasks.length) * 100)

 return (
 <div className="fixed bottom-6 right-6 z-50 w-80 overflow-hidden font-body" style={{ background: 'var(--surface-container)', boxShadow: 'var(--shadow-4)' }}>
 {/* Title Header */}
 <div className="px-4 py-3 flex items-center justify-between" style={{ background: 'var(--surface-container-high)', boxShadow: '0 1px 0 rgba(159,142,122,0.10)' }}>
 <div className="flex items-center gap-2">
 <span className="material-icons-outlined text-amber text-[18px]">verified</span>
 <span className="text-xs font-bold tracking-wider uppercase text-white">Getting Started</span>
 </div>
 <div className="flex items-center gap-1.5">
 <button 
 onClick={() => setMinimized(!minimized)} 
 className="text-stone hover:text-white transition p-0.5 hover:bg-navy/40"
 >
 <span className="material-icons-outlined text-[18px]">
 {minimized ? 'expand_less' : 'expand_more'}
 </span>
 </button>
 <button 
 onClick={handleDismiss} 
 className="text-stone hover:text-white transition p-0.5 hover:bg-navy/40"
 >
 <span className="material-icons-outlined text-[18px]">close</span>
 </button>
 </div>
 </div>

 {/* Checklist content */}
 {!minimized && (
 <div className="p-4 space-y-3.5">
 {/* Progress bar */}
 <div>
 <div className="flex justify-between text-[11px] text-stone font-mono mb-1">
 <span>Setup Progress</span>
 <span>{completedCount}/{tasks.length} ({progressPercent}%)</span>
 </div>
 <div className="w-full h-1.5 overflow-hidden" style={{ background: 'var(--surface-container-high)', boxShadow: 'var(--shadow-1)' }}>
 <div 
 className="bg-amber h-full transition-all duration-500" 
 style={{ width: `${progressPercent}%` }}
 />
 </div>
 </div>

 {/* List items */}
 <ul className="space-y-2">
 {tasks.map((task) => (
 <li key={task.id} className="flex items-start justify-between gap-3 text-xs">
 <div className="flex items-start gap-2.5">
 <button 
 onClick={() => handleToggle(task.id)}
 className="mt-0.5 w-4 h-4 flex items-center justify-center"
 style={task.completed
 ? { background: 'var(--amber-dk)', color: 'var(--btn-primary-text)', boxShadow: 'var(--shadow-1)' }
 : { background: 'var(--surface-container-high)', boxShadow: 'var(--shadow-1)' }
 }
 >
 {task.completed && (
 <span className="material-icons-outlined text-[12px] font-bold">check</span>
 )}
 </button>
 <Link 
 href={task.url}
 className={`transition-colors ${
 task.completed 
 ? 'text-stone line-through' 
 : 'text-white hover:text-amber'
 }`}
 >
 {task.label}
 </Link>
 </div>
 <Link 
 href={task.url}
 className="text-stone hover:text-amber transition p-0.5"
 >
 <span className="material-icons-outlined text-[14px]">arrow_forward</span>
 </Link>
 </li>
 ))}
 </ul>
 </div>
 )}
 </div>
 )
}


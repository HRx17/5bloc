'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Logo } from '../brand/LogoMark'

interface SidebarProps {
 userRole?: string
 plan?: string
 orgName?: string
 onClose?: () => void
}

export default function Sidebar({
 userRole = 'architect',
 plan = 'free',
 orgName = 'Apex Architects',
 onClose,
}: SidebarProps) {
 const pathname = usePathname()

 const navGroups = [
 {
 label: 'Workspace',
 items: [
 { name: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
 { name: 'Projects', path: '/projects', icon: 'space_dashboard' },
 { name: 'Clients', path: '/clients', icon: 'contacts' },
 { name: 'Invoices', path: '/invoices', icon: 'receipt_long' },
 ],
 },
 {
 label: 'Tools',
 items: [
 { name: 'Marketplace', path: '/marketplace', icon: 'storefront' },
 { name: 'AI Cost Estimator', path: '/ai/estimate', icon: 'auto_awesome' },
 { name: 'AI Contract Scan', path: '/ai/contract-scan', icon: 'gavel' },
 { name: 'Integrations', path: '/integrations', icon: 'extension' },
 ],
 },
 {
 label: 'Account',
 items: [
 { name: 'Settings', path: '/settings', icon: 'settings' },
 ],
 },
 ]

 const isSelected = (path: string) =>
 path === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(path)

 const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1)

 return (
 <aside
 className="w-[220px] h-screen flex flex-col z-40 select-none"
 style={{
 background: 'var(--glass-bg)',
 backdropFilter: 'var(--glass-blur)',
 WebkitBackdropFilter: 'var(--glass-blur)',
 boxShadow: 'var(--shadow-3)',
 }}
 >
 {/* ── Header ── */}
 <div
 className="h-[56px] px-5 flex items-center justify-between shrink-0"
 style={{ boxShadow: '0 1px 0 rgba(159,142,122,0.08)' }}
 >
 <Link href="/dashboard" onClick={onClose} className="flex items-center">
 <Logo size={28} showTagline={true} />
 </Link>
 {onClose && (
 <button onClick={onClose} className="lg:hidden" style={{ color: 'var(--stone)' }}>
 <span className="material-icons-outlined text-[20px]">close</span>
 </button>
 )}
 </div>

 {/* ── Navigation ── */}
 <nav className="flex-1 overflow-y-auto px-3 py-4">
 {navGroups.map((group) => (
 <div key={group.label} className="mb-6">
 <p className="px-3 mb-2 label-sm" style={{ color: 'var(--stone)' }}>
 {group.label}
 </p>
 <div className="flex flex-col gap-0.5">
 {group.items.map((item) => {
 const active = isSelected(item.path)
 return (
 <Link
 key={item.name}
 href={item.path}
 onClick={onClose}
 className="flex items-center gap-3 px-3 py-2 text-[13px] font-medium"
 style={{
 color: active ? 'var(--amber)' : 'var(--on-surface-variant)',
 background: active ? 'rgba(245, 166, 35, 0.10)' : 'transparent',
 boxShadow: active ? 'inset 3px 0 0 var(--amber-dk)' : 'none',
 }}
 onMouseEnter={(e) => {
 if (!active) {
 const t = e.currentTarget as HTMLElement
 t.style.background = 'var(--surface-container-high)'
 t.style.color = 'var(--on-surface)'
 }
 }}
 onMouseLeave={(e) => {
 if (!active) {
 const t = e.currentTarget as HTMLElement
 t.style.background = 'transparent'
 t.style.color = 'var(--on-surface-variant)'
 }
 }}
 >
 <span
 className="material-icons-outlined text-[18px]"
 style={{ color: active ? 'var(--amber)' : 'var(--stone)' }}
 >
 {item.icon}
 </span>
 <span>{item.name}</span>
 </Link>
 )
 })}
 </div>
 </div>
 ))}
 </nav>

 {/* ── Footer ── */}
 <div
 className="p-4 shrink-0"
 style={{ boxShadow: '0 -1px 0 rgba(159,142,122,0.08)' }}
 >
 {/* Org row */}
 <div className="flex items-center gap-3 mb-3">
 <div
 className="w-8 h-8 flex items-center justify-center text-[11px] font-bold shrink-0"
 style={{
 background: 'rgba(245,166,35,0.15)',
 color: 'var(--amber)',
 boxShadow: 'var(--shadow-1)',
 }}
 >
 {orgName.charAt(0).toUpperCase()}
 </div>
 <div className="min-w-0 flex-1">
 <p className="text-[12px] font-semibold truncate" style={{ color: 'var(--on-surface)' }}>
 {orgName}
 </p>
 <p className="text-[10px] capitalize" style={{ color: 'var(--stone)' }}>
 {userRole}
 </p>
 </div>
 </div>

 {/* Plan badge */}
 <div
 className="flex items-center justify-between px-3 py-2"
 style={{
 background: 'var(--surface-container)',
 boxShadow: 'var(--shadow-1)',
 }}
 >
 <span className="label-sm" style={{ color: 'var(--stone)' }}>Plan</span>
 <span
 className="chip"
 style={
 plan === 'team'
 ? { background: 'rgba(122,184,255,.15)', color: 'var(--blue)' }
 : plan === 'solo'
 ? { background: 'rgba(245,166,35,.15)', color: 'var(--amber)' }
 : { background: 'rgba(159,142,122,.12)', color: 'var(--stone)' }
 }
 >
 {planLabel}
 </span>
 </div>

 {plan === 'free' && (
 <Link
 href="/settings?tab=billing"
 onClick={onClose}
 className="mt-2 block text-center btn-primary text-[12px] w-full"
 >
 Upgrade Firm
 </Link>
 )}
 </div>
 </aside>
 )
}

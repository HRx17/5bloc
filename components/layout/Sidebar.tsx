'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Logo } from '../brand/LogoMark'
import { createSupabaseClient } from '@/lib/supabase/client'

interface SidebarProps {
  userRole?: string
  plan?: string
  orgName?: string
  onClose?: () => void
}

/* ── Navigation tree matching the IA module groups ── */
const NAV = [
  {
    label: null, // no section header for primary actions
    items: [
      { name: 'Dashboard',    path: '/dashboard',    icon: 'home',              desc: 'Overview & activity' },
      { name: 'Projects',     path: '/projects',     icon: 'space_dashboard',   desc: 'All your projects' },
    ],
  },
  {
    label: 'Coordination',
    items: [
      { name: 'Coordination', path: '/coordination', icon: 'forum',             desc: 'RFIs, messages & meetings' },
      { name: 'Documents',    path: '/documents',    icon: 'folder_open',       desc: 'Drawing vault & approvals' },
    ],
  },
  {
    label: 'Business',
    items: [
      { name: 'Clients',      path: '/clients',      icon: 'contacts',          desc: 'CRM & pipeline' },
      { name: 'Finances',     path: '/invoices',     icon: 'receipt_long',      desc: 'Invoices & billing' },
    ],
  },
  {
    label: 'Tools',
    items: [
      { name: 'Marketplace',  path: '/marketplace',  icon: 'storefront',        desc: 'Find contractors' },
      { name: 'AI Assistant', path: '/ai/estimate',  icon: 'auto_awesome',      desc: 'Estimates & contract scan', badge: 'AI' },
      { name: 'Integrations', path: '/integrations', icon: 'extension',         desc: 'Connect your tools' },
    ],
  },
]

export default function Sidebar({
  userRole = 'architect',
  plan = 'free',
  orgName = 'Apex Architects',
  onClose,
}: SidebarProps) {
  const pathname  = usePathname()
  const router    = useRouter()
  const [hoveredPath, setHoveredPath] = useState<string | null>(null)
  const [loggingOut, setLoggingOut]   = useState(false)

  async function handleLogout() {
    setLoggingOut(true)
    try {
      const supabase = createSupabaseClient()
      await supabase.auth.signOut()
    } catch (_) {
      // ignore — middleware will redirect anyway
    }
    router.push('/login')
    router.refresh()
  }

  const isActive = (path: string) =>
    path === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(path)

  const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1)

  const planChip = {
    team: { bg: 'rgba(122,184,255,.12)', color: 'var(--blue)',  label: 'Team' },
    solo: { bg: 'rgba(245,166,35,.12)',  color: 'var(--amber)', label: 'Solo' },
    free: { bg: 'rgba(138,128,120,.10)', color: 'var(--stone)', label: 'Free' },
  }[plan] ?? { bg: 'rgba(138,128,120,.10)', color: 'var(--stone)', label: planLabel }

  return (
    <aside
      className="w-[220px] h-screen flex flex-col select-none z-40"
      style={{
        background: 'rgba(10,10,14,0.92)',
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
        boxShadow: 'inset -1px 0 0 rgba(255,255,255,0.04)',
      }}
    >
      {/* ── Logo header ── */}
      <div
        className="h-[56px] px-4 flex items-center justify-between shrink-0"
        style={{ boxShadow: '0 1px 0 rgba(255,255,255,0.04)' }}
      >
        <Link href="/dashboard" onClick={onClose} className="flex items-center gap-2">
          <Logo size={24} showTagline={false} />
        </Link>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden h-7 w-7 flex items-center justify-center rounded-lg"
            style={{ color: 'var(--stone)' }}
          >
            <span className="material-icons-outlined text-[18px]">close</span>
          </button>
        )}
      </div>

      {/* ── New Project quick action ── */}
      <div className="px-3 pt-3 pb-1 shrink-0">
        <Link
          href="/projects/new"
          onClick={onClose}
          className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl font-medium text-[13px] transition-all duration-150 group"
          style={{
            background: 'rgba(245,166,35,0.10)',
            color: 'var(--amber)',
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'rgba(245,166,35,0.16)')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'rgba(245,166,35,0.10)')}
        >
          <span className="material-icons-outlined text-[16px]">add_circle</span>
          New Project
        </Link>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-2 space-y-1">
        {NAV.map((group, gi) => (
          <div key={gi} className={gi > 0 ? 'pt-3' : ''}>
            {group.label && (
              <p
                className="px-3 pb-1.5 font-mono text-[9px] uppercase tracking-[0.16em] font-semibold"
                style={{ color: 'var(--stone)', opacity: 0.45 }}
              >
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.path)
                const hovered = hoveredPath === item.path

                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    onClick={onClose}
                    onMouseEnter={() => setHoveredPath(item.path)}
                    onMouseLeave={() => setHoveredPath(null)}
                    className="relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all duration-150"
                    style={{
                      background: active
                        ? 'rgba(255,255,255,0.06)'
                        : hovered
                          ? 'rgba(255,255,255,0.03)'
                          : 'transparent',
                      color: active ? 'var(--on-surface)' : 'var(--on-surface-variant)',
                    }}
                  >
                    {/* Active pill indicator */}
                    {active && (
                      <motion.span
                        layoutId="sidebar-pill"
                        className="absolute left-0 top-[22%] bottom-[22%] w-[3px] rounded-full"
                        style={{ background: 'var(--amber)' }}
                        transition={{ type: 'spring', stiffness: 500, damping: 36 }}
                      />
                    )}

                    <span
                      className="material-icons-outlined text-[17px] shrink-0"
                      style={{ color: active ? 'var(--amber)' : hovered ? 'var(--on-surface-variant)' : 'var(--stone)' }}
                    >
                      {item.icon}
                    </span>

                    <span className="flex-1 text-[13px] font-medium truncate">{item.name}</span>

                    {/* AI badge */}
                    {'badge' in item && item.badge && (
                      <span
                        className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded-full"
                        style={{
                          background: 'rgba(167,139,250,0.15)',
                          color: 'var(--purple)',
                          letterSpacing: '0.06em',
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>

            {/* Thin section separator */}
            {gi < NAV.length - 1 && gi > 0 && (
              <div
                className="mx-3 mt-3"
                style={{ height: '1px', background: 'rgba(255,255,255,0.04)' }}
              />
            )}
          </div>
        ))}
      </nav>

      {/* ── User footer ── */}
      <div
        className="p-3 shrink-0 space-y-2"
        style={{ boxShadow: '0 -1px 0 rgba(255,255,255,0.04)' }}
      >
        {/* Download desktop app */}
        <Link
          href="/settings?tab=download"
          onClick={onClose}
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12.5px] font-medium transition-all"
          style={{ color: 'var(--stone)' }}
          onMouseEnter={(e) => {
            const t = e.currentTarget as HTMLElement
            t.style.background = 'rgba(255,255,255,0.04)'
            t.style.color = 'var(--on-surface)'
          }}
          onMouseLeave={(e) => {
            const t = e.currentTarget as HTMLElement
            t.style.background = 'transparent'
            t.style.color = 'var(--stone)'
          }}
        >
          <span className="material-icons-outlined text-[16px]">download</span>
          Download App
        </Link>

        {/* Settings link */}
        <Link
          href="/settings"
          onClick={onClose}
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12.5px] font-medium transition-all"
          style={{ color: 'var(--stone)' }}
          onMouseEnter={(e) => {
            const t = e.currentTarget as HTMLElement
            t.style.background = 'rgba(255,255,255,0.04)'
            t.style.color = 'var(--on-surface)'
          }}
          onMouseLeave={(e) => {
            const t = e.currentTarget as HTMLElement
            t.style.background = 'transparent'
            t.style.color = 'var(--stone)'
          }}
        >
          <span className="material-icons-outlined text-[16px]">settings</span>
          Settings
        </Link>

        {/* Logout */}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12.5px] font-medium transition-all w-full"
          style={{ color: 'var(--stone)' }}
          onMouseEnter={(e) => {
            const t = e.currentTarget as HTMLElement
            t.style.background = 'rgba(255,138,128,0.07)'
            t.style.color = 'var(--error)'
          }}
          onMouseLeave={(e) => {
            const t = e.currentTarget as HTMLElement
            t.style.background = 'transparent'
            t.style.color = 'var(--stone)'
          }}
        >
          <span className="material-icons-outlined text-[16px]">
            {loggingOut ? 'sync' : 'logout'}
          </span>
          {loggingOut ? 'Signing out…' : 'Sign out'}
        </button>

        {/* Org / plan strip */}
        <div
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.03)' }}
        >
          <div
            className="w-7 h-7 flex items-center justify-center text-[11px] font-bold shrink-0 rounded-lg"
            style={{ background: 'rgba(245,166,35,0.12)', color: 'var(--amber)' }}
          >
            {orgName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-semibold truncate" style={{ color: 'var(--on-surface)' }}>
              {orgName}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] capitalize" style={{ color: 'var(--stone)' }}>
                {userRole}
              </span>
              <span
                className="text-[9.5px] px-1.5 py-0.5 rounded-full font-medium"
                style={{ background: planChip.bg, color: planChip.color }}
              >
                {planChip.label}
              </span>
            </div>
          </div>
        </div>

        {/* Upgrade CTA for free plan */}
        {plan === 'free' && (
          <Link
            href="/settings?tab=billing"
            onClick={onClose}
            className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-[12px] font-semibold transition-all"
            style={{
              background: 'rgba(245,166,35,0.08)',
              color: 'var(--amber)',
              boxShadow: 'inset 0 0 0 1px rgba(245,166,35,0.15)',
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'rgba(245,166,35,0.14)')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'rgba(245,166,35,0.08)')}
          >
            <span className="material-icons-outlined text-[14px]">rocket_launch</span>
            Upgrade to Solo
          </Link>
        )}
      </div>
    </aside>
  )
}

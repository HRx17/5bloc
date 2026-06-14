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

const NAV = [
  {
    label: null,
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
      { name: 'CAD Viewer',   path: '/cad',          icon: 'view_in_ar',        desc: 'View DWG & 3D models' },
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
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleLogout() {
    setLoggingOut(true)
    try {
      const supabase = createSupabaseClient()
      await supabase.auth.signOut()
    } catch (_) { /* ignore */ }
    router.push('/login')
    router.refresh()
  }

  const isActive = (path: string) =>
    path === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(path)

  const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1)
  const planChip = {
    team: { bg: 'rgba(122,184,255,.14)', color: 'var(--blue)',  label: 'Team' },
    solo: { bg: 'rgba(245,166,35,.14)',  color: 'var(--amber)', label: 'Solo' },
    free: { bg: 'var(--overlay-hover)',  color: 'var(--stone)', label: 'Free' },
  }[plan] ?? { bg: 'var(--overlay-hover)', color: 'var(--stone)', label: planLabel }

  return (
    <aside
      className="w-[212px] h-screen flex flex-col select-none z-40"
      style={{
        background: 'var(--surface-container-low)',
        boxShadow: 'inset -1px 0 0 var(--hairline)',
      }}
    >
      {/* ── Logo header ── */}
      <div
        className="h-[52px] px-4 flex items-center justify-between shrink-0"
        style={{ boxShadow: '0 1px 0 var(--hairline)' }}
      >
        <Link href="/dashboard" onClick={onClose} className="flex items-center gap-2">
          <Logo size={22} showTagline={false} />
        </Link>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden h-6 w-6 flex items-center justify-center rounded-lg"
            style={{ color: 'var(--stone)' }}
          >
            <span className="material-icons-outlined text-[16px]">close</span>
          </button>
        )}
      </div>

      {/* ── New Project quick action ── */}
      <div className="px-3 pt-2.5 pb-1 shrink-0">
        <Link
          href="/projects/new"
          onClick={onClose}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-xl font-medium text-[12.5px]"
          style={{
            background: 'rgba(245,166,35,0.10)',
            color: 'var(--amber)',
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'rgba(245,166,35,0.17)')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'rgba(245,166,35,0.10)')}
        >
          <span className="material-icons-outlined text-[15px]">add_circle</span>
          New Project
        </Link>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto px-2 py-1.5 space-y-0.5">
        {NAV.map((group, gi) => (
          <div key={gi} className={gi > 0 ? 'pt-2.5' : ''}>
            {group.label && (
              <p
                className="px-3 pb-1 font-mono text-[9px] uppercase tracking-[0.16em] font-semibold"
                style={{ color: 'var(--stone)', opacity: 0.5 }}
              >
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.path)
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    onClick={onClose}
                    className="relative flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] font-medium"
                    style={{
                      background: active ? 'var(--overlay-active)' : 'transparent',
                      color: active ? 'var(--on-surface)' : 'var(--on-surface-variant)',
                    }}
                    onMouseEnter={(e) => {
                      if (!active) (e.currentTarget as HTMLElement).style.background = 'var(--overlay-hover)'
                    }}
                    onMouseLeave={(e) => {
                      if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'
                    }}
                  >
                    {/* Active pill */}
                    {active && (
                      <motion.span
                        layoutId="sidebar-pill"
                        className="absolute left-0 top-[22%] bottom-[22%] w-[3px] rounded-full"
                        style={{ background: 'var(--amber)' }}
                        transition={{ type: 'spring', stiffness: 500, damping: 36 }}
                      />
                    )}

                    <span
                      className="material-icons-outlined text-[16px] shrink-0"
                      style={{ color: active ? 'var(--amber)' : 'var(--stone)' }}
                    >
                      {item.icon}
                    </span>

                    <span className="flex-1 truncate">{item.name}</span>

                    {'badge' in item && item.badge && (
                      <span
                        className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full"
                        style={{ background: 'rgba(167,139,250,0.14)', color: 'var(--purple)' }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>

            {gi < NAV.length - 1 && gi > 0 && (
              <div className="mx-3 mt-2.5" style={{ height: '1px', background: 'var(--hairline)' }} />
            )}
          </div>
        ))}
      </nav>

      {/* ── Footer ── */}
      <div
        className="px-2 py-2.5 shrink-0 space-y-0.5"
        style={{ boxShadow: '0 -1px 0 var(--hairline)' }}
      >
        <FooterLink href="/settings" icon="settings" label="Settings" onClose={onClose} />
        <FooterLink href="/settings?tab=download" icon="download" label="Download App" onClose={onClose} />

        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-[12.5px] font-medium w-full text-left"
          style={{ color: 'var(--stone)' }}
          onMouseEnter={(e) => {
            const t = e.currentTarget as HTMLElement
            t.style.background = 'rgba(255,99,99,0.07)'
            t.style.color = 'var(--error)'
          }}
          onMouseLeave={(e) => {
            const t = e.currentTarget as HTMLElement
            t.style.background = 'transparent'
            t.style.color = 'var(--stone)'
          }}
        >
          <span className="material-icons-outlined text-[15px]">{loggingOut ? 'sync' : 'logout'}</span>
          {loggingOut ? 'Signing out…' : 'Sign out'}
        </button>

        {/* Org strip */}
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl mt-1"
          style={{ background: 'var(--overlay-hover)' }}
        >
          <div
            className="w-6 h-6 flex items-center justify-center text-[10px] font-bold shrink-0 rounded-lg"
            style={{ background: 'rgba(245,166,35,0.14)', color: 'var(--amber)' }}
          >
            {orgName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-semibold truncate" style={{ color: 'var(--on-surface)' }}>
              {orgName}
            </p>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] capitalize" style={{ color: 'var(--stone)' }}>{userRole}</span>
              <span
                className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold"
                style={{ background: planChip.bg, color: planChip.color }}
              >
                {planChip.label}
              </span>
            </div>
          </div>
        </div>

        {plan === 'free' && (
          <Link
            href="/settings?tab=billing"
            onClick={onClose}
            className="flex items-center justify-center gap-1.5 w-full py-1.5 rounded-xl text-[11.5px] font-semibold"
            style={{
              background: 'rgba(245,166,35,0.08)',
              color: 'var(--amber)',
              boxShadow: 'inset 0 0 0 1px rgba(245,166,35,0.18)',
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'rgba(245,166,35,0.14)')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'rgba(245,166,35,0.08)')}
          >
            <span className="material-icons-outlined text-[13px]">rocket_launch</span>
            Upgrade to Solo
          </Link>
        )}
      </div>
    </aside>
  )
}

function FooterLink({ href, icon, label, onClose }: { href: string; icon: string; label: string; onClose?: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClose}
      className="flex items-center gap-2 px-3 py-2 rounded-xl text-[12.5px] font-medium"
      style={{ color: 'var(--stone)' }}
      onMouseEnter={(e) => {
        const t = e.currentTarget as HTMLElement
        t.style.background = 'var(--overlay-hover)'
        t.style.color = 'var(--on-surface)'
      }}
      onMouseLeave={(e) => {
        const t = e.currentTarget as HTMLElement
        t.style.background = 'transparent'
        t.style.color = 'var(--stone)'
      }}
    >
      <span className="material-icons-outlined text-[15px]">{icon}</span>
      {label}
    </Link>
  )
}

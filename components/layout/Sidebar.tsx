'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Logo } from '../brand/LogoMark'
import { getNavForRole } from '@/lib/rbac/nav'
import { ROLES, type RoleKey } from '@/lib/rbac/roles'

interface SidebarProps {
  userRole?: string
  plan?: string
  orgName?: string
  onClose?: () => void
}

export default function Sidebar({
  userRole = 'architect',
  plan = 'free',
  orgName,
  onClose,
}: SidebarProps) {
  const pathname = usePathname()
  const navGroups = getNavForRole(userRole)
  const roleLabel =
    userRole in ROLES ? ROLES[userRole as RoleKey].shortLabel : userRole
  const displayOrg =
    orgName ||
    (userRole === 'contractor'
      ? 'Contractor workspace'
      : userRole === 'builder'
        ? 'Builder portfolio'
        : userRole === 'consultant'
          ? 'Consultant workspace'
          : '5Bloc')

  const isSelected = (path: string) => {
    if (path === '/dashboard' || path === '/contractor' || path === '/builder' || path === '/consultant') {
      return pathname === path
    }
    return pathname === path || pathname.startsWith(path + '/')
  }

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
      <div
        className="h-[56px] px-5 flex items-center justify-between shrink-0"
        style={{ boxShadow: '0 1px 0 rgba(159,142,122,0.08)' }}
      >
        <Link
          href={getNavForRole(userRole)[0]?.items[0]?.path || '/dashboard'}
          onClick={onClose}
          className="flex items-center"
        >
          <Logo size={28} showTagline={true} />
        </Link>
        {onClose && (
          <button onClick={onClose} className="lg:hidden" style={{ color: 'var(--stone)' }}>
            <span className="material-icons-outlined text-[20px]">close</span>
          </button>
        )}
      </div>

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
                    className="flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium rounded-xl transition-all duration-150"
                    style={{
                      color: active ? 'var(--amber)' : 'var(--on-surface-variant)',
                      background: active ? 'rgba(245, 166, 35, 0.08)' : 'transparent',
                    }}
                  >
                    <span className="material-icons-outlined text-[20px]">{item.icon}</span>
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div
        className="px-4 py-4 shrink-0"
        style={{ boxShadow: '0 -1px 0 rgba(159,142,122,0.08)' }}
      >
        <p className="text-[12px] font-semibold truncate" style={{ color: 'var(--on-surface)' }}>
          {displayOrg}
        </p>
        <p className="text-[11px] mt-0.5" style={{ color: 'var(--stone)' }}>
          {roleLabel} · {planLabel}
        </p>
      </div>
    </aside>
  )
}

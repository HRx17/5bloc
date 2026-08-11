'use client'

import React, { useState } from 'react'
import Sidebar from './Sidebar'
import TopNav from './TopNav'
import NotificationsBell from './NotificationsBell'

interface AppShellProps {
  children: React.ReactNode
  userProfile?: {
    id?: string
    full_name?: string | null
    role?: string
    avatar_url?: string | null
    plan?: string
    organisations?: {
      name?: string
    } | null
  }
}

export default function AppShell({ children, userProfile }: AppShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const profile = userProfile || {
    full_name: 'Guest',
    role: 'architect',
    avatar_url: undefined,
    plan: 'free',
    organisations: { name: '5Bloc' },
  }

  return (
    <div
      className="flex h-screen w-screen overflow-hidden"
      style={{ background: 'var(--surface-canvas)' }}
    >
      <div className="hidden lg:flex shrink-0">
        <Sidebar
          userRole={profile.role}
          plan={profile.plan}
          orgName={profile.organisations?.name}
        />
      </div>

      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 flex lg:hidden"
          style={{ background: 'rgba(12, 14, 14, 0.75)', backdropFilter: 'blur(4px)' }}
        >
          <div className="relative flex flex-col shrink-0 animate-slide-in">
            <Sidebar
              userRole={profile.role}
              plan={profile.plan}
              orgName={profile.organisations?.name}
              onClose={() => setMobileMenuOpen(false)}
            />
          </div>
          <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopNav
          userName={profile.full_name || 'User'}
          userRole={profile.role}
          avatarUrl={profile.avatar_url || undefined}
          onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
          rightSlot={<NotificationsBell userId={profile.id} />}
        />

        <main
          className="flex-1 overflow-x-hidden overflow-y-auto relative"
          style={{ background: 'var(--surface)', color: 'var(--on-surface)' }}
        >
          {children}
        </main>
      </div>
    </div>
  )
}

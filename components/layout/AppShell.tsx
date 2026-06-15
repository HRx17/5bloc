'use client'

import React, { useState } from 'react'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from './Sidebar'
import TopNav from './TopNav'
import { ToastProvider } from '@/components/ui/Toast'
import { MessagesProvider } from '@/components/messages/MessagesProvider'

interface AppShellProps {
 children: React.ReactNode
 userProfile?: {
 full_name?: string
 role?: string
 avatar_url?: string
 plan?: string
 organisations?: {
 name?: string
 }
 }
}

export default function AppShell({ children, userProfile }: AppShellProps) {
 const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
 const pathname = usePathname()

 const profile = userProfile || {
 full_name: 'Parth Patel',
 role: 'architect',
 avatar_url: undefined,
 plan: 'free',
 organisations: { name: 'Apex Architects' },
 }

  return (
    <ToastProvider>
      <MessagesProvider>
      {/* Root shell — flat surface, no overflow */}
      <div
        className="flex h-screen w-screen overflow-hidden"
        style={{ background: 'var(--surface)' }}
      >
 {/* Desktop Sidebar */}
 <div className="hidden lg:flex shrink-0">
 <Sidebar
 userRole={profile.role}
 plan={profile.plan}
 orgName={profile.organisations?.name}
 />
 </div>

 {/* Mobile Drawer */}
 {mobileMenuOpen && (
 <div
      className="fixed inset-0 z-50 flex lg:hidden"
        style={{ background: 'var(--scrim)', backdropFilter: 'blur(4px)' }}
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

 {/* Main */}
 <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
 <TopNav
 userName={profile.full_name}
 avatarUrl={profile.avatar_url}
 onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
 />

      <main
            className="flex-1 overflow-x-hidden overflow-y-auto relative"
            style={{
              background: 'var(--surface-canvas)',
              color: 'var(--on-surface)',
            }}
          >
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="h-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
        </main>
      </div>
    </div>
      </MessagesProvider>
    </ToastProvider>
  )
}

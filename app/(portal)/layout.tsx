import React from 'react'
import { ToastProvider } from '@/components/ui/Toast'
import { ConfirmProvider } from '@/components/ui/ConfirmProvider'

/**
 * The client portal is public and renders outside the signed-in AppShell, so it
 * needs its own copy of the feedback providers.
 */
export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <ConfirmProvider>{children}</ConfirmProvider>
    </ToastProvider>
  )
}

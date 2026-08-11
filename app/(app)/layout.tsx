import React from 'react'
import AppShell from '@/components/layout/AppShell'
import { getAuthUserOrNull } from '@/lib/supabase/get-user'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const auth = await getAuthUserOrNull()
  const profile = auth?.profile

  return (
    <AppShell
      userProfile={
        profile
          ? {
              id: profile.id,
              full_name: profile.full_name,
              role: profile.role,
              avatar_url: profile.avatar_url,
              plan: profile.plan,
              organisations: profile.organisations,
            }
          : undefined
      }
    >
      {children}
    </AppShell>
  )
}

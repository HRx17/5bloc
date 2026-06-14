import React from 'react'
import AppShell from '@/components/layout/AppShell'
import { getAuthUser } from '@/lib/supabase/get-user'

export const dynamic = 'force-dynamic'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let profileShape: {
    full_name?: string
    role?: string
    avatar_url?: string
    plan?: string
    organisations?: { name?: string }
  } | undefined = undefined

  try {
    const { profile } = await getAuthUser()
    const p = profile as any
    profileShape = {
      full_name:     p.full_name  ?? undefined,
      role:          p.role       ?? undefined,
      avatar_url:    p.avatar_url ?? undefined,
      plan:          p.plan       ?? undefined,
      organisations: p.organisations
        ? { name: p.organisations?.name ?? undefined }
        : undefined,
    }
  } catch (e) {
    console.warn('AppLayout profile fetch failed:', e)
  }

  return (
    <AppShell userProfile={profileShape}>
      {children}
    </AppShell>
  )
}

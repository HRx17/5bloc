import React from 'react'
import { redirect } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import { RoleGate } from '@/components/auth/RoleGate'
import { getAuthUser } from '@/lib/supabase/get-user'

export const dynamic = 'force-dynamic'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { profile, needsOnboarding: incomplete } = await getAuthUser()

  if (incomplete) {
    redirect('/onboarding')
  }

  const p = profile as {
    full_name?: string | null
    role?: string | null
    avatar_url?: string | null
    plan?: string | null
    organisations?: { name?: string | null } | null
  }

  return (
    <AppShell
      userProfile={{
        full_name: p.full_name ?? undefined,
        role: p.role ?? undefined,
        avatar_url: p.avatar_url ?? undefined,
        plan: p.plan ?? undefined,
        organisations: p.organisations?.name
          ? { name: p.organisations.name }
          : undefined,
      }}
    >
      <RoleGate role={p.role}>{children}</RoleGate>
    </AppShell>
  )
}

import React from 'react'
import AppShell from '@/components/layout/AppShell'
import { getAuthUser } from '@/lib/supabase/get-user'

export default async function AppLayout({
 children,
}: {
 children: React.ReactNode
}) {
 let profile = undefined

 try {
 const authData = await getAuthUser()
 profile = authData.profile
 } catch (e) {
 // If unauthorized or error in server component, getAuthUser throws.
 // In dev mode it falls back to mock profile. If there's an error,
 // we let profile stay undefined so AppShell uses its built-in fallbacks.
 console.warn('AppLayout server profile fetch bypassed/failed:', e)
 }

 return (
 <AppShell userProfile={profile}>
 {children}
 </AppShell>
 )
}

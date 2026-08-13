import { Suspense } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import LoginClient from '../login/LoginClient'
import { AuthSkeleton } from '@/components/ui/AuthSkeleton'
import { isSmokeAdminEnabled } from '@/lib/auth/smoke-admin'

export const metadata: Metadata = {
  title: 'Admin',
  robots: { index: false, follow: false },
}

export default function AdminLoginPage() {
  if (!isSmokeAdminEnabled()) notFound()

  return (
    <Suspense fallback={<AuthSkeleton />}>
      <LoginClient mode="admin" />
    </Suspense>
  )
}

import { Suspense } from 'react'
import type { Metadata } from 'next'
import LoginClient from '../login/LoginClient'
import { AuthSkeleton } from '@/components/ui/AuthSkeleton'

export const metadata: Metadata = {
  title: 'Admin',
  robots: { index: false, follow: false },
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<AuthSkeleton />}>
      <LoginClient mode="admin" />
    </Suspense>
  )
}

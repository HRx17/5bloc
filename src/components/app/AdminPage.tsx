import { Suspense } from 'react'
import LoginClient from '@/components/auth/LoginClient'
import { AuthSkeleton } from '@/components/ui5/AuthSkeleton'

export default function AdminPage() {
  return (
    <Suspense fallback={<AuthSkeleton />}>
      <LoginClient mode="admin" />
    </Suspense>
  )
}

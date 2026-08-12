import { Suspense } from 'react'
import Login from './LoginClient'
import { AuthSkeleton } from '@/components/ui/AuthSkeleton'

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthSkeleton />}>
      <Login />
    </Suspense>
  )
}

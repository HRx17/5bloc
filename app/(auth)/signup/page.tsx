import { Suspense } from 'react'
import Signup from './SignupClient'
import { AuthSkeleton } from '@/components/ui/AuthSkeleton'

export default function SignupPage() {
  return (
    <Suspense fallback={<AuthSkeleton />}>
      <Signup />
    </Suspense>
  )
}

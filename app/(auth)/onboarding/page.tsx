import { Suspense } from 'react'
import Onboarding from './OnboardingClient'
import { AuthSkeleton } from '@/components/ui/AuthSkeleton'

export default function OnboardingPage() {
  return (
    <Suspense fallback={<AuthSkeleton />}>
      <Onboarding />
    </Suspense>
  )
}

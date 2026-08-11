import { Suspense } from 'react'
import Onboarding from './OnboardingClient'

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-canvas" />}>
      <Onboarding />
    </Suspense>
  )
}

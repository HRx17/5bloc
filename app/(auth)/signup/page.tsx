import { Suspense } from 'react'
import Signup from './SignupClient'

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-canvas" />}>
      <Signup />
    </Suspense>
  )
}

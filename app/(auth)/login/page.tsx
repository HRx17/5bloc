import { Suspense } from 'react'
import Login from './LoginClient'

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-canvas" />}>
      <Login />
    </Suspense>
  )
}

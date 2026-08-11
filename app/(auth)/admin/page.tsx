import { Suspense } from 'react'
import type { Metadata } from 'next'
import LoginClient from '../login/LoginClient'

export const metadata: Metadata = {
  title: 'Admin',
  robots: { index: false, follow: false },
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-canvas" />}>
      <LoginClient mode="admin" />
    </Suspense>
  )
}

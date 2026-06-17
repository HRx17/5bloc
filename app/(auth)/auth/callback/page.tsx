'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { AuthLoadingScreen } from '@/components/auth/AuthLoadingScreen'

function AuthCallbackInner() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const query = searchParams.toString()
    const target = query ? `/api/auth/callback?${query}` : '/api/auth/callback'
    window.location.replace(target)
  }, [searchParams])

  return <AuthLoadingScreen message="Signing you in…" submessage="Connecting your Google account" />
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<AuthLoadingScreen />}>
      <AuthCallbackInner />
    </Suspense>
  )
}

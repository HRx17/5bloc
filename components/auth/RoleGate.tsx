'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { canAccessRoute } from '@/lib/auth/access'

export function RoleGate({
  role,
  children,
}: {
  role?: string | null
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [allowed, setAllowed] = useState<boolean | null>(null)

  useEffect(() => {
    if (!role) {
      setAllowed(true)
      return
    }
    const ok = canAccessRoute(role, pathname)
    setAllowed(ok)
    if (!ok) {
      router.replace('/dashboard?access=denied')
    }
  }, [role, pathname, router])

  if (allowed === null) {
    return (
      <div className="h-full flex items-center justify-center" style={{ color: 'var(--stone)' }}>
        <p className="text-[13px]">Loading…</p>
      </div>
    )
  }

  if (!allowed) return null

  return <>{children}</>
}

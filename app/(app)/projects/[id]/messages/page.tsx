'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default function ProjectMessagesRedirect() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`/api/messages/conversations/project?projectId=${encodeURIComponent(projectId)}`)
        const json = await res.json()
        if (cancelled) return
        if (res.ok && json.id) {
          router.replace(`/messages?c=${json.id}`)
          return
        }
      } catch {
        /* fall through */
      }
      if (!cancelled) router.replace('/messages')
    })()
    return () => {
      cancelled = true
    }
  }, [projectId, router])

  return (
    <div className="h-full flex items-center justify-center p-8">
      <p className="text-[13px]" style={{ color: 'var(--stone)' }}>
        Opening project chat…
      </p>
    </div>
  )
}

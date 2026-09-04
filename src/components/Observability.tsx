import { useEffect } from 'react'
import { initAnalytics } from '@/lib/observability/client'

/** Mounts env-gated analytics (PostHog) once per app load. */
export default function Observability() {
  useEffect(() => {
    void initAnalytics()
  }, [])

  return null
}

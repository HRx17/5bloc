import { Suspense } from 'react'
import AcceptInvitePage from './AcceptInviteClient'

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-navy flex items-center justify-center px-4">
          <div className="w-full max-w-md bg-navy-mid p-8 space-y-3" aria-busy="true">
            <span className="sr-only">Loading your invitation…</span>
            <div className="h-8 w-40 animate-pulse rounded bg-white/10" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-white/10" />
            <div className="h-10 w-full animate-pulse rounded-xl bg-white/10" />
          </div>
        </div>
      }
    >
      <AcceptInvitePage />
    </Suspense>
  )
}

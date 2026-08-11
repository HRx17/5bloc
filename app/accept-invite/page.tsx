import { Suspense } from 'react'
import AcceptInvitePage from './AcceptInviteClient'

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-navy" />}>
      <AcceptInvitePage />
    </Suspense>
  )
}

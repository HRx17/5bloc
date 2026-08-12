'use client'

import React from 'react'
import { useParams } from 'next/navigation'

export default function ProjectSettingsPage() {
  const params = useParams()
  const projectId = params.id as string

  return (
    <div className="max-w-xl space-y-4">
      <h2 className="text-xl font-semibold">Project settings</h2>
      <p className="text-sm" style={{ color: 'var(--stone)' }}>
        Project specs, fees and RERA details are edited on the{' '}
        <a href={`/projects/${projectId}`} className="text-amber">
          Overview
        </a>{' '}
        tab. Portal visibility and the share link live under{' '}
        <a href={`/projects/${projectId}/portal`} className="text-amber">
          Client Portal
        </a>
        , and archiving is in the ⋯ menu at the top of the project.
      </p>
      <div className="p-4 rounded-xl" style={{ background: 'var(--surface-container)' }}>
        <p className="text-[12px]" style={{ color: 'var(--stone)' }}>Project ID</p>
        <p className="font-mono text-sm mt-1">{projectId}</p>
      </div>
    </div>
  )
}

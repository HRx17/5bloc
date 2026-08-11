'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import OnboardingChecklist from '@/components/layout/OnboardingChecklist'

export default function DashboardPage() {
  const [projects, setProjects] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [activity, setActivity] = useState<any[]>([])
  const [plan, setPlan] = useState('free')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/projects').then((r) => r.json()),
      fetch('/api/clients').then((r) => r.json()).catch(() => ({ clients: [] })),
      fetch('/api/activity?limit=8').then((r) => r.json()).catch(() => ({ activity: [] })),
      fetch('/api/me').then((r) => r.json()).catch(() => ({ profile: {} })),
    ])
      .then(([p, c, a, me]) => {
        setProjects(p.projects || [])
        setClients(c.clients || [])
        setActivity(a.activity || [])
        setPlan(me.profile?.plan || 'free')
      })
      .finally(() => setLoading(false))
  }, [])

  const active = projects.filter((p) => p.status === 'active').length
  const atLimit = plan === 'free' && projects.length >= 3

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[36px]">Workspace dashboard</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--stone)' }}>
            Projects, CRM contacts, and what needs attention.
          </p>
        </div>
        {atLimit ? (
          <Link href="/settings" className="btn-secondary text-[12px]">
            Upgrade to add projects
          </Link>
        ) : (
          <Link href="/projects/new" className="btn-primary text-[12px]">
            New project
          </Link>
        )}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active projects', value: active },
          { label: 'CRM contacts', value: clients.length },
          { label: 'Total projects', value: projects.length },
          {
            label: 'Pipeline value',
            value: `₹${clients.reduce((s, c) => s + Number(c.total_value || 0), 0).toLocaleString()}`,
          },
        ].map((k) => (
          <div
            key={k.label}
            className="p-5 rounded-2xl"
            style={{ background: 'var(--surface-container)', boxShadow: 'var(--shadow-2)' }}
          >
            <p className="text-[12px]" style={{ color: 'var(--stone)' }}>
              {k.label}
            </p>
            <p className="text-[24px] font-semibold mt-1">{loading ? '—' : k.value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2">
          <div className="flex justify-between mb-4">
            <h2 className="text-lg font-semibold">Projects</h2>
            <Link href="/projects" className="text-[12px]" style={{ color: 'var(--amber)' }}>
              View all
            </Link>
          </div>
          {loading ? (
            <p style={{ color: 'var(--stone)' }}>Loading…</p>
          ) : projects.length === 0 ? (
            <div className="p-8 rounded-2xl text-center" style={{ background: 'var(--surface-container)' }}>
              <p className="font-semibold">No projects yet</p>
              <p className="text-sm mt-1" style={{ color: 'var(--stone)' }}>
                Create your first project to invite contractors and open a client portal.
              </p>
              <Link href="/projects/new" className="btn-primary inline-flex mt-4 text-[12px]">
                Create project
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-3">
              {projects.slice(0, 4).map((p) => (
                <Link
                  key={p.id}
                  href={`/projects/${p.id}`}
                  className="p-4 rounded-xl block"
                  style={{ background: 'var(--surface-container)' }}
                >
                  <p className="font-semibold">{p.name}</p>
                  <p className="text-[12px] mt-1" style={{ color: 'var(--stone)' }}>
                    {p.city} · {String(p.phase || '').replaceAll('_', ' ')}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-4">Activity</h2>
          <div className="p-4 rounded-2xl space-y-3" style={{ background: 'var(--surface-container)' }}>
            {activity.length === 0 ? (
              <p className="text-[12px]" style={{ color: 'var(--stone)' }}>
                No recent activity
              </p>
            ) : (
              activity.map((a) => (
                <div key={a.id} className="text-[12px]">
                  <p className="font-medium">{a.entity_name || a.action}</p>
                  <p style={{ color: 'var(--stone)' }}>
                    {a.action} · {a.project_name || 'Project'} · {a.created_at?.slice(0, 10)}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <OnboardingChecklist />
    </div>
  )
}

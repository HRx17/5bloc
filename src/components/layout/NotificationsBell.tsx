'use client'

import React, { useEffect, useState } from 'react'
import Link from '@/compat/next-link'
import { supabase } from '@/integrations/supabase/client'

type Notification = {
  id: string
  title: string
  body?: string | null
  href?: string | null
  read_at?: string | null
  created_at: string
}

export default function NotificationsBell({ userId }: { userId?: string }) {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<Notification[]>([])

  const fetchNotifications = async () => {
    const { data } = await supabase
      .from('notifications')
      .select('id, title, body, href, read_at, created_at')
      .order('created_at', { ascending: false })
      .limit(20)
    return (data || []) as Notification[]
  }

  const load = async () => {
    try {
      setItems(await fetchNotifications())
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    let cancelled = false
    const refresh = async () => {
      try {
        const next = await fetchNotifications()
        if (!cancelled) setItems(next)
      } catch {
        // ignore
      }
    }
    refresh()
    const timer = setInterval(refresh, 60_000)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [userId])

  const unread = items.filter((n) => !n.read_at).length

  const markRead = async (id?: string, markAllRead?: boolean) => {
    setItems((prev) =>
      prev.map((n) =>
        markAllRead || n.id === id ? { ...n, read_at: n.read_at || new Date().toISOString() } : n
      )
    )
    try {
      const stamp = new Date().toISOString()
      let q = supabase.from('notifications').update({ read_at: stamp }).is('read_at', null)
      if (!markAllRead && id) q = q.eq('id', id)
      await q
    } catch {
      // ignore
    }
  }

  return (
    <div className="relative">
      <button
        className="w-8 h-8 flex items-center justify-center relative"
        style={{ color: 'var(--stone)' }}
        onClick={() => {
          setOpen((v) => !v)
          if (!open) load()
        }}
        aria-label="Notifications"
      >
        <span className="material-icons-outlined text-[18px]">notifications</span>
        {unread > 0 && (
          <span
            className="absolute top-1.5 right-1.5 w-1.5 h-1.5"
            style={{ background: 'var(--error)' }}
          />
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 mt-2 w-80 z-50 overflow-hidden"
            style={{
              background: 'var(--surface-container-high)',
              boxShadow: 'var(--shadow-4)',
              borderRadius: 12,
            }}
          >
            <div className="px-4 py-3 flex items-center justify-between gap-2">
              <p className="text-[13px] font-semibold" style={{ color: 'var(--on-surface)' }}>
                Notifications
              </p>
              <div className="flex items-center gap-2">
                <span className="text-[11px]" style={{ color: 'var(--stone)' }}>
                  {unread} unread
                </span>
                {unread > 0 && (
                  <button
                    type="button"
                    className="text-[10px] font-semibold"
                    style={{ color: 'var(--amber)' }}
                    onClick={() => markRead(undefined, true)}
                  >
                    Mark all
                  </button>
                )}
              </div>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {items.length === 0 ? (
                <p className="px-4 py-6 text-[12px]" style={{ color: 'var(--stone)' }}>
                  You&apos;re all caught up.
                </p>
              ) : (
                items.map((n) => (
                  <Link
                    key={n.id}
                    href={n.href || '#'}
                    onClick={() => {
                      if (!n.read_at) markRead(n.id)
                      setOpen(false)
                    }}
                    className="block px-4 py-3"
                    style={{
                      background: n.read_at ? 'transparent' : 'rgba(245,166,35,0.06)',
                      boxShadow: '0 1px 0 rgba(159,142,122,0.08)',
                    }}
                  >
                    <p className="text-[12px] font-semibold" style={{ color: 'var(--on-surface)' }}>
                      {n.title}
                    </p>
                    {n.body && (
                      <p className="text-[11px] mt-0.5" style={{ color: 'var(--stone)' }}>
                        {n.body}
                      </p>
                    )}
                  </Link>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

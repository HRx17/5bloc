import { useEffect, useRef } from 'react'
import { supabaseClient } from '@/lib/supabase/client'
import { hasSupabaseEnv } from '@/lib/data/client-data'

export type LiveReloadFn = (opts?: { quiet?: boolean }) => void | Promise<void>

/**
 * Keeps a list/detail screen in sync:
 * - quiet refetch on window focus / tab visible
 * - quiet refetch when any of `tables` change via Supabase Realtime
 */
export function useLiveReload(
  reload: LiveReloadFn,
  tables: readonly string[],
  opts?: { enabled?: boolean; debounceMs?: number }
) {
  const reloadRef = useRef(reload)
  reloadRef.current = reload
  const enabled = opts?.enabled ?? true
  const debounceMs = opts?.debounceMs ?? 280
  const tablesKey = tables.join(',')

  useEffect(() => {
    if (!enabled || !tablesKey) return

    let timer: ReturnType<typeof setTimeout> | null = null
    const schedule = () => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        void reloadRef.current({ quiet: true })
      }, debounceMs)
    }

    const onVisible = () => {
      if (document.visibilityState === 'visible') schedule()
    }
    window.addEventListener('focus', onVisible)
    document.addEventListener('visibilitychange', onVisible)

    if (!hasSupabaseEnv()) {
      return () => {
        if (timer) clearTimeout(timer)
        window.removeEventListener('focus', onVisible)
        document.removeEventListener('visibilitychange', onVisible)
      }
    }

    let channel: ReturnType<typeof supabaseClient.channel> | null = null
    let cancelled = false

    ;(async () => {
      try {
        const {
          data: { session },
        } = await supabaseClient.auth.getSession()
        if (session?.access_token) supabaseClient.realtime.setAuth(session.access_token)
      } catch {
        /* ignore */
      }
      if (cancelled) return

      const name = `live-${tablesKey}-${Math.random().toString(36).slice(2, 8)}`
      let ch = supabaseClient.channel(name)
      for (const table of tablesKey.split(',')) {
        ch = ch.on('postgres_changes', { event: '*', schema: 'public', table }, schedule)
      }
      channel = ch.subscribe()
    })()

    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
      window.removeEventListener('focus', onVisible)
      document.removeEventListener('visibilitychange', onVisible)
      if (channel) void supabaseClient.removeChannel(channel)
    }
  }, [enabled, debounceMs, tablesKey])
}

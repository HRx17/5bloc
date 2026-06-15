'use client'

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { supabaseClient } from '@/lib/supabase/client'
import { getMyProfile, listConversations } from '@/lib/data/messages'
import { hasSupabaseEnv } from '@/lib/data/client-data'
import { useToast } from '@/components/ui/Toast'

export interface MessageNotification {
  id: string
  conversationId: string
  senderName: string
  body: string
  at: string
  read: boolean
}

interface MessagesContextValue {
  myId: string | null
  unreadCount: number
  notifications: MessageNotification[]
  setActiveConversation: (id: string | null) => void
  refreshUnread: () => Promise<void>
  markNotificationsSeen: () => void
}

const MessagesContext = createContext<MessagesContextValue>({
  myId: null,
  unreadCount: 0,
  notifications: [],
  setActiveConversation: () => {},
  refreshUnread: async () => {},
  markNotificationsSeen: () => {},
})

export function useMessages() {
  return useContext(MessagesContext)
}

export function MessagesProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast()
  const [myId, setMyId] = useState<string | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<MessageNotification[]>([])
  const activeConvRef = useRef<string | null>(null)
  const myIdRef = useRef<string | null>(null)

  const setActiveConversation = useCallback((id: string | null) => {
    activeConvRef.current = id
  }, [])

  const refreshUnread = useCallback(async () => {
    const id = myIdRef.current
    if (!id) return
    try {
      const convs = await listConversations(id)
      setUnreadCount(convs.reduce((sum, c) => sum + c.unread, 0))
    } catch {
      /* ignore */
    }
  }, [])

  const markNotificationsSeen = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }, [])

  useEffect(() => {
    if (!hasSupabaseEnv()) return
    let channel: ReturnType<typeof supabaseClient.channel> | null = null
    let cancelled = false

    ;(async () => {
      // Ensure the realtime socket authenticates with the user's token so
      // RLS-filtered postgres_changes are actually delivered.
      try {
        const { data: { session } } = await supabaseClient.auth.getSession()
        if (session?.access_token) supabaseClient.realtime.setAuth(session.access_token)
      } catch { /* ignore */ }

      const me = await getMyProfile()
      if (cancelled || !me) return
      setMyId(me.id)
      myIdRef.current = me.id
      await refreshUnread()

      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
        try { Notification.requestPermission() } catch { /* ignore */ }
      }

      channel = supabaseClient
        .channel('global-messages')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages' },
          async (payload) => {
            const msg = payload.new as {
              id: string
              conversation_id: string
              sender_id: string | null
              body: string
              created_at: string
            }
            // Ignore our own messages
            if (!msg.sender_id || msg.sender_id === myIdRef.current) return

            // Resolve sender name (best-effort)
            let senderName = 'New message'
            try {
              const { data } = await supabaseClient
                .from('profiles')
                .select('full_name, email')
                .eq('id', msg.sender_id)
                .maybeSingle()
              senderName = data?.full_name || data?.email || 'New message'
            } catch { /* ignore */ }

            setNotifications((prev) => [
              {
                id: msg.id,
                conversationId: msg.conversation_id,
                senderName,
                body: msg.body,
                at: msg.created_at,
                read: false,
              },
              ...prev,
            ].slice(0, 25))

            const isActive = activeConvRef.current === msg.conversation_id
            if (!isActive) {
              setUnreadCount((c) => c + 1)
              const preview = msg.body.length > 80 ? msg.body.slice(0, 80) + '…' : msg.body
              toast(`${senderName}: ${preview}`, 'info')
              if (
                typeof window !== 'undefined' &&
                'Notification' in window &&
                Notification.permission === 'granted' &&
                document.visibilityState === 'hidden'
              ) {
                try {
                  new Notification(senderName, { body: preview, tag: msg.conversation_id })
                } catch { /* ignore */ }
              }
            }
          },
        )
        .subscribe()
    })()

    return () => {
      cancelled = true
      if (channel) supabaseClient.removeChannel(channel)
    }
  }, [refreshUnread, toast])

  return (
    <MessagesContext.Provider
      value={{ myId, unreadCount, notifications, setActiveConversation, refreshUnread, markNotificationsSeen }}
    >
      {children}
    </MessagesContext.Provider>
  )
}

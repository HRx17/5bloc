import React, { createContext, useContext, useState } from 'react'

export interface MessageNotification {
  id: string
  conversationId: string
  senderName: string
  body: string
  at: string
  read: boolean
  projectName?: string | null
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

/**
 * Lightweight messaging context for the app shell. Live conversation data is
 * wired up when the messages screens are ported.
 */
export function MessagesProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<MessageNotification[]>([])

  const value: MessagesContextValue = {
    myId: null,
    unreadCount: notifications.filter((n) => !n.read).length,
    notifications,
    setActiveConversation: () => {},
    refreshUnread: async () => {},
    markNotificationsSeen: () =>
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true }))),
  }

  return <MessagesContext.Provider value={value}>{children}</MessagesContext.Provider>
}

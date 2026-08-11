'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

interface Thread {
  id:           string
  subject:      string
  from:         string
  date:         string
  snippet:      string
  messageCount: number
  unread:       boolean
}

interface Message {
  id:      string
  subject: string
  from:    string
  to:      string
  date:    string
  snippet: string
  body:    string
}

function senderName(from: string) {
  const m = from.match(/^"?([^"<]+)"?\s*</)
  return m ? m[1].trim() : from.replace(/<.*>/, '').trim() || from
}

function relativeTime(dateStr: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  const diff = Date.now() - d.getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 1)   return 'just now'
  if (mins < 60)  return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7)   return `${days}d ago`
  return d.toLocaleDateString('en', { month: 'short', day: 'numeric' })
}

export function GmailPanel({ className = '' }: { className?: string }) {
  const [threads, setThreads]         = useState<Thread[]>([])
  const [loading, setLoading]         = useState(true)
  const [notConnected, setNotConnected] = useState(false)
  const [search, setSearch]           = useState('')
  const [selected, setSelected]       = useState<string | null>(null)
  const [messages, setMessages]       = useState<Message[]>([])
  const [loadingThread, setLoadingThread] = useState(false)

  const fetchThreads = useCallback(async (q = '') => {
    setLoading(true)
    try {
      const res  = await fetch(`/api/integrations/google/gmail?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      if (data.notConnected) { setNotConnected(true); return }
      setThreads(data.threads ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchThreads() }, [fetchThreads])

  const openThread = async (id: string) => {
    setSelected(id)
    setLoadingThread(true)
    try {
      const res  = await fetch(`/api/integrations/google/gmail?threadId=${id}`)
      const data = await res.json()
      setMessages(data.messages ?? [])
    } finally {
      setLoadingThread(false)
    }
  }

  if (notConnected) {
    return (
      <div className={`flex flex-col items-center justify-center py-12 text-center ${className}`}>
        <span className="material-icons-outlined text-[32px] mb-3" style={{ color: 'var(--stone)' }}>mail_outline</span>
        <p className="text-sm font-semibold" style={{ color: 'var(--on-surface)' }}>Gmail not connected</p>
        <p className="text-xs mt-1 mb-4" style={{ color: 'var(--stone)' }}>Connect Google to see your inbox here</p>
        <Link href="/integrations" className="btn-primary py-2 px-4 text-xs rounded-lg">Connect Google</Link>
      </div>
    )
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Search bar */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <span className="material-icons-outlined text-[16px]" style={{ color: 'var(--stone)' }}>search</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchThreads(search)}
            placeholder="Search mail…"
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: 'var(--on-surface)' }}
          />
        </div>
        <button
          onClick={() => fetchThreads(search)}
          className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors"
          style={{ background: 'rgba(255,255,255,0.05)' }}
        >
          <span className="material-icons-outlined text-[16px]" style={{ color: 'var(--stone)' }}>refresh</span>
        </button>
      </div>

      <div className="flex-1 overflow-hidden flex">
        {/* Thread list */}
        <div className={`flex flex-col gap-1 overflow-y-auto pr-1 transition-all ${selected ? 'w-2/5 shrink-0' : 'w-full'}`}
          style={{ scrollbarWidth: 'none' }}>
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-14 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
            ))
          ) : threads.length === 0 ? (
            <div className="text-center py-10 text-sm" style={{ color: 'var(--stone)' }}>No messages</div>
          ) : threads.map(t => (
            <button
              key={t.id}
              onClick={() => openThread(t.id)}
              className="text-left px-3 py-2.5 rounded-xl transition-all"
              style={{
                background: selected === t.id ? 'rgba(245,166,35,0.08)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${selected === t.id ? 'rgba(245,166,35,0.2)' : 'transparent'}`,
              }}
            >
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <span className={`text-xs truncate ${t.unread ? 'font-bold' : 'font-medium'}`}
                  style={{ color: t.unread ? 'var(--on-surface)' : 'var(--on-surface-variant)' }}>
                  {senderName(t.from)}
                </span>
                <span className="text-[10px] shrink-0" style={{ color: 'var(--stone)' }}>{relativeTime(t.date)}</span>
              </div>
              <p className={`text-[11px] truncate ${t.unread ? 'font-semibold' : ''}`}
                style={{ color: t.unread ? 'var(--on-surface)' : 'var(--on-surface-variant)' }}>
                {t.subject}
              </p>
              <p className="text-[10px] truncate mt-0.5" style={{ color: 'var(--stone)' }}>{t.snippet}</p>
            </button>
          ))}
        </div>

        {/* Thread detail */}
        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.18 }}
              className="flex-1 ml-3 flex flex-col overflow-hidden rounded-xl"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              {/* Thread header */}
              <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <button onClick={() => setSelected(null)} className="mr-1" style={{ color: 'var(--stone)' }}>
                  <span className="material-icons-outlined text-[18px]">arrow_back</span>
                </button>
                <p className="text-sm font-semibold flex-1 truncate" style={{ color: 'var(--on-surface)' }}>
                  {messages[0]?.subject ?? threads.find(t => t.id === selected)?.subject ?? ''}
                </p>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3" style={{ scrollbarWidth: 'none' }}>
                {loadingThread ? (
                  Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="h-24 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
                  ))
                ) : messages.map((msg, idx) => (
                  <div key={msg.id} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-semibold" style={{ color: 'var(--on-surface)' }}>{senderName(msg.from)}</span>
                      <span className="text-[10px]" style={{ color: 'var(--stone)' }}>{relativeTime(msg.date)}</span>
                    </div>
                    <p className="text-[10px] mb-2" style={{ color: 'var(--stone)' }}>to {msg.to}</p>
                    <div className="text-xs leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--on-surface-variant)' }}>
                      {msg.body || msg.snippet}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

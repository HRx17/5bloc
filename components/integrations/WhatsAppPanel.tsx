'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from '@/components/ui/Toast'

interface Contact {
  phone:   string
  lastMsg: string
  lastAt:  string
  unread:  number
}

interface Message {
  id:          string
  message_id:  string
  from_number: string
  to_number:   string
  text:        string | null
  type:        string
  direction:   'inbound' | 'outbound'
  status:      string
  received_at: string
}

function formatPhone(phone: string) {
  if (phone.length === 12 && phone.startsWith('91')) {
    return `+91 ${phone.slice(2, 7)} ${phone.slice(7)}`
  }
  return `+${phone}`
}

function relTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 1)   return 'now'
  if (mins < 60)  return `${mins}m`
  if (hours < 24) return `${hours}h`
  return `${days}d`
}

export function WhatsAppPanel({ className = '' }: { className?: string }) {
  const { toast } = useToast()
  const [contacts, setContacts]         = useState<Contact[]>([])
  const [selected, setSelected]         = useState<string | null>(null)
  const [messages, setMessages]         = useState<Message[]>([])
  const [loading, setLoading]           = useState(true)
  const [loadingMsgs, setLoadingMsgs]   = useState(false)
  const [sending, setSending]           = useState(false)
  const [newMsg, setNewMsg]             = useState('')
  const [newPhone, setNewPhone]         = useState('')
  const [showNewChat, setShowNewChat]   = useState(false)
  const [tableNotFound, setTableNotFound] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLInputElement>(null)

  const loadContacts = useCallback(async () => {
    try {
      const res  = await fetch('/api/integrations/whatsapp/messages')
      const data = await res.json()
      if (data.tableNotFound) { setTableNotFound(true); return }
      setContacts(data.contacts ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  const loadMessages = useCallback(async (phone: string) => {
    setLoadingMsgs(true)
    try {
      const res  = await fetch(`/api/integrations/whatsapp/messages?phone=${phone}`)
      const data = await res.json()
      setMessages((data.messages ?? []).reverse())
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    } finally {
      setLoadingMsgs(false)
    }
  }, [])

  useEffect(() => { loadContacts() }, [loadContacts])

  useEffect(() => {
    if (selected) loadMessages(selected)
  }, [selected, loadMessages])

  const sendMessage = async () => {
    const to   = selected ?? newPhone.replace(/[\s\-\(\)\+]/g, '')
    const text = newMsg.trim()
    if (!to || !text) return

    setSending(true)
    try {
      const res  = await fetch('/api/integrations/whatsapp/send', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ to, text }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Send failed')
      setNewMsg('')
      setShowNewChat(false)
      if (!selected) {
        setSelected(to)
        loadContacts()
      } else {
        loadMessages(selected)
      }
      toast('Message sent', 'success')
    } catch (e: any) {
      toast(e.message ?? 'Failed to send', 'error')
    } finally {
      setSending(false)
    }
  }

  if (tableNotFound) {
    return (
      <div className={`flex flex-col items-center justify-center py-10 text-center ${className}`}>
        <span className="material-icons-outlined text-[32px] mb-3" style={{ color: '#25D366' }}>chat</span>
        <p className="text-sm font-semibold mb-1" style={{ color: 'var(--on-surface)' }}>Almost ready</p>
        <p className="text-xs mb-1" style={{ color: 'var(--stone)' }}>Run the SQL below in Supabase to activate:</p>
        <pre className="text-[10px] text-left p-3 rounded-xl mt-2 overflow-x-auto max-w-full"
          style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--stone)' }}>
{`create table if not exists public.whatsapp_messages (
  id           uuid primary key default gen_random_uuid(),
  message_id   text unique not null,
  from_number  text not null,
  to_number    text,
  type         text default 'text',
  text         text,
  media_id     text,
  filename     text,
  direction    text not null default 'inbound',
  status       text default 'received',
  received_at  timestamptz default now()
);
alter table public.whatsapp_messages enable row level security;
create policy "Auth read" on public.whatsapp_messages
  for select using (auth.role() = 'authenticated');
create policy "Service insert" on public.whatsapp_messages
  for insert with check (true);`}
        </pre>
      </div>
    )
  }

  return (
    <div className={`flex h-full overflow-hidden rounded-2xl ${className}`}
      style={{ border: '1px solid rgba(255,255,255,0.06)' }}>

      {/* ── Contact list ── */}
      <div className="w-64 shrink-0 flex flex-col border-r" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: '#25D366' }} />
            <span className="text-xs font-bold" style={{ color: 'var(--on-surface)' }}>WhatsApp</span>
          </div>
          <button onClick={() => setShowNewChat(true)}
            className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors hover:bg-white/10"
            title="New message">
            <span className="material-icons-outlined text-[16px]" style={{ color: 'var(--stone)' }}>edit</span>
          </button>
        </div>

        {/* Contacts */}
        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-14 mx-2 my-1 rounded-xl animate-pulse"
                style={{ background: 'rgba(255,255,255,0.04)' }} />
            ))
          ) : contacts.length === 0 ? (
            <div className="text-center py-8 px-3">
              <p className="text-xs" style={{ color: 'var(--stone)' }}>No conversations yet</p>
              <button onClick={() => setShowNewChat(true)}
                className="mt-2 text-[11px] underline" style={{ color: '#25D366' }}>
                Start one
              </button>
            </div>
          ) : contacts.map(c => (
            <button key={c.phone}
              onClick={() => setSelected(c.phone)}
              className="w-full text-left flex items-center gap-2.5 px-3 py-2.5 transition-colors"
              style={{ background: selected === c.phone ? 'rgba(37,211,102,0.08)' : 'transparent' }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
                style={{ background: 'rgba(37,211,102,0.15)', color: '#25D366' }}>
                {c.phone.slice(-2)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold truncate" style={{ color: 'var(--on-surface)' }}>
                    {formatPhone(c.phone)}
                  </span>
                  <span className="text-[10px] shrink-0 ml-1" style={{ color: 'var(--stone)' }}>
                    {relTime(c.lastAt)}
                  </span>
                </div>
                <p className="text-[11px] truncate" style={{ color: 'var(--stone)' }}>{c.lastMsg}</p>
              </div>
              {c.unread > 0 && (
                <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0"
                  style={{ background: '#25D366', color: '#fff' }}>
                  {c.unread}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Chat area ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <AnimatePresence mode="wait">
          {selected ? (
            <motion.div key={selected} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col h-full">
              {/* Chat header */}
              <div className="flex items-center gap-3 px-4 py-3 shrink-0"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: 'rgba(37,211,102,0.15)', color: '#25D366' }}>
                  {selected.slice(-2)}
                </div>
                <div>
                  <p className="text-xs font-semibold" style={{ color: 'var(--on-surface)' }}>{formatPhone(selected)}</p>
                  <p className="text-[10px]" style={{ color: '#25D366' }}>WhatsApp</p>
                </div>
                <button onClick={() => { setSelected(null); setMessages([]) }}
                  className="ml-auto" style={{ color: 'var(--stone)' }}>
                  <span className="material-icons-outlined text-[18px]">close</span>
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2" style={{ scrollbarWidth: 'none' }}>
                {loadingMsgs ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className={`h-8 w-48 rounded-xl animate-pulse ${i % 2 === 0 ? '' : 'ml-auto'}`}
                      style={{ background: 'rgba(255,255,255,0.05)' }} />
                  ))
                ) : messages.map(msg => (
                  <div key={msg.id}
                    className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}>
                    <div className="max-w-[75%] px-3 py-2 rounded-2xl text-xs leading-relaxed"
                      style={msg.direction === 'outbound'
                        ? { background: 'rgba(37,211,102,0.15)', color: 'var(--on-surface)', borderBottomRightRadius: 4 }
                        : { background: 'rgba(255,255,255,0.07)', color: 'var(--on-surface)', borderBottomLeftRadius: 4 }
                      }>
                      {msg.text ?? `[${msg.type}]`}
                      <span className="block text-[9px] mt-1 opacity-50">
                        {new Date(msg.received_at).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}
                        {msg.direction === 'outbound' && (
                          <span className="ml-1">{msg.status === 'sent' ? '✓' : '✓✓'}</span>
                        )}
                      </span>
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="p-3 shrink-0 flex items-center gap-2"
                style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <input
                  ref={inputRef}
                  value={newMsg}
                  onChange={e => setNewMsg(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder="Type a message…"
                  className="flex-1 px-3 py-2 rounded-xl text-xs outline-none"
                  style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--on-surface)', border: '1px solid rgba(255,255,255,0.08)' }}
                />
                <button onClick={sendMessage} disabled={sending || !newMsg.trim()}
                  className="w-8 h-8 flex items-center justify-center rounded-full transition-all disabled:opacity-40"
                  style={{ background: '#25D366' }}>
                  <span className="material-icons-outlined text-[16px] text-white">send</span>
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-full text-center">
              <span className="text-[40px] mb-3">💬</span>
              <p className="text-sm font-semibold" style={{ color: 'var(--on-surface)' }}>Select a conversation</p>
              <p className="text-xs mt-1" style={{ color: 'var(--stone)' }}>or start a new one</p>
              <button onClick={() => setShowNewChat(true)}
                className="mt-4 btn-primary py-2 px-4 text-xs rounded-lg">
                New Message
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── New Chat modal ── */}
      <AnimatePresence>
        {showNewChat && (
          <>
            <motion.div className="absolute inset-0 z-40" style={{ background: 'rgba(0,0,0,0.5)' }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowNewChat(false)} />
            <motion.div
              className="absolute left-1/2 top-1/2 z-50 w-80 rounded-2xl p-5 shadow-2xl"
              style={{ background: 'var(--surface-2)', border: '1px solid rgba(255,255,255,0.1)', transform: 'translate(-50%,-50%)' }}
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            >
              <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--on-surface)' }}>New WhatsApp Message</h3>
              <label className="block text-[11px] font-semibold mb-1" style={{ color: 'var(--stone)' }}>
                Phone number (with country code)
              </label>
              <input
                value={newPhone}
                onChange={e => setNewPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3 py-2 rounded-xl text-xs mb-3 outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--on-surface)', border: '1px solid rgba(255,255,255,0.10)' }}
              />
              <label className="block text-[11px] font-semibold mb-1" style={{ color: 'var(--stone)' }}>Message</label>
              <textarea
                value={newMsg}
                onChange={e => setNewMsg(e.target.value)}
                placeholder="Type your message…"
                rows={3}
                className="w-full px-3 py-2 rounded-xl text-xs mb-4 outline-none resize-none"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--on-surface)', border: '1px solid rgba(255,255,255,0.10)' }}
              />
              <div className="flex gap-2">
                <button onClick={() => setShowNewChat(false)}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold"
                  style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--stone)' }}>
                  Cancel
                </button>
                <button onClick={sendMessage} disabled={sending || !newPhone || !newMsg.trim()}
                  className="flex-1 py-2 rounded-xl text-xs font-bold disabled:opacity-40"
                  style={{ background: '#25D366', color: '#fff' }}>
                  {sending ? 'Sending…' : 'Send'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

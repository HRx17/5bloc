'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'

interface Message {
  id: string
  sender: string
  role: string
  text: string
  timestamp: string
  channel: string
  created_at?: string
}

function formatTime(iso?: string) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

/** Project chat — persisted via Supabase channel conversations. */
export default function ProjectMessages() {
  const params = useParams()
  const projectId = params.id as string
  const chatEndRef = useRef<HTMLDivElement>(null)

  const [channels] = useState<string[]>(['general', 'structural', 'mep', 'interior-finishes'])
  const [activeChannel, setActiveChannel] = useState('general')
  const [messages, setMessages] = useState<Message[]>([])
  const [textInput, setTextInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    fetch(`/api/projects/${projectId}/messages?channel=${encodeURIComponent(activeChannel)}`)
      .then(async (r) => {
        const d = await r.json()
        if (!r.ok) throw new Error(d.error || 'Failed to load messages')
        if (cancelled) return
        const list = (d.messages || []).map((m: any) => ({
          id: m.id,
          sender: m.sender || 'Member',
          role: m.role || 'member',
          text: m.text || m.body || '',
          created_at: m.created_at,
          timestamp: formatTime(m.created_at),
          channel: activeChannel,
        }))
        setMessages(list)
      })
      .catch((e) => {
        if (!cancelled) setError(e.message || 'Failed to load')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [projectId, activeChannel])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, activeChannel])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!textInput.trim() || sending) return
    setSending(true)
    setError('')
    try {
      const res = await fetch(`/api/projects/${projectId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: activeChannel, text: textInput.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Send failed')
      const m = data.message
      setMessages((prev) => [
        ...prev,
        {
          id: m.id,
          sender: m.sender || 'You',
          role: m.role || 'member',
          text: m.text || textInput.trim(),
          created_at: m.created_at,
          timestamp: formatTime(m.created_at) || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          channel: activeChannel,
        },
      ])
      setTextInput('')
    } catch (err: any) {
      setError(err?.message || 'Send failed')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-4 font-body">
      <div className="card-5bloc p-4">
        <h3 className="text-sm font-semibold text-white">Project messages</h3>
        <p className="text-[11px] text-stone mt-1">
          Channels sync for all project members.
        </p>
        {error && <p className="text-[11px] text-red-400 mt-2">{error}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 min-h-[420px]">
        <div className="card-5bloc p-3 space-y-1">
          {channels.map((ch) => (
            <button
              key={ch}
              type="button"
              onClick={() => setActiveChannel(ch)}
              className="w-full text-left text-xs px-3 py-2 rounded-lg"
              style={{
                background: activeChannel === ch ? 'rgba(245,166,35,0.12)' : 'transparent',
                color: activeChannel === ch ? 'var(--amber)' : 'var(--stone)',
              }}
            >
              #{ch}
            </button>
          ))}
        </div>

        <div className="md:col-span-3 card-5bloc flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[320px]">
            {loading ? (
              <p className="text-xs text-stone text-center py-16">Loading…</p>
            ) : messages.length === 0 ? (
              <p className="text-xs text-stone text-center py-16">
                No messages in #{activeChannel}. Say hi to start the conversation.
              </p>
            ) : (
              messages.map((m) => (
                <div key={m.id} className="text-xs">
                  <span className="font-semibold text-white">{m.sender}</span>
                  <span className="text-stone ml-2">
                    {m.role} · {m.timestamp}
                  </span>
                  <p className="mt-1 text-stone">{m.text}</p>
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>
          <form onSubmit={handleSend} className="p-3 border-t flex gap-2">
            <input
              className="input-5bloc flex-1 text-xs"
              placeholder={`Message #${activeChannel}`}
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              disabled={sending}
            />
            <button type="submit" className="btn-primary text-xs" disabled={sending || !textInput.trim()}>
              {sending ? '…' : 'Send'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

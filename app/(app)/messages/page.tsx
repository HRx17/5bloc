'use client'

import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabaseClient } from '@/lib/supabase/client'
import { hasSupabaseEnv } from '@/lib/data/client-data'
import { useMessages } from '@/components/messages/MessagesProvider'
import {
  type ChatConversation,
  type ChatMessage,
  type ChatProfile,
  getMyProfile,
  listConversations,
  listMessages,
  sendMessage,
  markConversationRead,
  conversationTitle,
  initialsOf,
  relativeTime,
} from '@/lib/data/messages'

interface SearchUser {
  id: string
  full_name: string | null
  email: string | null
  role: string | null
  avatar_url: string | null
}

export default function MessagesPage() {
  return (
    <Suspense fallback={null}>
      <Messenger />
    </Suspense>
  )
}

function Messenger() {
  const searchParams = useSearchParams()
  const { setActiveConversation, refreshUnread } = useMessages()

  const [me, setMe] = useState<ChatProfile | null>(null)
  const [conversations, setConversations] = useState<ChatConversation[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loadingConvs, setLoadingConvs] = useState(true)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [convSearch, setConvSearch] = useState('')
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showAdd, setShowAdd] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)
  const activeIdRef = useRef<string | null>(null)
  const noEnv = !hasSupabaseEnv()

  // Initial load
  useEffect(() => {
    if (noEnv) { setLoadingConvs(false); return }
    let cancelled = false
    ;(async () => {
      const profile = await getMyProfile()
      if (cancelled) return
      setMe(profile)
      if (!profile) { setLoadingConvs(false); return }
      const convs = await listConversations(profile.id)
      if (cancelled) return
      setConversations(convs)
      setLoadingConvs(false)
      const requested = searchParams.get('c')
      if (requested && convs.some((c) => c.id === requested)) {
        openConversation(requested, profile)
      }
    })()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Realtime: live messages for the open conversation
  useEffect(() => {
    if (noEnv || !activeId) return
    const channel = supabaseClient
      .channel(`conv-${activeId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${activeId}` },
        async (payload) => {
          const row = payload.new as ChatMessage
          setMessages((prev) => {
            if (prev.some((m) => m.id === row.id)) return prev
            return [...prev, row]
          })
          // Hydrate sender info if missing
          if (row.sender_id) {
            const { data } = await supabaseClient
              .from('profiles')
              .select('id, full_name, email, role, avatar_url')
              .eq('id', row.sender_id)
              .maybeSingle()
            if (data) {
              setMessages((prev) => prev.map((m) => (m.id === row.id ? { ...m, sender: data } : m)))
            }
          }
          if (me) markConversationRead(activeId, me.id)
        },
      )
      .subscribe()
    return () => { supabaseClient.removeChannel(channel) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, me])

  // Auto-scroll to newest
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages])

  async function openConversation(id: string, profile?: ChatProfile | null) {
    const myProfile = profile ?? me
    setActiveId(id)
    activeIdRef.current = id
    setActiveConversation(id)
    setLoadingMsgs(true)
    const msgs = await listMessages(id)
    setMessages(msgs)
    setLoadingMsgs(false)
    if (myProfile) {
      await markConversationRead(id, myProfile.id)
      setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, unread: 0 } : c)))
      refreshUnread()
    }
  }

  async function handleSend() {
    const text = draft.trim()
    if (!text || !activeId || !me || sending) return
    setSending(true)
    setDraft('')
    const sent = await sendMessage(activeId, me.id, text)
    setSending(false)
    if (sent) {
      setMessages((prev) => (prev.some((m) => m.id === sent.id) ? prev : [...prev, sent]))
      setConversations((prev) =>
        prev
          .map((c) => (c.id === activeId ? { ...c, lastMessage: { body: text, sender_id: me.id, created_at: sent.created_at }, last_message_at: sent.created_at } : c))
          .sort((a, b) => b.last_message_at.localeCompare(a.last_message_at)),
      )
    } else {
      setDraft(text)
    }
  }

  async function reloadConversations(selectId?: string) {
    if (!me) return
    const convs = await listConversations(me.id)
    setConversations(convs)
    if (selectId) openConversation(selectId, me)
  }

  const active = conversations.find((c) => c.id === activeId) || null
  const filteredConvs = useMemo(() => {
    const q = convSearch.trim().toLowerCase()
    if (!q || !me) return conversations
    return conversations.filter((c) => conversationTitle(c, me.id).toLowerCase().includes(q))
  }, [conversations, convSearch, me])

  if (noEnv) {
    return (
      <div className="h-full flex items-center justify-center p-8 text-center">
        <p className="text-sm" style={{ color: 'var(--stone)' }}>
          Connect Supabase to enable real-time messaging.
        </p>
      </div>
    )
  }

  return (
    <div className="h-full flex" style={{ background: 'var(--surface-canvas)' }}>
      {/* ── Conversation list ── */}
      <aside
        className={`${activeId ? 'hidden md:flex' : 'flex'} w-full md:w-[320px] shrink-0 flex-col`}
        style={{ boxShadow: 'inset -1px 0 0 var(--hairline)', background: 'var(--surface-container-low)' }}
      >
        <div className="h-[52px] px-4 flex items-center justify-between shrink-0" style={{ boxShadow: '0 1px 0 var(--hairline)' }}>
          <h1 className="text-[15px] font-bold" style={{ color: 'var(--on-surface)' }}>Messages</h1>
          <button
            onClick={() => setShowNew(true)}
            className="h-8 w-8 flex items-center justify-center rounded-xl transition-colors"
            style={{ background: 'rgba(245,166,35,0.12)', color: 'var(--amber)' }}
            title="New message"
            aria-label="New message"
          >
            <span className="material-icons-outlined text-[18px]">edit_square</span>
          </button>
        </div>

        <div className="px-3 py-2.5 shrink-0">
          <div className="search-5bloc">
            <span className="material-icons-outlined">search</span>
            <input value={convSearch} onChange={(e) => setConvSearch(e.target.value)} placeholder="Search conversations…" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-3">
          {loadingConvs ? (
            <div className="px-3 py-6 text-center text-[12px]" style={{ color: 'var(--stone)' }}>Loading…</div>
          ) : filteredConvs.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <span className="material-icons-outlined text-[32px] mb-2" style={{ color: 'var(--stone)', opacity: 0.5 }}>forum</span>
              <p className="text-[13px] font-medium" style={{ color: 'var(--on-surface-variant)' }}>No conversations yet</p>
              <p className="text-[12px] mt-1 mb-3" style={{ color: 'var(--stone)' }}>Start chatting with your team and collaborators.</p>
              <button onClick={() => setShowNew(true)} className="btn-primary text-[12px] py-2">New message</button>
            </div>
          ) : (
            filteredConvs.map((c) => {
              const title = me ? conversationTitle(c, me.id) : 'Conversation'
              const isActive = c.id === activeId
              const preview = c.lastMessage
                ? (c.lastMessage.sender_id === me?.id ? 'You: ' : '') + c.lastMessage.body
                : 'No messages yet'
              return (
                <button
                  key={c.id}
                  onClick={() => openConversation(c.id)}
                  className="flex items-center gap-3 w-full px-2.5 py-2.5 rounded-xl text-left transition-colors mb-0.5"
                  style={{ background: isActive ? 'var(--overlay-active)' : 'transparent' }}
                  onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'var(--overlay-hover)' }}
                  onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                >
                  <ConvAvatar conv={c} myId={me?.id} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[13px] font-semibold truncate" style={{ color: 'var(--on-surface)' }}>{title}</span>
                      <span className="text-[10px] shrink-0" style={{ color: 'var(--stone)' }}>
                        {c.lastMessage ? relativeTime(c.lastMessage.created_at) : ''}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[12px] truncate" style={{ color: c.unread > 0 ? 'var(--on-surface-variant)' : 'var(--stone)', fontWeight: c.unread > 0 ? 600 : 400 }}>
                        {preview}
                      </span>
                      {c.unread > 0 && (
                        <span className="text-[9px] font-mono font-bold min-w-[16px] h-[16px] px-1 flex items-center justify-center rounded-full shrink-0" style={{ background: 'var(--amber)', color: 'var(--ink-black)' }}>
                          {c.unread > 9 ? '9+' : c.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </aside>

      {/* ── Thread ── */}
      <section className={`${activeId ? 'flex' : 'hidden md:flex'} flex-1 flex-col min-w-0`}>
        {!active ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <span className="material-icons-outlined text-[44px] mb-3" style={{ color: 'var(--stone)', opacity: 0.4 }}>chat</span>
            <p className="text-[15px] font-semibold" style={{ color: 'var(--on-surface-variant)' }}>Your messages</p>
            <p className="text-[13px] mt-1 max-w-xs" style={{ color: 'var(--stone)' }}>
              Select a conversation or start a new one to chat in real time.
            </p>
          </div>
        ) : (
          <>
            {/* Thread header */}
            <div className="h-[52px] px-4 flex items-center justify-between shrink-0" style={{ boxShadow: '0 1px 0 var(--hairline)', background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)' }}>
              <div className="flex items-center gap-3 min-w-0">
                <button onClick={() => { setActiveId(null); setActiveConversation(null) }} className="md:hidden h-8 w-8 flex items-center justify-center rounded-xl" style={{ color: 'var(--stone)' }}>
                  <span className="material-icons-outlined text-[18px]">arrow_back</span>
                </button>
                <ConvAvatar conv={active} myId={me?.id} />
                <div className="min-w-0">
                  <p className="text-[13.5px] font-bold truncate" style={{ color: 'var(--on-surface)' }}>
                    {me ? conversationTitle(active, me.id) : 'Conversation'}
                  </p>
                  <p className="text-[11px] truncate" style={{ color: 'var(--stone)' }}>
                    {active.members.length} {active.members.length === 1 ? 'member' : 'members'}
                    {active.type === 'project' ? ' · Project chat' : ''}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAdd(true)}
                className="flex items-center gap-1.5 px-3 h-8 rounded-xl text-[12px] font-semibold transition-colors"
                style={{ background: 'var(--overlay-hover)', color: 'var(--on-surface-variant)' }}
                title="Add people"
              >
                <span className="material-icons-outlined text-[16px]">person_add</span>
                <span className="hidden sm:inline">Add</span>
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
              {loadingMsgs ? (
                <div className="text-center text-[12px] py-6" style={{ color: 'var(--stone)' }}>Loading messages…</div>
              ) : messages.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-[13px]" style={{ color: 'var(--stone)' }}>No messages yet — say hello.</p>
                </div>
              ) : (
                groupByDate(messages).map((group) => (
                  <div key={group.date}>
                    <div className="flex items-center justify-center my-3">
                      <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full" style={{ background: 'var(--surface-container)', color: 'var(--stone)' }}>
                        {group.label}
                      </span>
                    </div>
                    {group.items.map((m, i) => {
                      const isMe = m.sender_id === me?.id
                      const prev = group.items[i - 1]
                      const showMeta = !prev || prev.sender_id !== m.sender_id
                      return <Bubble key={m.id} m={m} isMe={isMe} showMeta={showMeta} />
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Composer */}
            <div className="px-3 py-3 shrink-0" style={{ boxShadow: '0 -1px 0 var(--hairline)' }}>
              <div className="flex items-end gap-2">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
                  }}
                  rows={1}
                  placeholder="Write a message…"
                  className="input-5bloc resize-none max-h-32"
                  style={{ minHeight: '40px' }}
                />
                <button
                  onClick={handleSend}
                  disabled={!draft.trim() || sending}
                  className="btn-primary h-10 w-10 shrink-0"
                  style={{ padding: 0 }}
                  aria-label="Send"
                >
                  <span className="material-icons-outlined text-[18px]">{sending ? 'hourglass_empty' : 'send'}</span>
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      {showNew && me && (
        <PeopleModal
          title="New message"
          actionLabel="Start conversation"
          allowTitle
          allowProject
          onClose={() => setShowNew(false)}
          onSubmit={async (ids, extra) => {
            const res = await fetch('/api/messages/conversations', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ memberProfileIds: ids, title: extra.title || null, projectId: extra.projectId || null }),
            })
            const json = await res.json()
            setShowNew(false)
            if (res.ok && json.id) await reloadConversations(json.id)
          }}
        />
      )}

      {showAdd && active && (
        <PeopleModal
          title="Add people"
          actionLabel="Add to conversation"
          excludeIds={active.members.map((m) => m.id)}
          onClose={() => setShowAdd(false)}
          onSubmit={async (ids) => {
            const res = await fetch(`/api/messages/conversations/${active.id}/members`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ memberProfileIds: ids }),
            })
            setShowAdd(false)
            if (res.ok) await reloadConversations(active.id)
          }}
        />
      )}
    </div>
  )
}

function ConvAvatar({ conv, myId }: { conv: ChatConversation; myId?: string }) {
  const others = conv.members.filter((m) => m.id !== myId)
  const label = conv.title || others[0]?.full_name || others[0]?.email || 'Conversation'
  const isGroup = conv.type !== 'dm' && (conv.title || others.length > 1)
  return (
    <div
      className="w-10 h-10 flex items-center justify-center text-[12px] font-bold rounded-full shrink-0"
      style={{
        background: isGroup ? 'rgba(122,184,255,0.14)' : 'rgba(245,166,35,0.14)',
        color: isGroup ? 'var(--blue)' : 'var(--amber)',
      }}
    >
      {isGroup
        ? <span className="material-icons-outlined text-[18px]">groups</span>
        : initialsOf(label)}
    </div>
  )
}

function Bubble({ m, isMe, showMeta }: { m: ChatMessage; isMe: boolean; showMeta: boolean }) {
  const senderName = m.sender?.full_name || m.sender?.email || 'User'
  const time = new Date(m.created_at).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  return (
    <div className={`flex gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'} ${showMeta ? 'mt-2.5' : 'mt-0.5'}`}>
      <div className="w-7 shrink-0">
        {!isMe && showMeta && (
          <div className="w-7 h-7 flex items-center justify-center text-[10px] font-bold rounded-full" style={{ background: 'var(--surface-container-high)', color: 'var(--on-surface-variant)' }}>
            {initialsOf(senderName)}
          </div>
        )}
      </div>
      <div className={`max-w-[72%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
        {showMeta && !isMe && (
          <span className="text-[11px] font-semibold mb-0.5 px-1" style={{ color: 'var(--on-surface-variant)' }}>{senderName}</span>
        )}
        <div
          className="px-3.5 py-2 text-[13px] leading-snug"
          style={{
            background: isMe ? 'var(--amber)' : 'var(--surface-container)',
            color: isMe ? 'var(--ink-black)' : 'var(--on-surface)',
            borderRadius: isMe ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
            boxShadow: isMe ? 'none' : 'inset 0 0 0 1px var(--hairline)',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {m.body}
        </div>
        <span className="text-[9.5px] mt-0.5 px-1" style={{ color: 'var(--stone)' }}>{time}</span>
      </div>
    </div>
  )
}

function PeopleModal({
  title,
  actionLabel,
  allowTitle,
  allowProject,
  excludeIds = [],
  onClose,
  onSubmit,
}: {
  title: string
  actionLabel: string
  allowTitle?: boolean
  allowProject?: boolean
  excludeIds?: string[]
  onClose: () => void
  onSubmit: (ids: string[], extra: { title?: string; projectId?: string }) => Promise<void>
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchUser[]>([])
  const [selected, setSelected] = useState<SearchUser[]>([])
  const [groupTitle, setGroupTitle] = useState('')
  const [projectId, setProjectId] = useState('')
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([])
  const [searching, setSearching] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!allowProject) return
    ;(async () => {
      const { data } = await supabaseClient
        .from('projects')
        .select('id, name')
        .order('created_at', { ascending: false })
        .limit(50)
      if (data) setProjects(data.filter((p) => !!p.name).map((p) => ({ id: p.id, name: p.name })))
    })()
  }, [allowProject])

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) { setResults([]); return }
    setSearching(true)
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/messages/users/search?q=${encodeURIComponent(q)}`)
        const json = await res.json()
        const selIds = new Set(selected.map((s) => s.id))
        setResults((json.users || []).filter((u: SearchUser) => !selIds.has(u.id) && !excludeIds.includes(u.id)))
      } catch { setResults([]) }
      setSearching(false)
    }, 280)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  const canSubmit = selected.length > 0 && !submitting

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'var(--scrim)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: 'var(--surface-container)', boxShadow: '0 20px 60px rgba(0,0,0,0.5), inset 0 0 0 1px var(--hairline)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3.5" style={{ boxShadow: '0 1px 0 var(--hairline)' }}>
          <h2 className="text-[15px] font-bold" style={{ color: 'var(--on-surface)' }}>{title}</h2>
          <button onClick={onClose} className="h-7 w-7 flex items-center justify-center rounded-lg" style={{ color: 'var(--stone)' }}>
            <span className="material-icons-outlined text-[18px]">close</span>
          </button>
        </div>

        <div className="p-5 space-y-3">
          {allowTitle && (
            <input
              value={groupTitle}
              onChange={(e) => setGroupTitle(e.target.value)}
              placeholder="Group name (optional)"
              className="input-5bloc"
            />
          )}

          {allowProject && projects.length > 0 && (
            <div className="select-5bloc">
              <select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
                <option value="">Not linked to a project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <span className="material-icons-outlined chevron">expand_more</span>
            </div>
          )}

          {selected.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selected.map((u) => (
                <span key={u.id} className="inline-flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-full text-[12px]" style={{ background: 'rgba(245,166,35,0.12)', color: 'var(--amber)' }}>
                  <span className="w-5 h-5 flex items-center justify-center text-[9px] font-bold rounded-full" style={{ background: 'rgba(245,166,35,0.2)' }}>{initialsOf(u.full_name, u.email)}</span>
                  {u.full_name || u.email}
                  <button onClick={() => setSelected((prev) => prev.filter((x) => x.id !== u.id))}>
                    <span className="material-icons-outlined text-[14px]">close</span>
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="search-5bloc">
            <span className="material-icons-outlined">search</span>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or email…" autoFocus />
          </div>

          <div className="max-h-[240px] overflow-y-auto -mx-1">
            {searching ? (
              <p className="text-center text-[12px] py-4" style={{ color: 'var(--stone)' }}>Searching…</p>
            ) : query.trim().length >= 2 && results.length === 0 ? (
              <p className="text-center text-[12px] py-4" style={{ color: 'var(--stone)' }}>No registered users found for “{query.trim()}”.</p>
            ) : (
              results.map((u) => (
                <button
                  key={u.id}
                  onClick={() => { setSelected((prev) => [...prev, u]); setQuery(''); setResults([]) }}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-left transition-colors"
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--overlay-hover)')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                >
                  <div className="w-8 h-8 flex items-center justify-center text-[11px] font-bold rounded-full shrink-0" style={{ background: 'rgba(245,166,35,0.14)', color: 'var(--amber)' }}>
                    {initialsOf(u.full_name, u.email)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold truncate" style={{ color: 'var(--on-surface)' }}>{u.full_name || u.email}</p>
                    <p className="text-[11px] truncate" style={{ color: 'var(--stone)' }}>{u.email}{u.role ? ` · ${u.role}` : ''}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="px-5 py-3.5 flex items-center justify-end gap-2" style={{ boxShadow: '0 -1px 0 var(--hairline)' }}>
          <button onClick={onClose} className="btn-secondary text-[12.5px] py-2">Cancel</button>
          <button
            disabled={!canSubmit}
            onClick={async () => { setSubmitting(true); await onSubmit(selected.map((s) => s.id), { title: groupTitle.trim() || undefined, projectId: projectId || undefined }) }}
            className="btn-primary text-[12.5px] py-2"
          >
            {submitting ? 'Working…' : actionLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

function groupByDate(messages: ChatMessage[]) {
  const groups: { date: string; label: string; items: ChatMessage[] }[] = []
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1)
  for (const m of messages) {
    const d = new Date(m.created_at); d.setHours(0, 0, 0, 0)
    const key = d.toISOString().slice(0, 10)
    let label: string
    if (d.getTime() === today.getTime()) label = 'Today'
    else if (d.getTime() === yesterday.getTime()) label = 'Yesterday'
    else label = new Date(m.created_at).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
    const last = groups[groups.length - 1]
    if (last && last.date === key) last.items.push(m)
    else groups.push({ date: key, label, items: [m] })
  }
  return groups
}

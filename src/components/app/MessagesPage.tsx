import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from '@/compat/next-navigation'
import { supabaseClient } from '@/lib/supabase/client'
import { hasSupabaseEnv } from '@/lib/data/client-data'
import { useMessages } from '@/components/messages/MessagesProvider'
import { useToast } from '@/components/ui5/Toast'
import { Skeleton } from '@/components/ui5/Skeleton'
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
import { ChatAttachment } from '@/components/messages/ChatAttachment'
import { CHAT_ACCEPT, messagePreview, uploadChatFile } from '@/lib/messages/files'

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
  const { toast } = useToast()

  const [me, setMe] = useState<ChatProfile | null>(null)
  const [conversations, setConversations] = useState<ChatConversation[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loadingConvs, setLoadingConvs] = useState(true)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [convSearch, setConvSearch] = useState('')
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
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
        async (payload: any) => {
          const row = payload.new as ChatMessage
          setMessages((prev) => {
            if (prev.some((m) => m.id === row.id)) return prev
            return [...prev, row]
          })
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
    if ((!text && !file) || !activeId || !me || sending) return
    setSending(true)
    try {
      let attachment: { url: string; name: string } | null = null
      if (file) {
        const uploaded = await uploadChatFile(file, { conversationId: activeId })
        attachment = { url: uploaded.key, name: uploaded.filename }
      }
      const sent = await sendMessage(activeId, me.id, text, attachment)
      if (sent) {
        setDraft('')
        setFile(null)
        setMessages((prev) => (prev.some((m) => m.id === sent.id) ? prev : [...prev, sent]))
        setConversations((prev) =>
          prev
            .map((c) =>
              c.id === activeId
                ? {
                    ...c,
                    lastMessage: {
                      body: messagePreview(sent),
                      sender_id: me.id,
                      created_at: sent.created_at,
                    },
                    last_message_at: sent.created_at,
                  }
                : c,
            )
            .sort((a, b) => b.last_message_at.localeCompare(a.last_message_at)),
        )
      } else {
        toast('Message not sent. Your text is still in the box — try again.', 'error')
      }
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Could not send that file.', 'error')
    } finally {
      setSending(false)
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
    <div className="page-m">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-m-title">Messages</h1>
            <p className="page-m-sub">Connect with architects, contractors and vendors</p>
          </div>
          <button
            onClick={() => setShowNew(true)}
            className="btn-primary"
          >
            <span className="material-icons-outlined">edit_square</span>
            New message
          </button>
        </div>

        <div className="grid md:grid-cols-[320px_1fr] gap-6 min-h-[680px] h-[calc(100vh-200px)]">
          {/* ── Conversation list ── */}
          <aside
            className={`${activeId ? 'hidden md:flex' : 'flex'} card-m flex-col overflow-hidden`}
          >
            <div className="card-m-head">
              <span className="card-m-title">Conversations</span>
              {convSearch.trim() && (
                 <button onClick={() => setConvSearch('')} className="text-[11px] font-medium text-amber hover:underline">Clear</button>
              )}
            </div>

            <div className="px-4 py-3 border-b border-hairline">
              <div className="search-5bloc">
                <span className="material-icons-outlined">search</span>
                <input value={convSearch} onChange={(e) => setConvSearch(e.target.value)} placeholder="Search…" />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
              {loadingConvs ? (
                <div className="p-2 space-y-2">
                  {Array.from({ length: 6 }, (_, i) => (
                    <Skeleton key={i} className="h-14 w-full rounded-xl" />
                  ))}
                </div>
              ) : filteredConvs.length === 0 ? (
                <div className="px-4 py-12 text-center">
                  <span className="material-icons-outlined text-[32px] mb-2" style={{ color: 'var(--stone)', opacity: 0.5 }}>
                    {convSearch.trim() ? 'search_off' : 'forum'}
                  </span>
                  <p className="text-[13px] font-medium" style={{ color: 'var(--on-surface-variant)' }}>
                    {convSearch.trim() ? 'No matches' : 'No conversations'}
                  </p>
                </div>
              ) : (
                filteredConvs.map((c) => {
                  const title = me ? conversationTitle(c, me.id) : 'Conversation'
                  const isActive = c.id === activeId
                  const preview = c.lastMessage
                    ? (c.lastMessage.sender_id === me?.id ? 'You: ' : '') + (c.lastMessage.body || 'Attachment')
                    : 'No messages yet'
                  return (
                    <button
                      key={c.id}
                      onClick={() => openConversation(c.id)}
                      className={`flex items-center gap-3 w-full px-3 py-3 rounded-xl text-left transition-colors ${isActive ? 'bg-overlay-active' : 'hover:bg-overlay-hover'}`}
                    >
                      <ConvAvatar conv={c} myId={me?.id} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[13px] font-semibold truncate" style={{ color: 'var(--on-surface)' }}>{title}</span>
                          <span className="text-[10px] shrink-0" style={{ color: 'var(--stone)' }}>
                            {c.lastMessage ? relativeTime(c.lastMessage.created_at) : ''}
                          </span>
                        </div>
                        {c.project_name && (
                          <span
                            className="text-[10px] truncate flex items-center gap-1 mt-0.5"
                            style={{ color: 'var(--amber)' }}
                          >
                            <span className="material-icons-outlined text-[12px]">folder</span>
                            {c.project_name}
                          </span>
                        )}
                        <div className="flex items-center justify-between gap-2 mt-0.5">
                          <span className="text-[12px] truncate" style={{ color: c.unread > 0 ? 'var(--on-surface)' : 'var(--stone)', fontWeight: c.unread > 0 ? 600 : 400 }}>
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
          <section className={`${activeId ? 'flex' : 'hidden md:flex'} card-m flex-col min-w-0 overflow-hidden`}>
            {!active ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-surface-dim/30">
                <span className="material-icons-outlined text-[48px] mb-4" style={{ color: 'var(--stone)', opacity: 0.3 }}>chat_bubble_outline</span>
                <p className="text-[15px] font-semibold" style={{ color: 'var(--on-surface-variant)' }}>Your messages</p>
                <p className="text-[13px] mt-2 max-w-xs" style={{ color: 'var(--stone)' }}>
                  Select a conversation from the list to view the thread and send a message.
                </p>
              </div>
            ) : (
              <>
                <div className="card-m-head bg-surface-elevated/50 backdrop-blur-md sticky top-0 z-10">
                  <div className="flex items-center gap-3 min-w-0">
                    <button onClick={() => { setActiveId(null); setActiveConversation(null) }} className="md:hidden btn-icon mr-1">
                      <span className="material-icons-outlined">arrow_back</span>
                    </button>
                    <ConvAvatar conv={active} myId={me?.id} />
                    <div className="min-w-0">
                      <p className="card-m-title truncate">
                        {me ? conversationTitle(active, me.id) : 'Conversation'}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px]" style={{ color: 'var(--stone)' }}>
                          {active.members.length} {active.members.length === 1 ? 'member' : 'members'}
                        </span>
                        {active.project_name && (
                          <a
                            href={`/projects/${active.project_id}`}
                            className="text-[11px] font-medium hover:underline flex items-center gap-1"
                            style={{ color: 'var(--amber)' }}
                          >
                            <span className="material-icons-outlined text-[12px]">folder</span>
                            {active.project_name}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAdd(true)}
                    className="btn-secondary btn-sm"
                  >
                    <span className="material-icons-outlined">person_add</span>
                    <span className="hidden sm:inline">Add People</span>
                  </button>
                </div>

                <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6 space-y-1 bg-surface-canvas/20">
                  {loadingMsgs ? (
                    <div className="space-y-6 py-4">
                      {[64, 40, 56, 44].map((w, i) => (
                        <div key={i} className={`flex ${i % 2 ? 'justify-end' : 'justify-start'}`}>
                          <Skeleton className="h-12 rounded-2xl" style={{ width: `${w}%` }} />
                        </div>
                      ))}
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-20">
                      <p className="text-[13px] italic" style={{ color: 'var(--stone)' }}>No messages yet — say hello to start the conversation.</p>
                    </div>
                  ) : (
                    groupByDate(messages).map((group) => (
                      <div key={group.date}>
                        <div className="flex items-center justify-center my-6">
                          <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-hairline" style={{ background: 'var(--surface-container-low)', color: 'var(--stone)' }}>
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

                <div className="p-4 border-t border-hairline bg-surface-elevated">
                  {file && (
                    <div className="flex items-center gap-3 mb-3 p-2 rounded-lg bg-overlay-hover border border-hairline">
                      <span className="feed-m-icon">
                         <span className="material-icons-outlined">attach_file</span>
                      </span>
                      <span className="text-[12px] font-medium truncate flex-1" style={{ color: 'var(--on-surface)' }}>{file.name}</span>
                      <button type="button" onClick={() => setFile(null)} className="btn-icon">
                        <span className="material-icons-outlined">close</span>
                      </button>
                    </div>
                  )}
                  <div className="flex items-end gap-3">
                    <input
                      ref={fileRef}
                      type="file"
                      accept={CHAT_ACCEPT}
                      className="hidden"
                      onChange={(e) => {
                        const next = e.target.files?.[0] || null
                        setFile(next)
                        e.target.value = ''
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="btn-icon btn-icon-sm h-10 w-10 !rounded-xl bg-overlay-hover hover:bg-overlay-active"
                      title="Attach file"
                    >
                      <span className="material-icons-outlined text-[20px]">add</span>
                    </button>
                    <textarea
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
                      }}
                      rows={1}
                      placeholder="Write a message…"
                      className="input-5bloc flex-1 resize-none max-h-32 py-2.5"
                      style={{ minHeight: '42px' }}
                    />
                    <button
                      onClick={handleSend}
                      disabled={(!draft.trim() && !file) || sending}
                      className="btn-primary h-10 w-10 !rounded-xl shrink-0"
                      style={{ padding: 0 }}
                    >
                      <span className="material-icons-outlined text-[18px]">{sending ? 'hourglass_empty' : 'send'}</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      </div>

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
            const json = await res.json().catch(() => ({}))
            setShowNew(false)
            if (res.ok && json.id) await reloadConversations(json.id)
            else toast(json.error || 'Could not start that conversation. Try again.', 'error')
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
            if (res.ok) {
              await reloadConversations(active.id)
              toast(ids.length === 1 ? 'Added to the conversation' : `${ids.length} people added to the conversation`, 'success')
            } else {
              toast('Could not add those people. Try again.', 'error')
            }
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
      className={`w-10 h-10 flex items-center justify-center text-[12px] font-bold rounded-full shrink-0 ${isGroup ? 'bg-blue/10 text-blue' : 'bg-amber/10 text-amber'}`}
      style={{ boxShadow: 'inset 0 0 0 1px var(--hairline)' }}
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
    <div className={`flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'} ${showMeta ? 'mt-4' : 'mt-1'}`}>
      <div className="w-8 shrink-0">
        {!isMe && showMeta && (
          <div className="w-8 h-8 flex items-center justify-center text-[10px] font-bold rounded-full bg-surface-container-high border border-hairline text-stone">
            {initialsOf(senderName)}
          </div>
        )}
      </div>
      <div className={`max-w-[80%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
        {showMeta && !isMe && (
          <span className="text-[11px] font-bold mb-1 px-1 text-stone uppercase tracking-tight">{senderName}</span>
        )}
        <div
          className="px-4 py-2.5 text-[14px] leading-relaxed"
          style={{
            background: isMe ? 'var(--amber)' : 'var(--surface-elevated)',
            color: isMe ? 'var(--ink-black)' : 'var(--on-surface)',
            borderRadius: isMe ? '18px 4px 18px 18px' : '4px 18px 18px 18px',
            boxShadow: isMe ? 'var(--shadow-1)' : 'inset 0 0 0 1px var(--hairline), var(--shadow-1)',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {m.body?.trim() && m.body.trim() !== m.attachment_name ? m.body : null}
          {m.attachment_url && m.attachment_name && (
            <div className={m.body?.trim() ? 'mt-2' : ''}>
              <ChatAttachment fileKey={m.attachment_url} filename={m.attachment_name} />
            </div>
          )}
        </div>
        <span className="text-[10px] mt-1.5 px-1 opacity-60 text-stone">{time}</span>
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
      if (data) setProjects(data.filter((p: any) => !!p.name).map((p: any) => ({ id: p.id, name: p.name })))
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'var(--scrim)', backdropFilter: 'blur(8px)' }} onClick={onClose}>
      <div
        className="card-m w-full max-w-md overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="card-m-head">
          <span className="card-m-title">{title}</span>
          <button onClick={onClose} className="btn-icon">
            <span className="material-icons-outlined">close</span>
          </button>
        </div>

        <div className="p-5 space-y-4">
          {allowTitle && (
            <input
              value={groupTitle}
              onChange={(e) => setGroupTitle(e.target.value)}
              placeholder="Group name (optional)"
              className="input-5bloc"
            />
          )}

          {allowProject && (
            <div>
              <label className="block text-[11px] font-bold mb-1.5 uppercase tracking-wider text-stone">
                Project Link
              </label>
              {projects.length > 0 ? (
                <div className="select-5bloc w-full">
                  <select className="w-full" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
                    <option value="">Not linked to a project</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <span className="material-icons-outlined chevron">expand_more</span>
                </div>
              ) : (
                <p className="text-[12px] text-stone">No projects found.</p>
              )}
            </div>
          )}

          {selected.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selected.map((u) => (
                <span key={u.id} className="chip-m chip-m-amber !py-1 !px-2 gap-1.5">
                  <span className="text-[10px] font-bold">{initialsOf(u.full_name, u.email)}</span>
                  {u.full_name || u.email}
                  <button onClick={() => setSelected((prev) => prev.filter((x) => x.id !== u.id))} className="hover:opacity-60">
                    <span className="material-icons-outlined text-[14px]">close</span>
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="search-5bloc">
            <span className="material-icons-outlined">search</span>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search for people…" autoFocus />
          </div>

          <div className="max-h-[260px] overflow-y-auto space-y-1">
            {searching ? (
              <p className="text-center text-[12px] py-6 text-stone">Searching directory…</p>
            ) : query.trim().length >= 2 && results.length === 0 ? (
              <p className="text-center text-[12px] py-6 text-stone">No results found.</p>
            ) : (
              results.map((u) => (
                <button
                  key={u.id}
                  onClick={() => { setSelected((prev) => [...prev, u]); setQuery(''); setResults([]) }}
                  className="flex items-center gap-3 w-full px-3 py-3 rounded-xl text-left hover:bg-overlay-hover transition-colors"
                >
                  <div className="feed-m-icon !bg-amber/10 !text-amber font-bold text-[10px]">
                    {initialsOf(u.full_name, u.email)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-on-surface truncate">{u.full_name || u.email}</p>
                    <p className="text-[11px] text-stone truncate">{u.role || 'User'}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="card-m-head !bg-surface-container-low/50">
          <button onClick={onClose} className="btn-secondary btn-sm">Cancel</button>
          <button
            disabled={!canSubmit}
            onClick={async () => { setSubmitting(true); await onSubmit(selected.map((s) => s.id), { title: groupTitle.trim() || undefined, projectId: projectId || undefined }) }}
            className="btn-primary btn-sm"
          >
            {submitting ? 'Creating…' : actionLabel}
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

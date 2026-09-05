import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useParams } from '@/compat/next-navigation'
import { useToast } from '@/components/ui5/Toast'
import { ErrorState } from '@/components/ui5/ErrorState'
import { EmptyState } from '@/components/ui5/EmptyState'
import { Skeleton } from '@/components/ui5/Skeleton'
import { ChatAttachment } from '@/components/messages/ChatAttachment'
import {
  CHAT_ACCEPT,
  parseFileMarker,
  stripFileMarker,
  uploadChatFile,
} from '@/lib/messages/files'

interface Message {
  id: string
  sender: string
  role: string
  text: string
  timestamp: string
  channel: string
  created_at?: string
  attachment_url?: string | null
  attachment_name?: string | null
}

function formatTime(iso?: string) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

function fromApi(m: Record<string, unknown>, channel: string): Message {
  const raw = String(m.text || m.body || '')
  const marked = parseFileMarker(raw)
  return {
    id: String(m.id),
    sender: String(m.sender || 'Member'),
    role: String(m.role || 'member'),
    text: stripFileMarker(raw),
    created_at: m.created_at ? String(m.created_at) : undefined,
    timestamp: formatTime(m.created_at ? String(m.created_at) : undefined),
    channel,
    attachment_url: marked?.key || (m.attachment_url as string | null) || null,
    attachment_name: marked?.name || (m.attachment_name as string | null) || null,
  }
}

/** Project chat — persisted via Supabase channel conversations. */
export default function ProjectMessagesPage() {
  const params = useParams()
  const projectId = params.id as string
  const chatEndRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const [channels] = useState<string[]>(['general', 'structural', 'mep', 'interior-finishes'])
  const [activeChannel, setActiveChannel] = useState('general')
  const [messages, setMessages] = useState<Message[]>([])
  const [textInput, setTextInput] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [loadError, setLoadError] = useState<unknown>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const res = await fetch(`/api/projects/${projectId}/messages?channel=${encodeURIComponent(activeChannel)}`)
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Failed to load messages')
      setMessages((d.messages || []).map((m: Record<string, unknown>) => fromApi(m, activeChannel)))
    } catch (e) {
      setMessages([])
      setLoadError(e)
    } finally {
      setLoading(false)
    }
  }, [projectId, activeChannel])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, activeChannel])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!textInput.trim() && !file) || sending) return
    setSending(true)
    try {
      let attachmentKey = ''
      let attachmentName = ''
      if (file) {
        const uploaded = await uploadChatFile(file, { projectId })
        attachmentKey = uploaded.key
        attachmentName = uploaded.filename
      }
      const res = await fetch(`/api/projects/${projectId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: activeChannel,
          text: textInput.trim(),
          attachmentKey: attachmentKey || undefined,
          attachmentName: attachmentName || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Send failed')
      const mapped = fromApi(
        {
          ...(data.message || {}),
          text: data.message?.text || data.message?.body || textInput.trim(),
          sender: data.message?.sender || 'You',
          created_at: data.message?.created_at || new Date().toISOString(),
        },
        activeChannel,
      )
      if (attachmentKey && !mapped.attachment_url) {
        mapped.attachment_url = attachmentKey
        mapped.attachment_name = attachmentName
      }
      setMessages((prev) => [...prev, mapped])
      setTextInput('')
      setFile(null)
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Message could not be sent', 'error')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-4 font-body">
      <div className="card-m p-4">
        <h3 className="text-sm font-semibold text-white">Project messages</h3>
        <p className="text-[11px] text-stone mt-1">
          Channels sync for all project members. Attach images or documents to a message.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 min-h-[420px]">
        <div className="card-m p-3 space-y-1">
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

        <div className="md:col-span-3 card-m p-5 flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[320px]">
            {loading ? (
              <div className="space-y-4 py-2">
                {Array.from({ length: 4 }, (_, i) => (
                  <Skeleton key={i} lines={2} />
                ))}
              </div>
            ) : loadError ? (
              <ErrorState
                compact
                title={`Could not load #${activeChannel}`}
                error={loadError}
                onRetry={load}
              />
            ) : messages.length === 0 ? (
              <EmptyState
                icon="forum"
                title={`#${activeChannel} is quiet`}
                description={`Nothing has been posted in #${activeChannel} yet. Send the first message — everyone on the project sees this channel.`}
              />
            ) : (
              messages.map((m) => (
                <div key={m.id} className="text-xs">
                  <span className="font-semibold text-white">{m.sender}</span>
                  <span className="text-stone ml-2">
                    {m.role} · {m.timestamp}
                  </span>
                  {m.text ? <p className="mt-1 text-stone">{m.text}</p> : null}
                  {m.attachment_url && m.attachment_name && (
                    <ChatAttachment fileKey={m.attachment_url} filename={m.attachment_name} compact />
                  )}
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>
          <form onSubmit={handleSend} className="p-3 border-t space-y-2">
            {file && (
              <div className="flex items-center gap-2 text-[11px]" style={{ color: 'var(--stone)' }}>
                <span className="material-icons-outlined text-[14px]">attach_file</span>
                <span className="truncate flex-1">{file.name}</span>
                <button type="button" onClick={() => setFile(null)}>Remove</button>
              </div>
            )}
            <div className="flex gap-2">
              <input
                ref={fileRef}
                type="file"
                accept={CHAT_ACCEPT}
                className="hidden"
                onChange={(e) => {
                  setFile(e.target.files?.[0] || null)
                  e.target.value = ''
                }}
              />
              <button
                type="button"
                className="btn-secondary text-xs px-2"
                onClick={() => fileRef.current?.click()}
                aria-label="Attach image or document"
              >
                <span className="material-icons-outlined text-[16px]">attach_file</span>
              </button>
              <input
                className="input-5bloc flex-1 text-xs"
                placeholder={`Message #${activeChannel}`}
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                disabled={sending}
              />
              <button type="submit" className="btn-primary text-xs" disabled={sending || (!textInput.trim() && !file)}>
                {sending ? '…' : 'Send'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

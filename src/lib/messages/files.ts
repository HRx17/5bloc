const IMAGE_EXT = /\.(png|jpe?g|gif|webp|heic|heif|svg|bmp)$/i
const FILE_MARK_G = /\[\[5bloc-file\|([^|]+)\|([^\]]+)\]\]/g
const FILE_MARK = /\[\[5bloc-file\|([^|]+)\|([^\]]+)\]\]/

export const CHAT_ACCEPT =
  'image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.zip,.dwg,.dxf,.ppt,.pptx'

export const CHAT_MAX_BYTES = 25 * 1024 * 1024

export function isImageFilename(name: string | null | undefined): boolean {
  return !!name && IMAGE_EXT.test(name)
}

export function stripFileMarker(body: string | null | undefined): string {
  return (body || '').replace(FILE_MARK_G, '').trim()
}

export function parseFileMarker(body: string | null | undefined): { key: string; name: string } | null {
  const m = (body || '').match(FILE_MARK)
  if (!m) return null
  try {
    return { key: decodeURIComponent(m[1]), name: decodeURIComponent(m[2]) }
  } catch {
    return { key: m[1], name: m[2] }
  }
}

export function formatFileMarker(key: string, name: string): string {
  return `[[5bloc-file|${encodeURIComponent(key)}|${encodeURIComponent(name)}]]`
}

export function messagePreview(opts: {
  body?: string | null
  attachment_name?: string | null
  attachment_url?: string | null
}): string {
  const text = stripFileMarker(opts.body)
  if (text) return text
  const name = opts.attachment_name || parseFileMarker(opts.body)?.name
  if (name) return name
  if (opts.attachment_url) return 'Attachment'
  return ''
}

export async function uploadChatFile(
  file: File,
  opts: { conversationId?: string; projectId?: string },
): Promise<{ key: string; filename: string; content_type: string }> {
  if (file.size > CHAT_MAX_BYTES) {
    throw new Error('File is over 25 MB. Choose a smaller image or document.')
  }
  const form = new FormData()
  form.append('file', file)
  if (opts.conversationId) form.append('conversationId', opts.conversationId)
  if (opts.projectId) form.append('projectId', opts.projectId)
  if (!opts.conversationId && !opts.projectId) form.append('folder', 'messages')
  const res = await fetch('/api/files/upload', { method: 'POST', body: form })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Could not upload that file.')
  const key = data.r2_key || data.storage_path || data.url
  if (!key) throw new Error('Upload succeeded but no file key was returned.')
  return { key, filename: data.filename || file.name, content_type: data.content_type || file.type }
}

export async function signedFileUrl(key: string, filename: string, inline = false): Promise<string> {
  if (/^https?:\/\//i.test(key) || key.startsWith('blob:') || key.startsWith('data:')) return key
  const params = new URLSearchParams({ key, filename })
  if (inline) params.set('inline', '1')
  const res = await fetch(`/api/files/upload?${params.toString()}`)
  const data = await res.json().catch(() => ({}))
  if (!res.ok || !data.url) throw new Error(data.error || 'Could not open that file.')
  return data.url as string
}

import { createFileRoute } from '@tanstack/react-router'
import { getAuthUserOrNull, json } from '@/lib/api/get-user.server'
import { resolveStorageDownloadUrl } from '@/lib/files/resolve-download'

const handleGET = async ({ request }: any) => {
  try {
    const auth = await getAuthUserOrNull(request)
    const docId = new URL(request.url).searchParams.get('id')
    const inline = new URL(request.url).searchParams.get('inline') === '1'

    if (!docId) {
      return json({ error: 'Missing document id parameter' }, { status: 400 })
    }

    if (!auth?.supabase) {
      return json(
        { error: 'Auth/storage not configured', provider: 'mock' },
        { status: 503 }
      )
    }

    const { data: doc, error } = await auth.supabase!
      .from('documents')
      .select('r2_key, storage_path, name, original_filename, extension')
      .eq('id', docId)
      .single()

    if (error || !doc) {
      return json({ error: 'Not found or access denied' }, { status: 404 })
    }

    const key = doc.r2_key || doc.storage_path
    if (!key) {
      return json({ error: 'No file storage key' }, { status: 404 })
    }

    const base = doc.original_filename || doc.name || 'document'
    const ext = (doc.extension || '').replace(/^\./, '')
    const filename = ext && !base.toLowerCase().endsWith(`.${ext.toLowerCase()}`)
      ? `${base}.${ext}`
      : base
    const resolved = await resolveStorageDownloadUrl(key, filename, auth.supabase, { inline })
    return json({
      url: resolved.url,
      expires_in: 900,
      provider: resolved.provider,
    })
  } catch (e) {
    console.error('File download API error:', e)
    return json(
      { error: e instanceof Error ? e.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export const Route = createFileRoute('/api/files/download')({
  server: {
    handlers: {
        GET: handleGET,
    },
  },
})

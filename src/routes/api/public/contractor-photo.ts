import { createFileRoute } from '@tanstack/react-router'
import { json } from '@/lib/api/get-user.server'
import {
  createServiceRoleClient,
  createSupabasePublicClient,
  hasValidServiceRoleKey,
} from '@/lib/supabase/server'

const BUCKET = 'signup-photos'
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const MAX_SIZE_MB = 8

/**
 * Public, unauthenticated image upload for the "List your business" /
 * "Join as vendor" pages. Images only, small size cap, stored under a
 * dedicated `contractor-signups/` prefix.
 */
const handlePOST = async ({ request }: any) => {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) return json({ error: 'No file provided' }, { status: 400 })
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      return json({ error: 'Only JPG, PNG or WebP images are allowed' }, { status: 415 })
    }
    if (file.size / (1024 * 1024) > MAX_SIZE_MB) {
      return json({ error: `Image too large (max ${MAX_SIZE_MB} MB)` }, { status: 413 })
    }

    const safeBase = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/\s+/g, '_')
    const key = `contractor-signups/${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${safeBase}`

    const client = hasValidServiceRoleKey() ? createServiceRoleClient() : createSupabasePublicClient()
    const bytes = new Uint8Array(await file.arrayBuffer())
    const { error } = await client.storage.from(BUCKET).upload(key, bytes, {
      contentType: file.type,
      upsert: false,
    })
    if (error) {
      // Photos are optional — let the page continue without them.
      return json({ error: 'Photo storage not available', skippable: true }, { status: 503 })
    }

    // Bucket is private; hand back a long-lived signed link for previews.
    const { data } = await client.storage.from(BUCKET).createSignedUrl(key, 60 * 60 * 24 * 365)
    return json({ success: true, key, url: data?.signedUrl ?? key })

  } catch (e) {
    const message = e instanceof Error ? e.message : 'Upload failed'
    return json({ error: message, skippable: true }, { status: 500 })
  }
}

export const Route = createFileRoute('/api/public/contractor-photo')({
  server: { handlers: { POST: handlePOST } },
})

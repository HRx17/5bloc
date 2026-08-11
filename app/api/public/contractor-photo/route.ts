import { NextRequest, NextResponse } from 'next/server'
import { uploadToR2 } from '@/lib/files/r2-client'

export const dynamic = 'force-dynamic'

const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
])

const MAX_SIZE_MB = 8

/**
 * Public, unauthenticated image upload for the "List your business" page.
 * Restricted to images and a small size cap. Files land under a
 * dedicated `contractor-signups/` prefix in R2.
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: 'Only JPG, PNG or WebP images are allowed' },
        { status: 415 },
      )
    }

    const sizeMB = file.size / (1024 * 1024)
    if (sizeMB > MAX_SIZE_MB) {
      return NextResponse.json(
        { error: `Image too large (max ${MAX_SIZE_MB} MB)` },
        { status: 413 },
      )
    }

    const safeBase = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/\s+/g, '_')
    const r2Key = `contractor-signups/${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${safeBase}`

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const { key, publicUrl } = await uploadToR2(r2Key, buffer, file.type)

    return NextResponse.json({ success: true, key, url: publicUrl ?? key })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Upload failed'
    if (message === 'R2 not configured') {
      // Photos are optional — let the client continue without them.
      return NextResponse.json(
        { error: 'Photo storage not configured', skippable: true },
        { status: 503 },
      )
    }
    console.error('Public contractor photo upload error:', e)
    return NextResponse.json({ error: 'Upload failed. Please try again.' }, { status: 500 })
  }
}

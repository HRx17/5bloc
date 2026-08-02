import { NextRequest, NextResponse } from 'next/server'
import { uploadToR2 } from '@/lib/files/r2-client'
import { createServiceRoleClient, isSupabaseConfigured } from '@/lib/supabase/server'
import type { CatalogRow } from '@/lib/catalog/csv'

export const dynamic = 'force-dynamic'

const MAX_BATCH = 500
const MAX_FILE_MB = 25

/**
 * Public catalog ingest for vendor waitlist / self-serve onboarding.
 * Accepts either:
 *  - multipart file (full CSV stored in R2) + metadata
 *  - JSON batch of parsed rows (chunked client upload)
 *
 * Designed for 10k+ SKU catalogs: file is archived once; rows can be
 * inserted in batches without blocking signup.
 */
export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || ''

    if (contentType.includes('multipart/form-data')) {
      return handleFileUpload(req)
    }

    const body = await req.json()
    return handleJsonBatch(body)
  } catch (e) {
    console.error('vendor-catalog error:', e)
    return NextResponse.json({ error: 'Catalog upload failed' }, { status: 500 })
  }
}

async function handleFileUpload(req: NextRequest) {
  const form = await req.formData()
  const file = form.get('file') as File | null
  const email = String(form.get('email') || '').trim().toLowerCase()
  const method = String(form.get('method') || 'csv')
  const signupId = String(form.get('signupId') || '') || null
  const totalRows = Number(form.get('totalRows') || 0)

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
  }
  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }
  if (file.size > MAX_FILE_MB * 1024 * 1024) {
    return NextResponse.json({ error: `File too large (max ${MAX_FILE_MB} MB)` }, { status: 413 })
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/\s+/g, '_')
  const key = `vendor-catalogs/${email}/${Date.now()}_${safeName}`
  const bytes = Buffer.from(await file.arrayBuffer())

  let fileUrl: string | null = null
  try {
    const uploaded = await uploadToR2(key, bytes, file.type || 'text/csv')
    fileUrl = uploaded.publicUrl ?? uploaded.key
  } catch (e) {
    const message = e instanceof Error ? e.message : 'upload failed'
    if (message === 'R2 not configured') {
      // Still accept signup metadata without durable file storage
      fileUrl = null
    } else {
      throw e
    }
  }

  const importId = await createImportRecord({
    email,
    method: method === 'sheet' ? 'sheet' : 'csv',
    signupId,
    fileUrl,
    fileName: file.name,
    totalRows: Number.isFinite(totalRows) ? totalRows : 0,
    status: fileUrl ? 'pending' : 'partial',
  })

  return NextResponse.json({
    success: true,
    importId,
    fileUrl,
    message: fileUrl
      ? 'Catalogue file received. We will process it in the background.'
      : 'Catalogue metadata saved. File storage is not configured in this environment.',
  })
}

async function handleJsonBatch(body: {
  email?: string
  signupId?: string
  importId?: string
  method?: string
  sourceUrl?: string
  totalRows?: number
  done?: boolean
  rows?: CatalogRow[]
  sample?: CatalogRow[]
}) {
  const email = (body.email || '').trim().toLowerCase()
  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
  }

  const method = body.method === 'url' || body.method === 'sheet' || body.method === 'later'
    ? body.method
    : 'csv'

  let importId = body.importId

  if (!importId) {
    importId = await createImportRecord({
      email,
      method,
      signupId: body.signupId ?? null,
      sourceUrl: body.sourceUrl ?? null,
      fileUrl: null,
      fileName: null,
      totalRows: body.totalRows ?? 0,
      status: method === 'later' ? 'pending' : 'processing',
      sample: body.sample?.slice(0, 20) ?? body.rows?.slice(0, 20) ?? [],
    }) ?? undefined
  }

  const rows = Array.isArray(body.rows) ? body.rows.slice(0, MAX_BATCH) : []
  let inserted = 0

  if (rows.length > 0 && importId && isSupabaseConfigured() && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const supabase = createServiceRoleClient()
      const payload = rows.map((r) => ({
        import_id: importId,
        owner_email: email,
        sku: r.sku.slice(0, 120),
        name: r.name.slice(0, 500),
        category: r.category?.slice(0, 200) || null,
        unit: r.unit?.slice(0, 40) || null,
        price: r.price && !Number.isNaN(Number(r.price)) ? Number(r.price) : null,
        currency: r.currency?.slice(0, 8) || 'INR',
        brand: r.brand?.slice(0, 200) || null,
        description: r.description?.slice(0, 2000) || null,
      }))
      const { error, count } = await (supabase as any)
        .from('vendor_catalog_items')
        .insert(payload, { count: 'exact' })
      if (!error) inserted = count ?? payload.length
      else console.warn('catalog items insert:', error.message)

      await (supabase as any)
        .from('vendor_catalog_imports')
        .update({
          processed_rows: body.done ? (body.totalRows ?? inserted) : undefined,
          status: body.done ? 'ready' : 'processing',
          updated_at: new Date().toISOString(),
        })
        .eq('id', importId)
    } catch (e) {
      console.warn('catalog batch skipped (tables may be missing):', e)
    }
  }

  if (method === 'url' || method === 'sheet') {
    return NextResponse.json({
      success: true,
      importId,
      message: 'Catalogue link saved. We will ingest it before your marketplace listing goes live.',
    })
  }

  if (method === 'later') {
    return NextResponse.json({
      success: true,
      importId,
      message: 'You can import your catalogue anytime after invite from Catalog.',
    })
  }

  return NextResponse.json({
    success: true,
    importId,
    inserted,
    message: body.done ? 'Catalogue import complete.' : 'Batch accepted.',
  })
}

async function createImportRecord(opts: {
  email: string
  method: string
  signupId: string | null
  fileUrl?: string | null
  sourceUrl?: string | null
  fileName?: string | null
  totalRows: number
  status: string
  sample?: CatalogRow[]
}): Promise<string | null> {
  if (!isSupabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return null
  }
  try {
    const supabase = createServiceRoleClient()
    const { data, error } = await (supabase as any)
      .from('vendor_catalog_imports')
      .insert({
        owner_email: opts.email,
        vendor_signup_id: opts.signupId,
        method: opts.method,
        status: opts.status,
        file_url: opts.fileUrl,
        source_url: opts.sourceUrl,
        file_name: opts.fileName,
        total_rows: opts.totalRows,
        sample: opts.sample ?? [],
      })
      .select('id')
      .single()
    if (error) {
      console.warn('catalog import insert:', error.message)
      return null
    }
    return data?.id ?? null
  } catch (e) {
    console.warn('catalog import create failed:', e)
    return null
  }
}

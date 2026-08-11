import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { isMockAuthEnabled } from '@/lib/rbac/mock'
import { liveDataUnavailableResponse, hasSupabaseEnv } from '@/lib/data/mock-guard'
import { resolveStorageDownloadUrl } from '@/lib/files/resolve-download'

type Ctx = { params: Promise<{ token: string }> }

export async function GET(req: Request, ctx: Ctx) {
  const { token } = await ctx.params
  const docId = new URL(req.url).searchParams.get('document_id')
  if (!docId) return NextResponse.json({ error: 'document_id required' }, { status: 400 })

  if (isMockAuthEnabled()) {
    return NextResponse.json(
      {
        error: 'Mock mode — no real file download',
        provider: 'mock',
      },
      { status: 503 }
    )
  }

  if (!hasSupabaseEnv()) {
    return NextResponse.json(liveDataUnavailableResponse(), { status: 503 })
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll() {},
      },
    }
  )

  const { data, error } = await supabase.rpc('get_portal_document_key', {
    p_token: token,
    p_document_id: docId,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data?.ok) return NextResponse.json({ error: data?.error || 'Not found' }, { status: 404 })
  if (!data.storage_path) {
    return NextResponse.json({ error: 'File not available' }, { status: 404 })
  }

  const filename = `${data.name || 'document'}.${data.extension || 'pdf'}`
  try {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const key = String(data.storage_path)
    if (key.startsWith('supabase:') && !serviceKey) {
      return NextResponse.json(
        {
          error:
            'Portal downloads from Supabase Storage require SUPABASE_SERVICE_ROLE_KEY (or use R2).',
        },
        { status: 503 }
      )
    }
    let client = supabase
    if (serviceKey) {
      const { createClient } = await import('@supabase/supabase-js')
      client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
        auth: { persistSession: false },
      }) as any
    }
    const resolved = await resolveStorageDownloadUrl(key, filename, client)
    if (resolved.provider === 'mock') {
      return NextResponse.json(
        {
          error:
            'File storage is not configured for downloads. Set R2 credentials or use supabase: storage keys with SUPABASE_SERVICE_ROLE_KEY.',
        },
        { status: 503 }
      )
    }
    return NextResponse.json({
      url: resolved.url,
      expires_in: 900,
      provider: resolved.provider,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Download failed' }, { status: 500 })
  }
}

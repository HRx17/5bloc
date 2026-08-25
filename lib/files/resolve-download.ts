import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { getDownloadUrl, hasR2Storage } from '@/lib/files/r2-client'

const SUPABASE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'documents'

/**
 * Both backends store bare object paths, so the key alone cannot say which one
 * holds the file. Only an explicit `supabase:` prefix — or R2 being unconfigured
 * — routes to Supabase Storage; otherwise a bare key belongs to R2, which is the
 * backend the upload route prefers whenever its credentials are present.
 */
function isSupabaseKey(raw: string): boolean {
  if (raw.startsWith('supabase:')) return true
  if (raw.startsWith('http://') || raw.startsWith('https://') || raw.includes('://')) return false
  return !hasR2Storage()
}

/** Resolve a documents.r2_key / storage_path to a time-limited download URL. */
export async function resolveStorageDownloadUrl(
  key: string,
  filename: string,
  supabase?: SupabaseClient | null,
  opts?: { inline?: boolean }
): Promise<{ url: string; provider: 'supabase' | 'r2' | 'mock' }> {
  if (!key) throw new Error('No storage key')

  const raw = String(key)

  if (isSupabaseKey(raw)) {
    const path = raw.startsWith('supabase:') ? raw.slice('supabase:'.length) : raw
    const client =
      supabase ||
      createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { auth: { persistSession: false } }
      )
    const { data, error } = await client.storage.from(SUPABASE_BUCKET).createSignedUrl(path, 900)
    if (error || !data?.signedUrl) {
      throw new Error(error?.message || 'Signed URL failed')
    }
    return { url: data.signedUrl, provider: 'supabase' }
  }

  const url = await getDownloadUrl(raw, filename, { inline: opts?.inline })
  return { url, provider: 'r2' as const }
}

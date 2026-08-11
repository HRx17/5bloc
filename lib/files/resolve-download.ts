import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { getDownloadUrl } from '@/lib/files/r2-client'

const SUPABASE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'documents'

/** Resolve a documents.r2_key / storage_path to a time-limited download URL. */
export async function resolveStorageDownloadUrl(
  key: string,
  filename: string,
  supabase?: SupabaseClient | null
): Promise<{ url: string; provider: 'supabase' | 'r2' | 'mock' }> {
  if (!key) throw new Error('No storage key')

  const raw = String(key)
  const isSupabaseKey =
    raw.startsWith('supabase:') ||
    // Bare storage object paths (no scheme) — prefer Supabase when R2 is not the only option
    (!raw.startsWith('http://') && !raw.startsWith('https://') && !raw.includes('://'))

  if (isSupabaseKey) {
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

  const url = await getDownloadUrl(key, filename)
  return { url, provider: 'r2' as const }
}

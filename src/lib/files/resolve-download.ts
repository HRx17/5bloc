import type { SupabaseClient } from '@supabase/supabase-js'

const BUCKET = 'documents'

/** Resolve a documents.r2_key / storage_path to a time-limited download URL. */
export async function resolveStorageDownloadUrl(
  key: string,
  _filename: string,
  supabase?: SupabaseClient | null,
  _opts?: { inline?: boolean }
): Promise<{ url: string; provider: 'supabase' | 'mock' }> {
  if (!key) throw new Error('No storage key')
  const raw = String(key)
  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    return { url: raw, provider: 'supabase' }
  }
  if (!supabase) throw new Error('Storage not configured')
  const path = raw.startsWith('supabase:') ? raw.slice('supabase:'.length) : raw
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 900)
  if (error || !data?.signedUrl) throw new Error(error?.message || 'Signed URL failed')
  return { url: data.signedUrl, provider: 'supabase' }
}

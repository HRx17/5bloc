import type { SupabaseClient } from '@supabase/supabase-js'
import { getDownloadUrl, hasR2Storage } from './r2-client'

const BUCKET = process.env['SUPABASE_STORAGE_BUCKET'] || 'documents'

/** Resolve a documents.r2_key / storage_path to a time-limited download URL. */
export async function resolveStorageDownloadUrl(
  key: string,
  filename: string,
  supabase?: SupabaseClient | null,
  opts?: { inline?: boolean },
): Promise<{ url: string; provider: 'r2' | 'supabase' | 'mock' }> {
  if (!key) throw new Error('No storage key')
  const raw = String(key)

  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    return { url: raw, provider: 'supabase' }
  }

  // Explicit supabase: keys always resolve from Supabase Storage.
  if (!raw.startsWith('supabase:') && hasR2Storage()) {
    return { url: await getDownloadUrl(raw, filename, opts), provider: 'r2' }
  }

  if (!supabase) throw new Error('Storage not configured')
  const path = raw.startsWith('supabase:') ? raw.slice('supabase:'.length) : raw
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 900)
  if (error || !data?.signedUrl) throw new Error(error?.message || 'Signed URL failed')
  return { url: data.signedUrl, provider: 'supabase' }
}

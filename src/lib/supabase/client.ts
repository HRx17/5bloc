/**
 * Data client for the ported pages.
 *
 * Re-exports the generated browser client so the components carried over from
 * the original app keep working with their existing `createSupabaseClient()` /
 * `createClient()` call sites.
 */
import { supabase } from '@/integrations/supabase/client';

export function createSupabaseClient() {
  return supabase;
}

export const supabaseClient = supabase;
export const createClient = createSupabaseClient;
export { supabase };

/**
 * OAuth token storage in Supabase `user_integrations` table.
 * 
 * Table DDL (run once in Supabase SQL editor):
 * 
 * create table if not exists public.user_integrations (
 *   id              uuid primary key default gen_random_uuid(),
 *   user_id         uuid not null references auth.users(id) on delete cascade,
 *   provider        text not null,          -- 'google' | 'autodesk'
 *   access_token    text not null,
 *   refresh_token   text,
 *   expires_at      timestamptz,
 *   scope           text,
 *   provider_email  text,
 *   provider_name   text,
 *   connected_at    timestamptz default now(),
 *   unique(user_id, provider)
 * );
 * alter table public.user_integrations enable row level security;
 * create policy "Users manage own integrations"
 *   on public.user_integrations for all
 *   using (auth.uid() = user_id)
 *   with check (auth.uid() = user_id);
 */

import { createSupabaseServer } from '@/lib/supabase/server'

export interface TokenRecord {
  provider:       string
  access_token:   string
  refresh_token?: string | null
  expires_at?:    string | null
  scope?:         string | null
  provider_email?: string | null
  provider_name?:  string | null
}

export async function saveToken(userId: string, record: TokenRecord) {
  const supabase = await createSupabaseServer()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('user_integrations')
    .upsert({ user_id: userId, ...record }, { onConflict: 'user_id,provider' })
  if (error) throw new Error(`Token save failed: ${error.message}`)
}

export async function getToken(userId: string, provider: string): Promise<TokenRecord | null> {
  const supabase = await createSupabaseServer()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('user_integrations')
    .select('*')
    .eq('user_id', userId)
    .eq('provider', provider)
    .single()
  if (error || !data) return null
  return data as TokenRecord
}

export async function deleteToken(userId: string, provider: string) {
  const supabase = await createSupabaseServer()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from('user_integrations')
    .delete()
    .eq('user_id', userId)
    .eq('provider', provider)
}

export async function listConnectedProviders(userId: string): Promise<string[]> {
  const supabase = await createSupabaseServer()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('user_integrations')
    .select('provider')
    .eq('user_id', userId)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((r: any) => r.provider)
}

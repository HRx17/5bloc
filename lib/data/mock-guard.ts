import { isMockAuthEnabled, hasSupabaseEnv } from '@/lib/rbac/mock'

export function shouldServeMockData(auth: { isMock?: boolean } | null | undefined): boolean {
  return !!(auth?.isMock && isMockAuthEnabled())
}

export function liveDataUnavailableResponse() {
  return { error: 'Live database required. Set Supabase env and MOCK_AUTH=0.' }
}

export { hasSupabaseEnv }

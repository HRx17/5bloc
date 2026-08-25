import { analytics } from '@heycatch/sdk'

analytics.init({
  projectKey: 'hck_pk_nJKMOeZckben52uor9gZCmFFhZ3ktzSj',
})

export { analytics }

export async function resolveAuthUserId(
  supabase: { from: (table: string) => any },
  profileId: string,
): Promise<string> {
  const { data } = await supabase.from('profiles').select('auth_id').eq('id', profileId).maybeSingle()
  return (data?.auth_id as string | undefined) || profileId
}

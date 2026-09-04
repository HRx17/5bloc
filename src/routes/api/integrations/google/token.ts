import { createFileRoute } from '@tanstack/react-router'
import { getAuthUserOrNull, json } from '@/lib/api/get-user.server'
import { getFreshGoogleToken } from '@/lib/integrations/token-refresh'
import { getGoogleAppId, getGooglePickerApiKey } from '@/lib/integrations/google'

export const dynamic = 'force-dynamic'

/** Short-lived access token for the Google Picker (authenticated users only). */
const handleGET = async ({ request }: any) => {
  const auth = await getAuthUserOrNull(request)
  const user = auth?.user ?? null
  const supabase = auth?.supabase as any
  if (!user) return json({ error: 'Unauthorized' }, { status: 401 })

  const accessToken = await getFreshGoogleToken(user.id)
  if (!accessToken) {
    return json({ error: 'Google not connected' }, { status: 400 })
  }

  return json({
    accessToken,
    appId: getGoogleAppId(),
    apiKey: getGooglePickerApiKey() ?? null,
  })
}

export const Route = createFileRoute('/api/integrations/google/token')({
  server: {
    handlers: {
        GET: handleGET,
    },
  },
})

import { createFileRoute } from '@tanstack/react-router'
import { getAuthUserOrNull, json } from '@/lib/api/get-user.server'
import { deleteToken } from '@/lib/integrations/token-store'

const handlePOST = async ({ request }: any) => {
  const auth = await getAuthUserOrNull(request)
  const user = auth?.user ?? null
  const supabase = auth?.supabase as any
  if (!user) return json({ error: 'Unauthorized' }, { status: 401 })

  await deleteToken(user.id, 'google')
  return json({ success: true })
}

export const Route = createFileRoute('/api/integrations/google/disconnect')({
  server: {
    handlers: {
        POST: handlePOST,
    },
  },
})

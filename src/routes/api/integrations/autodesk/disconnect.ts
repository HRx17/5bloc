import { createFileRoute } from '@tanstack/react-router'
import { createSupabaseServer } from '@/lib/supabase/server'
import { deleteToken } from '@/lib/integrations/token-store'

const handlePOST = async ({ request }: any) => {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return json({ error: 'Unauthorized' }, { status: 401 })

  await deleteToken(user.id, 'autodesk')
  return json({ success: true })
}

export const Route = createFileRoute('/api/integrations/autodesk/disconnect')({
  server: {
    handlers: {
        POST: handlePOST,
    },
  },
})

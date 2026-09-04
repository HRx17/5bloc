import { createFileRoute } from '@tanstack/react-router'
import { createSupabaseServer } from '@/lib/supabase/server'
import { getAppToken } from '@/lib/integrations/autodesk'

export const dynamic = 'force-dynamic'

const handleGET = async ({ request }: any) => {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return json({ error: 'Unauthorized' }, { status: 401 })

  if (!process.env.AUTODESK_CLIENT_ID || !process.env.AUTODESK_CLIENT_SECRET) {
    return json({ error: 'Autodesk not configured' }, { status: 503 })
  }

  try {
    // 2-legged token is safe to expose to the viewer (viewer:read scope)
    const tokenData = await getAppToken()
    return json({
      access_token: tokenData.access_token,
      expires_in:   tokenData.expires_in,
    })
  } catch (e) {
    console.error('Viewer token error:', e)
    return json({ error: 'Could not obtain viewer token' }, { status: 500 })
  }
}

export const Route = createFileRoute('/api/integrations/autodesk/viewer-token')({
  server: {
    handlers: {
        GET: handleGET,
    },
  },
})

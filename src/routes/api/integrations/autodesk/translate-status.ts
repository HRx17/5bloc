import { createFileRoute } from '@tanstack/react-router'
import { getAuthUserOrNull, json } from '@/lib/api/get-user.server'
import { getAppToken, getTranslationStatus } from '@/lib/integrations/autodesk'

export const dynamic = 'force-dynamic'

const handleGET = async ({ request }: any) => {
  const auth = await getAuthUserOrNull(request)
  const user = auth?.user ?? null
  const supabase = auth?.supabase as any
  if (!user) return json({ error: 'Unauthorized' }, { status: 401 })

  const urn = new URL(request.url).searchParams.get('urn')
  if (!urn) return json({ error: 'urn required' }, { status: 400 })

  try {
    const { access_token } = await getAppToken()
    const manifest = await getTranslationStatus(access_token, urn)
    return json({
      status:   manifest.status,    // 'pending' | 'inprogress' | 'success' | 'failed' | 'timeout'
      progress: manifest.progress,  // e.g. '50% complete'
    })
  } catch (e: any) {
    // Manifest 404 = translation job just started, not yet registered
    return json({ status: 'pending', progress: '0% complete' })
  }
}

export const Route = createFileRoute('/api/integrations/autodesk/translate-status')({
  server: {
    handlers: {
        GET: handleGET,
    },
  },
})

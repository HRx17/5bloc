import { createFileRoute } from '@tanstack/react-router'
import { json } from '@/lib/api/get-user.server'
import { createServiceRoleClient, createSupabasePublicClient, hasValidServiceRoleKey, isSupabaseConfigured } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

function relativeTime(iso: string) {
  const ms = Date.now() - new Date(iso).getTime()
  const mins = Math.max(1, Math.round(ms / 60000))
  if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.round(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

const handleGET = async ({ request }: any) => {
  const fallback = {
    last_city: 'Mumbai',
    last_label: 'Someone joined the waitlist recently',
  }

  if (!isSupabaseConfigured()) return json(fallback)

  try {
    const supabase = hasValidServiceRoleKey() ? createServiceRoleClient() : createSupabasePublicClient()
    const { data } = await supabase
      .from('waitlist')
      .select('city, created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!data?.created_at) return json(fallback)
    const city = (data.city || '').trim() || 'India'
    return json({
      last_city: city,
      last_label: `Last signup from ${city} · ${relativeTime(data.created_at)}`,
    })
  } catch {
    return json(fallback)
  }
}

export const Route = createFileRoute('/api/waitlist/stats')({
  server: {
    handlers: {
        GET: handleGET,
    },
  },
})

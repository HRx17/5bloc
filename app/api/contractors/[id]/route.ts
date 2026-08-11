import { NextResponse } from 'next/server'
import { shouldServeMockData, liveDataUnavailableResponse, hasSupabaseEnv } from '@/lib/data/mock-guard'
import { getAuthUserOrNull } from '@/lib/supabase/get-user'
import { MOCK_CONTRACTORS } from '@/lib/data/mock-store'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const auth = await getAuthUserOrNull()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (shouldServeMockData(auth)) {
    const contractor = MOCK_CONTRACTORS.find((c) => c.id === id)
    if (!contractor) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({
      contractor: {
        ...contractor,
        portfolio: (contractor.portfolio_photos || []).map((url: string, i: number) => ({
          title: `Project ${i + 1}`,
          image: url || null,
        })),
        reviews: [],
        website: (contractor as any).website || '',
      },
    })
  }
  if (!hasSupabaseEnv() || !auth.supabase) {
    return NextResponse.json(liveDataUnavailableResponse(), { status: 503 })
  }


  const { data, error } = await auth.supabase.from('contractors').select('*').eq('id', id).maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({
    contractor: {
      ...data,
      portfolio: (data.portfolio_photos || []).map((url: string, i: number) => ({
        title: `Project ${i + 1}`,
        image: url || null,
      })),
      reviews: [],
      website: data.website || '',
    },
  })
}

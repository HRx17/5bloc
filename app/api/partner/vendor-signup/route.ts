import { NextRequest, NextResponse } from 'next/server'
import { friendlySignupDbError, getSignupDb, isDbUnreachableError } from '@/lib/signup/db'
import { notifySignup } from '@/lib/email/signup-notify'
import { checkPublicRateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const businessName = typeof body.business_name === 'string' ? body.business_name.trim() : ''
    const contactName = typeof body.contact_name === 'string' ? body.contact_name.trim() : ''
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const city = typeof body.city === 'string' ? body.city.trim() : ''
    const categories = Array.isArray(body.categories)
      ? body.categories.filter((s: unknown) => typeof s === 'string')
      : []

    if (!businessName || !contactName || !email || !city) {
      return NextResponse.json({ error: 'Please fill in the required fields.' }, { status: 400 })
    }
    if (categories.length === 0) {
      return NextResponse.json({ error: 'Pick at least one category.' }, { status: 400 })
    }

    const rate = await checkPublicRateLimit(email, 'vendor_signup', 5)
    if (!rate.allowed) {
      return NextResponse.json({ error: 'Too many requests. Try again tomorrow.' }, { status: 429 })
    }

    const country = typeof body.country === 'string' ? body.country : 'india'
    const notify = () =>
      void notifySignup({
        kind: 'vendor_listing',
        email,
        name: contactName,
        role: 'vendor',
        firm: businessName,
        city,
        country,
        extras: categories.join(', '),
      })

    try {
      const db = getSignupDb()
      const { error } = await db.from('vendor_signups').insert({
        business_name: businessName,
        contact_name: contactName,
        email,
        phone: typeof body.phone === 'string' && body.phone.trim() ? body.phone.trim() : null,
        country,
        city,
        state: typeof body.state === 'string' && body.state.trim() ? body.state.trim() : null,
        categories,
        team_size: typeof body.team_size === 'string' && body.team_size ? body.team_size : null,
        years_experience: body.years_experience != null ? Number(body.years_experience) : null,
        website: typeof body.website === 'string' && body.website.trim() ? body.website.trim() : null,
        bio: typeof body.bio === 'string' && body.bio.trim() ? body.bio.trim() : null,
        photos: Array.isArray(body.photos) ? body.photos.filter((p: unknown) => typeof p === 'string') : [],
        source: typeof body.source === 'string' ? body.source : 'join-as-vendor',
        status: 'pending',
      })

      if (error) {
        console.error('Vendor signup insert error:', error)
        if (isDbUnreachableError(error)) {
          notify()
          return NextResponse.json({
            ok: true,
            queued: true,
            message: friendlySignupDbError(error, 'Vendor listing'),
          })
        }
        return NextResponse.json({ error: friendlySignupDbError(error, 'Vendor listing') }, { status: 500 })
      }
    } catch (dbErr: unknown) {
      const message = dbErr instanceof Error ? dbErr.message : 'Vendor signup failed'
      console.error('Vendor signup DB exception:', message)
      if (isDbUnreachableError({ message })) {
        notify()
        return NextResponse.json({
          ok: true,
          queued: true,
          message: friendlySignupDbError({ message }, 'Vendor listing'),
        })
      }
      return NextResponse.json({ error: message }, { status: 500 })
    }

    notify()
    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Vendor signup failed'
    console.error('Vendor signup API error:', message)
    return NextResponse.json({
      error: isDbUnreachableError({ message })
        ? friendlySignupDbError({ message }, 'Vendor listing')
        : message,
    }, { status: 500 })
  }
}

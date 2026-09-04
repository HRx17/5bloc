import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'
import { homeForRole } from '@/lib/rbac/roles'

const onboardingSchema = z.object({
  role: z.enum(['architect', 'contractor', 'builder', 'consultant', 'client']),
  invite_flow: z.boolean().optional(),
  full_name: z.string().min(1),
  phone: z.string().nullish(),
  firm_name: z.string().nullish(),
  company_name: z.string().nullish(),
  city: z.string().nullish(),
  state: z.string().nullish(),
  firm_type: z.string().nullish(),
  gst_number: z.string().nullish(),
  bio: z.string().nullish(),
  specializations: z.array(z.string()).optional(),
  service_cities: z.array(z.string()).optional(),
  years_experience: z.number().nullish(),
  team_size: z.number().nullish(),
  discipline: z.string().nullish(),
})

export const completeOnboarding = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => onboardingSchema.parse(data))
  .handler(async ({ data, context }) => {
    const supabase = context.supabase
    const email = (context.claims as { email?: string }).email ?? null

    // Ensure a profile row exists for this account.
    const { data: existing } = await supabase
      .from('profiles')
      .select('id, org_id')
      .eq('auth_id', context.userId)
      .maybeSingle()

    let profileId = existing?.id ?? null
    if (!profileId) {
      const { data: created, error: createError } = await supabase
        .from('profiles')
        .insert({
          auth_id: context.userId,
          email,
          full_name: data.full_name,
          role: data.role,
        })
        .select('id')
        .single()
      if (createError) throw new Error(createError.message)
      profileId = created.id
    }

    const updates: {
      role: string
      full_name: string
      phone: string | null
      onboarded_at: string
      org_id?: string
      discipline?: string
    } = {
      role: data.role,
      full_name: data.full_name,
      phone: data.phone ?? null,
      onboarded_at: new Date().toISOString(),
    }

    if (!data.invite_flow && data.role === 'architect') {
      if (!data.firm_name || !data.city) {
        throw new Error('Firm name and city are required')
      }
      const { data: org, error: orgError } = await supabase
        .from('organisations')
        .insert({
          name: data.firm_name,
          type: data.firm_type || 'both',
          owner_id: profileId,
          city: data.city,
          state: data.state ?? null,
          gst_number: data.gst_number ?? null,
          plan: 'free',
        })
        .select('id')
        .single()
      if (orgError) throw new Error(orgError.message)
      updates.org_id = org.id
      await supabase.from('organisation_members').upsert(
        { org_id: org.id, profile_id: profileId, member_role: 'owner', status: 'active' },
        { onConflict: 'org_id,profile_id' },
      )
    }

    if (data.role === 'consultant' && data.discipline) {
      updates.discipline = data.discipline
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', profileId)
    if (updateError) throw new Error(updateError.message)

    if (data.role === 'contractor') {
      await supabase.from('contractors').upsert(
        {
          user_id: profileId,
          company_name: data.company_name || data.firm_name || 'My Company',
          bio: data.bio ?? null,
          specializations: data.specializations ?? [],
          service_cities: data.service_cities?.length
            ? data.service_cities
            : data.city
              ? [data.city]
              : [],
          service_states: data.state ? [data.state] : [],
          gst_number: data.gst_number ?? null,
          team_size: data.team_size ?? null,
          years_experience: data.years_experience ?? null,
        },
        { onConflict: 'user_id' },
      )
    }

    return { ok: true, redirect: homeForRole(data.role) }
  })

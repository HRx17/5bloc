const fs = require('fs')
const path = require('path')
const root = 'C:/Users/olive/Downloads/5Bloc/5bloc-web'
const files = [
  'app/api/projects/route.ts',
  'app/api/projects/[id]/route.ts',
  'app/api/projects/[id]/members/route.ts',
  'app/api/projects/[id]/documents/route.ts',
  'app/api/projects/[id]/rfis/route.ts',
  'app/api/projects/[id]/milestones/route.ts',
  'app/api/projects/[id]/tenders/route.ts',
  'app/api/onboarding/route.ts',
  'app/api/me/route.ts',
  'app/api/invites/accept/route.ts',
  'app/api/invites/route.ts',
  'app/api/bids/route.ts',
  'app/api/clients/route.ts',
  'app/api/clients/[id]/route.ts',
  'lib/supabase/middleware.ts',
  'app/(auth)/login/LoginClient.tsx',
  'app/api/webhooks/stripe/route.ts',
  'app/api/webhooks/razorpay/route.ts',
]
for (const f of files) {
  const p = path.join(root, f)
  if (!fs.existsSync(p)) continue
  let c = fs.readFileSync(p, 'utf8')
  c = c.replace(/\.from\('users'\)/g, ".from('profiles')")
  c = c.replace(/\.eq\('user_id', auth\.profile\.id\)/g, ".eq('profile_id', auth.profile.id)")
  c = c.replace(/user_id: auth\.profile\.id/g, 'profile_id: auth.profile.id')
  c = c.replace(/\.eq\('user_id', profile\.id\)/g, ".eq('profile_id', profile.id)")
  c = c.replace(/user_id: profile\.id/g, 'profile_id: profile.id')
  c = c.replace(/user_id: contractor\.user_id/g, 'profile_id: contractor.user_id')
  c = c.replace(/select\('\*, users\(full_name, email\)'\)/g, "select('*, profiles(full_name, email)')")
  c = c.replace(/m\.users\?\.full_name/g, 'm.profiles?.full_name')
  fs.writeFileSync(p, c)
  console.log('updated', f)
}

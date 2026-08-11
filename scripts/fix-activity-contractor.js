const fs = require('fs')
const path = require('path')
const root = 'C:/Users/olive/Downloads/5Bloc/5bloc-web'
const files = [
  'app/api/projects/route.ts',
  'app/api/projects/[id]/documents/route.ts',
  'app/api/projects/[id]/rfis/route.ts',
  'app/api/projects/[id]/milestones/route.ts',
  'app/api/projects/[id]/tenders/route.ts',
  'app/api/onboarding/route.ts',
]
for (const f of files) {
  const p = path.join(root, f)
  let c = fs.readFileSync(p, 'utf8')
  // activity_log uses user_id column
  c = c.replace(/from\('activity_log'\)\.insert\(\{([\s\S]*?)profile_id:/g, "from('activity_log').insert({$1user_id:")
  // contractors table uses user_id
  c = c.replace(/from\('contractors'\)\.upsert\(\s*\{\s*profile_id:/g, "from('contractors').upsert({\n        user_id:")
  fs.writeFileSync(p, c)
  console.log('fixed', f)
}

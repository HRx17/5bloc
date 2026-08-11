const fs = require('fs')
const path = require('path')

function walk(d, acc = []) {
  for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, ent.name)
    if (ent.isDirectory()) walk(p, acc)
    else if (ent.name.endsWith('.ts') || ent.name.endsWith('.tsx')) acc.push(p)
  }
  return acc
}

const files = walk('app/api').concat(['lib/notifications/notify.ts'].filter((f) => fs.existsSync(f)))
let changed = 0

for (const f of files) {
  let s = fs.readFileSync(f, 'utf8')
  const orig = s
  if (!/auth\.isMock\s*\|\|\s*!hasSupabaseEnv\(\)/.test(s)) continue

  if (!/shouldServeMockData/.test(s)) {
    if (/from ['"]@\/lib\/rbac\/mock['"]/.test(s)) {
      s = s.replace(
        /import\s*\{([^}]+)\}\s*from\s*['"]@\/lib\/rbac\/mock['"]/,
        (full, inner) => {
          if (inner.includes('shouldServeMockData')) return full
          const parts = inner
            .split(',')
            .map((x) => x.trim())
            .filter(Boolean)
          parts.push('shouldServeMockData')
          return `import { ${parts.join(', ')} } from '@/lib/rbac/mock'`
        }
      )
    } else {
      const firstImportEnd = s.indexOf('\n')
      s =
        s.slice(0, firstImportEnd + 1) +
        `import { shouldServeMockData, hasSupabaseEnv } from '@/lib/rbac/mock'\n` +
        s.slice(firstImportEnd + 1)
    }
  }

  s = s.replace(/auth\.isMock\s*\|\|\s*!hasSupabaseEnv\(\)/g, 'shouldServeMockData(auth)')

  if (s !== orig) {
    fs.writeFileSync(f, s)
    changed++
    console.log('patched', f)
  }
}
console.log('files changed', changed)

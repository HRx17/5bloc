/**
 * Rewire API routes: import mock-guard, insert 503 after shouldServeMockData blocks.
 */
const fs = require('fs')
const path = require('path')

function walk(d, acc = []) {
  for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, ent.name)
    if (ent.isDirectory()) walk(p, acc)
    else if (ent.name.endsWith('.ts')) acc.push(p)
  }
  return acc
}

function findMatchingBrace(s, openIdx) {
  let depth = 0
  for (let i = openIdx; i < s.length; i++) {
    const c = s[i]
    if (c === '{') depth++
    else if (c === '}') {
      depth--
      if (depth === 0) return i
    }
  }
  return -1
}

function insert503AfterMockBlocks(s) {
  const marker = 'liveDataUnavailableResponse()'
  const needle = /if\s*\(\s*shouldServeMockData\s*\(\s*auth\s*\)\s*\)\s*\{/g
  let out = ''
  let last = 0
  let m
  const inserts = []

  while ((m = needle.exec(s)) !== null) {
    const openBrace = s.indexOf('{', m.index + m[0].length - 1)
    const close = findMatchingBrace(s, openBrace)
    if (close < 0) continue
    inserts.push(close + 1)
  }

  // Process from end so indices stay valid
  for (let i = inserts.length - 1; i >= 0; i--) {
    const at = inserts[i]
    const after = s.slice(at)
    // Already has 503 nearby?
    const peek = after.slice(0, 220)
    if (peek.includes('liveDataUnavailableResponse')) continue
    // Don't insert if next meaningful statement returns before supabase in a weird way —
    // always insert; duplicate is prevented by peek check.
    const indentMatch = s.slice(Math.max(0, at - 80), at).match(/\n([ \t]*)\}?$/)
    // Detect indentation of the if statement
    const lineStart = s.lastIndexOf('\n', at - 1) + 1
    // Find indent of the if (shouldServeMockData...) line by scanning back
    let ifLineStart = lineStart
    // The closing brace line — get its indent
    const closeLineStart = s.lastIndexOf('\n', at - 1) + 1
    const closeIndent = s.slice(closeLineStart, at).match(/^([ \t]*)/)?.[1] || '  '

    const block =
      `\n${closeIndent}if (!hasSupabaseEnv() || !auth.supabase) {\n` +
      `${closeIndent}  return NextResponse.json(liveDataUnavailableResponse(), { status: 503 })\n` +
      `${closeIndent}}\n`

    // Avoid double blank lines: if next char is newline already, block starts with \n which is fine
    s = s.slice(0, at) + block + s.slice(at)
  }
  return s
}

function updateImports(s) {
  // Remove shouldServeMockData from @/lib/rbac/mock imports; keep other symbols
  s = s.replace(
    /import\s*\{([^}]+)\}\s*from\s*['"]@\/lib\/rbac\/mock['"]\s*;?/g,
    (full, inner) => {
      const parts = inner
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean)
        .filter((p) => p !== 'shouldServeMockData' && p !== 'liveDataUnavailableResponse')
      if (parts.length === 0) return ''
      // If only hasSupabaseEnv was left AND we'll import it from mock-guard, drop this import
      const onlySupabase = parts.length === 1 && parts[0] === 'hasSupabaseEnv'
      const onlyMockAuth = parts.every((p) =>
        ['hasSupabaseEnv', 'isMockAuthEnabled', 'getMockProfile'].includes(p)
      )
      // Keep isMockAuthEnabled / getMockProfile from rbac/mock; hasSupabaseEnv can come from either
      if (parts.includes('isMockAuthEnabled') || parts.includes('getMockProfile')) {
        return `import { ${parts.join(', ')} } from '@/lib/rbac/mock'`
      }
      if (onlySupabase) return '' // will come from mock-guard
      return `import { ${parts.join(', ')} } from '@/lib/rbac/mock'`
    }
  )

  // Clean double blank lines from removed imports
  s = s.replace(/\n{3,}/g, '\n\n')

  const needsGuard =
    /shouldServeMockData|liveDataUnavailableResponse/.test(s) ||
    /if\s*\(\s*shouldServeMockData/.test(s)

  if (needsGuard && !/from\s*['"]@\/lib\/data\/mock-guard['"]/.test(s)) {
    // Prefer importing after first import line
    const re = /^import .+$/m
    const m = s.match(re)
    if (m) {
      const idx = s.indexOf(m[0]) + m[0].length
      s =
        s.slice(0, idx) +
        `\nimport { shouldServeMockData, liveDataUnavailableResponse, hasSupabaseEnv } from '@/lib/data/mock-guard'` +
        s.slice(idx)
    } else {
      s =
        `import { shouldServeMockData, liveDataUnavailableResponse, hasSupabaseEnv } from '@/lib/data/mock-guard'\n` +
        s
    }
  } else if (/from\s*['"]@\/lib\/data\/mock-guard['"]/.test(s)) {
    // Ensure symbols present
    s = s.replace(
      /import\s*\{([^}]+)\}\s*from\s*['"]@\/lib\/data\/mock-guard['"]/,
      (full, inner) => {
        const parts = new Set(
          inner
            .split(',')
            .map((x) => x.trim())
            .filter(Boolean)
        )
        parts.add('shouldServeMockData')
        parts.add('liveDataUnavailableResponse')
        parts.add('hasSupabaseEnv')
        return `import { ${[...parts].join(', ')} } from '@/lib/data/mock-guard'`
      }
    )
  }

  // If hasSupabaseEnv is imported from both, drop from rbac/mock when mock-guard has it
  if (/from\s*['"]@\/lib\/data\/mock-guard['"]/.test(s)) {
    s = s.replace(
      /import\s*\{([^}]+)\}\s*from\s*['"]@\/lib\/rbac\/mock['"]/,
      (full, inner) => {
        const parts = inner
          .split(',')
          .map((x) => x.trim())
          .filter(Boolean)
          .filter((p) => p !== 'hasSupabaseEnv' && p !== 'shouldServeMockData')
        if (parts.length === 0) return ''
        return `import { ${parts.join(', ')} } from '@/lib/rbac/mock'`
      }
    )
    s = s.replace(/\n{3,}/g, '\n\n')
  }

  return s
}

const root = path.join(__dirname, '..')
const apiRoot = path.join(root, 'app', 'api')
const files = walk(apiRoot)
let changed = 0

for (const f of files) {
  let s = fs.readFileSync(f, 'utf8')
  const orig = s
  if (!/shouldServeMockData|auth\.isMock\s*\|\|/.test(s)) continue

  // Fix remaining old patterns
  s = s.replace(
    /auth\.isMock\s*\|\|\s*isMockAuthEnabled\(\)\s*\|\|\s*!hasSupabaseEnv\(\)/g,
    'shouldServeMockData(auth)'
  )
  s = s.replace(/auth\.isMock\s*\|\|\s*!hasSupabaseEnv\(\)/g, 'shouldServeMockData(auth)')

  s = insert503AfterMockBlocks(s)
  s = updateImports(s)

  if (s !== orig) {
    fs.writeFileSync(f, s)
    changed++
    console.log('patched', path.relative(root, f))
  }
}

console.log('files changed', changed)

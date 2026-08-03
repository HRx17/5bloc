/**
 * Tiny smoke checks for safeRedirectPath (no test runner in package.json).
 * Run: node --experimental-strip-types scripts/smoke-security.mjs
 * Or after build: node scripts/smoke-security.mjs (uses compiled logic inline)
 */
import assert from 'node:assert/strict'

function safeRedirectPath(next, fallback = '/dashboard') {
  if (!next || typeof next !== 'string') return fallback
  const trimmed = next.trim()
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.includes('\\')) {
    return fallback
  }
  try {
    const decoded = decodeURIComponent(trimmed)
    if (decoded.startsWith('//') || decoded.includes('://') || /[\x00-\x1f]/.test(decoded)) {
      return fallback
    }
  } catch {
    return fallback
  }
  const pathOnly = trimmed.split('#')[0]
  return pathOnly || fallback
}

assert.equal(safeRedirectPath('/dashboard'), '/dashboard')
assert.equal(safeRedirectPath('/projects/abc?tab=1'), '/projects/abc?tab=1')
assert.equal(safeRedirectPath('//evil.com'), '/dashboard')
assert.equal(safeRedirectPath('https://evil.com'), '/dashboard')
assert.equal(safeRedirectPath('/\\evil'), '/dashboard')
assert.equal(safeRedirectPath('/%2f%2fevil.com'), '/dashboard')
assert.equal(safeRedirectPath(null), '/dashboard')
assert.equal(safeRedirectPath('/ok#hash'), '/ok')

console.log('smoke-security: safeRedirectPath OK')

/**
 * Prevent open redirects via `next` query params.
 * Only same-origin relative paths like `/dashboard` are allowed.
 * Rejects protocol-relative (`//evil.com`) and absolute URLs.
 */
export function safeRedirectPath(
  next: string | null | undefined,
  fallback = '/dashboard',
): string {
  if (!next || typeof next !== 'string') return fallback

  const trimmed = next.trim()
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.includes('\\')) {
    return fallback
  }

  try {
    const decoded = decodeURIComponent(trimmed)
    if (
      decoded.startsWith('//') ||
      decoded.includes('://') ||
      /[\x00-\x1f]/.test(decoded)
    ) {
      return fallback
    }
  } catch {
    return fallback
  }

  // Keep path + query only; drop hash fragments that could confuse clients
  const pathOnly = trimmed.split('#')[0]
  return pathOnly || fallback
}

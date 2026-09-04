export async function sendConfirmEmail(email: string, redirectTo?: string) {
  const res = await fetch('/api/auth/confirm-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, redirectTo }),
  })
  const data = await res.json().catch(() => ({}))
  if (res.ok) return { ok: true as const, mock: !!data.mock }
  if (data.fallback === 'supabase') {
    return { ok: false as const, fallback: true as const, error: data.error as string | undefined }
  }
  throw new Error(data.error || 'Could not send the confirmation email')
}

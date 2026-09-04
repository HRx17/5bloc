/**
 * The original app sent confirmation emails through its own mailer.
 * Until that is wired up here, always fall back to the backend's built-in
 * confirmation email (handled by the caller).
 */
export async function sendConfirmEmail(_email: string, _redirectTo?: string) {
  return { ok: false as const, fallback: true as const, error: undefined as string | undefined }
}

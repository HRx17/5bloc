/** Returns true when the user still needs to finish onboarding (role, profile, workspace). */
export function needsOnboarding(
  user: { user_metadata?: Record<string, unknown> } | null | undefined,
  orgId: string | null | undefined
): boolean {
  if (!user) return false
  if (user.user_metadata?.onboarding_complete === true) return false
  if (orgId) return false
  return true
}

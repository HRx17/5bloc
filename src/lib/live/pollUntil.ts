/** Polls `fn` until `pred` is true or attempts run out. Used after webhook-backed status changes. */
export async function pollUntil<T>(
  fn: () => Promise<T>,
  pred: (value: T) => boolean,
  opts?: { attempts?: number; intervalMs?: number }
): Promise<T | null> {
  const attempts = opts?.attempts ?? 10
  const intervalMs = opts?.intervalMs ?? 1500
  let last: T | null = null
  for (let i = 0; i < attempts; i++) {
    await new Promise((r) => setTimeout(r, intervalMs))
    try {
      last = await fn()
      if (pred(last)) return last
    } catch {
      /* keep polling */
    }
  }
  return last
}

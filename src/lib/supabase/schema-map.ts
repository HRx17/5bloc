/**
 * Live Supabase uses `profiles` + `project_members.profile_id`.
 * App code historically used `users` + `user_id`. These helpers keep queries consistent.
 */

export const PROFILE_TABLE = 'profiles' as const

/** Map insert/update payloads that still use user_id → profile_id */
export function memberWrite(payload: Record<string, unknown>) {
  const next = { ...payload }
  if ('user_id' in next && !('profile_id' in next)) {
    next.profile_id = next.user_id
    delete next.user_id
  }
  return next
}

/** Normalize member rows so UI always sees user_id */
export function memberRead(row: any) {
  if (!row) return row
  return {
    ...row,
    user_id: row.user_id ?? row.profile_id,
    full_name: row.full_name ?? row.profiles?.full_name ?? row.invite_email,
  }
}

/** Normalize document rows for app field names */
export function documentRead(row: any) {
  if (!row) return row
  return {
    ...row,
    name: row.name || row.original_filename,
    r2_key: row.r2_key || row.storage_path,
    size_bytes: row.size_bytes ?? row.file_size ?? 0,
    extension: row.extension || row.file_type || 'pdf',
  }
}

/** Normalize milestone rows */
export function milestoneRead(row: any) {
  if (!row) return row
  return {
    ...row,
    phase: row.phase || row.phase_key,
    completion_pct: row.completion_pct ?? row.completion ?? 0,
    fee_amount: row.fee_amount ?? row.fee ?? 0,
    fee_paid: row.fee_paid ?? row.paid ?? false,
  }
}

/** Normalize client rows */
export function clientRead(row: any) {
  if (!row) return row
  return {
    ...row,
    full_name: row.full_name || row.name,
  }
}

export function clientWrite(payload: Record<string, unknown>) {
  const next = { ...payload }
  if ('full_name' in next) {
    next.name = next.full_name
  }
  return next
}

export function milestoneWrite(payload: Record<string, unknown>) {
  const next = { ...payload }
  if ('phase' in next) next.phase_key = next.phase
  if ('completion_pct' in next) next.completion = next.completion_pct
  if ('fee_amount' in next) next.fee = next.fee_amount
  if ('fee_paid' in next) next.paid = next.fee_paid
  return next
}

export function documentWrite(payload: Record<string, unknown>) {
  const next = { ...payload }
  if ('r2_key' in next && !('storage_path' in next)) {
    next.storage_path = next.r2_key
  }
  if ('size_bytes' in next && !('file_size' in next)) {
    next.file_size = next.size_bytes
  }
  if ('name' in next && !('original_filename' in next)) {
    next.original_filename = next.name
  }
  if ('extension' in next && !('file_type' in next)) {
    next.file_type = next.extension
  }
  return next
}

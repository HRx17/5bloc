import { createFileRoute } from '@tanstack/react-router'
import { createSupabaseServer } from '@/lib/supabase/server'
import { getFreshGoogleToken, getFreshAutodeskToken } from '@/lib/integrations/token-refresh'
import { getDriveLinks } from '@/lib/integrations/drive-links'
import { listDriveFolderChildren, getDriveFile, listGmailThreads, listCalendarEvents } from '@/lib/integrations/google'
import { getAutodeskUserProfile, getAppToken } from '@/lib/integrations/autodesk'
import { getProviderStatus, isProviderId, type ProviderId } from '@/lib/integrations/config'

export const dynamic = 'force-dynamic'

/**
 * Performs a real read against each provider API and reports the counts it actually
 * saw. Nothing here reports success it did not observe — a provider that is missing
 * credentials, missing a token, or returning errors surfaces those as failures.
 */

export interface SyncResource {
  key:    string
  label:  string
  count?: number
  error?: string
}

const FOLDER_MIME = 'application/vnd.google-apps.folder'

async function syncGoogle(userId: string, token: string): Promise<SyncResource[]> {
  const resources: SyncResource[] = []

  try {
    const { driveFileIds, driveFolders } = await getDriveLinks(userId)
    const seen = new Set<string>()

    for (const fileId of driveFileIds) {
      const file = await getDriveFile(token, fileId)
      if (file && file.mimeType !== FOLDER_MIME) seen.add(file.id)
    }
    for (const folder of driveFolders) {
      const children = await listDriveFolderChildren(token, folder.id)
      for (const child of children) seen.add(child.id)
    }

    resources.push({
      key:   'drive',
      label: driveFolders.length
        ? `Drive files across ${driveFolders.length} linked folder${driveFolders.length === 1 ? '' : 's'}`
        : 'Drive files',
      count: seen.size,
      ...(driveFolders.length || driveFileIds.length
        ? {}
        : { error: 'No Drive folder linked yet - link one from Documents' }),
    })
  } catch (e) {
    resources.push({ key: 'drive', label: 'Drive files', error: message(e) })
  }

  try {
    const { threads } = await listGmailThreads(token, '', 20)
    resources.push({ key: 'gmail', label: 'Gmail threads', count: threads?.length ?? 0 })
  } catch (e) {
    resources.push({ key: 'gmail', label: 'Gmail threads', error: message(e) })
  }

  try {
    const { items } = await listCalendarEvents(token)
    resources.push({ key: 'calendar', label: 'Upcoming calendar events', count: items?.length ?? 0 })
  } catch (e) {
    resources.push({ key: 'calendar', label: 'Upcoming calendar events', error: message(e) })
  }

  return resources
}

async function syncAutodesk(token: string): Promise<SyncResource[]> {
  const resources: SyncResource[] = []

  try {
    const profile = await getAutodeskUserProfile(token)
    if (!profile?.userId) throw new Error('Autodesk rejected the stored token - reconnect required')
    resources.push({ key: 'account', label: `Signed in as ${profile.emailId ?? profile.userName}`, count: 1 })
  } catch (e) {
    resources.push({ key: 'account', label: 'Autodesk account', error: message(e) })
  }

  try {
    await getAppToken()
    resources.push({ key: 'translation', label: 'Model translation service reachable', count: 1 })
  } catch (e) {
    resources.push({ key: 'translation', label: 'Model translation service', error: message(e) })
  }

  return resources
}

function message(e: unknown): string {
  return e instanceof Error ? e.message : 'Unknown error'
}

const handlePOST = async ({ request }: any) => {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return json({ error: 'Unauthorized' }, { status: 401 })

  let provider: string
  try {
    const body = await request.json() as { provider?: string }
    provider = body.provider ?? ''
  } catch {
    return json({ error: 'Expected a JSON body with a provider' }, { status: 400 })
  }

  if (!isProviderId(provider)) {
    return json({ error: `Unknown integration "${provider}"` }, { status: 400 })
  }

  const status = getProviderStatus(provider as ProviderId)
  if (!status.configured) {
    return json(
      {
        error: `${label(provider)} is not configured on this server. Missing: ${status.missingEnv.join(', ')}`,
        missingEnv: status.missingEnv,
      },
      { status: 503 },
    )
  }

  const token = provider === 'google'
    ? await getFreshGoogleToken(user.id)
    : await getFreshAutodeskToken(user.id)

  if (!token) {
    return json(
      { error: `${label(provider)} is not connected. Connect it first, then sync.`, notConnected: true },
      { status: 409 },
    )
  }

  const resources = provider === 'google'
    ? await syncGoogle(user.id, token)
    : await syncAutodesk(token)

  const failures = resources.filter((r) => r.error)

  // Every read failed - almost always an expired grant or revoked scope. Report it as
  // a failure so the UI never claims a sync that did not happen.
  if (failures.length === resources.length) {
    return json(
      {
        error: `${label(provider)} sync failed: ${failures[0].error}`,
        provider,
        resources,
      },
      { status: 502 },
    )
  }

  return json({
    ok:       true,
    provider,
    syncedAt: new Date().toISOString(),
    resources,
  })
}

function label(provider: string): string {
  return provider === 'google' ? 'Google Workspace' : 'Autodesk'
}

export const Route = createFileRoute('/api/integrations/sync')({
  server: {
    handlers: {
        POST: handlePOST,
    },
  },
})

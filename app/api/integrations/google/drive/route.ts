import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { getFreshGoogleToken } from '@/lib/integrations/token-refresh'
import {
  getDriveFile,
  listDriveFolderChildren,
  type DriveFileMeta,
} from '@/lib/integrations/google'
import {
  addDriveLinks,
  getDriveLinks,
  removeDriveLink,
  type LinkedDriveFolder,
} from '@/lib/integrations/drive-links'

export const dynamic = 'force-dynamic'

const FOLDER_MIME = 'application/vnd.google-apps.folder'

async function listVaultContents(
  token: string,
  userId: string,
  folderId: string | null,
  query: string
) {
  const { driveFileIds, driveFolders } = await getDriveLinks(userId)
  const byId = new Map<string, DriveFileMeta>()

  if (folderId) {
    const children = await listDriveFolderChildren(token, folderId, query || undefined)
    for (const child of children) byId.set(child.id, child)
  } else {
    for (const fileId of driveFileIds) {
      const file = await getDriveFile(token, fileId)
      if (file && file.mimeType !== FOLDER_MIME) byId.set(file.id, file)
    }

    for (const folder of driveFolders) {
      try {
        const children = await listDriveFolderChildren(token, folder.id, query || undefined)
        for (const child of children) byId.set(child.id, child)
      } catch (e) {
        console.error('Drive folder list failed:', folder.id, e)
      }
    }
  }

  let files = [...byId.values()]

  if (query && folderId) {
    const q = query.toLowerCase()
    files = files.filter((f) => f.name.toLowerCase().includes(q))
  }

  files.sort(
    (a, b) => {
      const aFolder = a.mimeType === FOLDER_MIME ? 0 : 1
      const bFolder = b.mimeType === FOLDER_MIME ? 0 : 1
      if (aFolder !== bFolder) return aFolder - bFolder
      return new Date(b.modifiedTime).getTime() - new Date(a.modifiedTime).getTime()
    }
  )

  return {
    files,
    roots: driveFolders,
    linked: { files: driveFileIds.length, folders: driveFolders.length },
  }
}

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const token = await getFreshGoogleToken(user.id)
  if (!token) {
    return NextResponse.json({ notConnected: true, files: [], roots: [], linked: { files: 0, folders: 0 } })
  }

  const query    = req.nextUrl.searchParams.get('q') ?? ''
  const folderId = req.nextUrl.searchParams.get('folderId')

  try {
    if (folderId) {
      const folder = await getDriveFile(token, folderId)
      const result = await listVaultContents(token, user.id, folderId, query)
      return NextResponse.json({
        ...result,
        currentFolder: folder ?? { id: folderId, name: 'Folder', mimeType: FOLDER_MIME },
      })
    }

    const result = await listVaultContents(token, user.id, null, query)
    return NextResponse.json(result)
  } catch (e) {
    console.error('Drive route error:', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const token = await getFreshGoogleToken(user.id)
  if (!token) return NextResponse.json({ error: 'Google not connected' }, { status: 400 })

  try {
    const body = await req.json() as {
      picks?: { id: string; mimeType?: string; name?: string }[]
    }

    const fileIds: string[] = []
    const folders: LinkedDriveFolder[] = []

    for (const pick of body.picks ?? []) {
      if (pick.mimeType === FOLDER_MIME) {
        folders.push({ id: pick.id, name: pick.name ?? 'Project folder' })
      } else {
        fileIds.push(pick.id)
      }
    }

    await addDriveLinks(user.id, { fileIds, folders })
    const listed = await listVaultContents(token, user.id, null, '')

    return NextResponse.json({ ok: true, ...listed })
  } catch (e) {
    console.error('Drive link save error:', e)
    return NextResponse.json({ error: 'Failed to save Drive links' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  try {
    await removeDriveLink(user.id, id)
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Drive unlink error:', e)
    return NextResponse.json({ error: 'Failed to remove link' }, { status: 500 })
  }
}

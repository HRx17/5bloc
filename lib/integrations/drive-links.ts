/**
 * Per-user Google Drive links for the drive.file scope.
 * Users grant access by linking project folders via Google Picker.
 */

import { getToken, saveToken } from './token-store'

export type LinkedDriveFolder = {
  id: string
  name: string
}

export type DriveLinkMetadata = {
  driveFileIds?: string[]
  /** @deprecated use driveFolders */
  driveFolderIds?: string[]
  driveFolders?: LinkedDriveFolder[]
}

function normalizeFolders(meta: DriveLinkMetadata): LinkedDriveFolder[] {
  if (meta.driveFolders?.length) return meta.driveFolders
  return (meta.driveFolderIds ?? []).map((id) => ({ id, name: 'Project folder' }))
}

export async function getDriveLinks(userId: string): Promise<{
  driveFileIds: string[]
  driveFolders: LinkedDriveFolder[]
}> {
  const rec = await getToken(userId, 'google')
  const meta = (rec?.metadata ?? {}) as DriveLinkMetadata
  return {
    driveFileIds: meta.driveFileIds ?? [],
    driveFolders: normalizeFolders(meta),
  }
}

export async function addDriveLinks(
  userId: string,
  links: {
    fileIds?: string[]
    folders?: LinkedDriveFolder[]
  }
): Promise<DriveLinkMetadata> {
  const rec = await getToken(userId, 'google')
  if (!rec) throw new Error('Google not connected')

  const current = (rec.metadata ?? {}) as DriveLinkMetadata
  const existingFolders = normalizeFolders(current)
  const folderMap = new Map(existingFolders.map((f) => [f.id, f]))

  for (const folder of links.folders ?? []) {
    folderMap.set(folder.id, folder)
  }

  const metadata: DriveLinkMetadata = {
    driveFileIds: [...new Set([...(current.driveFileIds ?? []), ...(links.fileIds ?? [])])],
    driveFolders: [...folderMap.values()],
    driveFolderIds: [...folderMap.keys()],
  }

  await saveToken(userId, { ...rec, metadata })
  return metadata
}

export async function removeDriveLink(userId: string, id: string): Promise<DriveLinkMetadata> {
  const rec = await getToken(userId, 'google')
  if (!rec) throw new Error('Google not connected')

  const current = (rec.metadata ?? {}) as DriveLinkMetadata
  const metadata: DriveLinkMetadata = {
    driveFileIds: (current.driveFileIds ?? []).filter((f) => f !== id),
    driveFolders: normalizeFolders(current).filter((f) => f.id !== id),
    driveFolderIds: (current.driveFolderIds ?? []).filter((f) => f !== id),
  }
  await saveToken(userId, { ...rec, metadata })
  return metadata
}

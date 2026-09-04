import { opfs } from './opfs'

export async function readLocalFile(
  projectId: string, cacheKey: string
): Promise<ArrayBuffer | null> {
  if (typeof window !== 'undefined' && window.electronAPI?.isElectron) {
    try {
      const home  = await window.electronAPI.getHomeDir()
      const fpath = `${home}/5Bloc/projects/${projectId}/${cacheKey}`
      const exists = await window.electronAPI.fileExists(fpath)
      if (!exists) return null
      const buf = await window.electronAPI.readFile(fpath)
      return buf.buffer as ArrayBuffer
    } catch (e) {
      console.error('Electron file manager read error:', e)
      return null
    }
  }
  return opfs.getFile(projectId, cacheKey)  // Browser: use OPFS
}

export async function writeLocalFile(
  projectId: string, cacheKey: string, buffer: ArrayBuffer
): Promise<void> {
  if (typeof window !== 'undefined' && window.electronAPI?.isElectron) {
    try {
      const home  = await window.electronAPI.getHomeDir()
      const fpath = `${home}/5Bloc/projects/${projectId}/${cacheKey}`
      await window.electronAPI.writeFile(fpath, Buffer.from(buffer))
      return
    } catch (e) {
      console.error('Electron file manager write error:', e)
    }
  }
  await opfs.saveFile(projectId, cacheKey, buffer)
}

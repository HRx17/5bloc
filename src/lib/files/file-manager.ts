import { opfs } from './opfs'

export async function readLocalFile(
  projectId: string, cacheKey: string
): Promise<ArrayBuffer | null> {
  if (typeof window !== 'undefined' && (window as any).electronAPI?.isElectron) {
    try {
      const home  = await (window as any).electronAPI.getHomeDir()
      const fpath = `${home}/5Bloc/projects/${projectId}/${cacheKey}`
      const exists = await (window as any).electronAPI.fileExists(fpath)
      if (!exists) return null
      const buf = await (window as any).electronAPI.readFile(fpath)
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
  if (typeof window !== 'undefined' && (window as any).electronAPI?.isElectron) {
    try {
      const home  = await (window as any).electronAPI.getHomeDir()
      const fpath = `${home}/5Bloc/projects/${projectId}/${cacheKey}`
      await (window as any).electronAPI.writeFile(fpath, Buffer.from(buffer))
      return
    } catch (e) {
      console.error('Electron file manager write error:', e)
    }
  }
  await opfs.saveFile(projectId, cacheKey, buffer)
}

import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  readFile:    (p: string) => ipcRenderer.invoke('fs:read', p),
  writeFile:   (p: string, d: Buffer) => ipcRenderer.invoke('fs:write', p, d),
  fileExists:  (p: string) => ipcRenderer.invoke('fs:exists', p),
  listDir:     (p: string) => ipcRenderer.invoke('fs:list', p),
  deleteFile:  (p: string) => ipcRenderer.invoke('fs:delete', p),
  statFile:    (p: string) => ipcRenderer.invoke('fs:stat', p),
  getHomeDir:  () => ipcRenderer.invoke('get-home'),
  getSyncStatus: () => ipcRenderer.invoke('get-sync'),
  notify:      (title: string, body: string) => ipcRenderer.invoke('notify', title, body),
  isElectron:  true,
  platform:    process.platform,
})

// TypeScript declaration for renderer
declare global {
  interface Window {
    electronAPI?: {
      readFile: (p: string) => Promise<Buffer>
      writeFile: (p: string, d: Buffer) => Promise<void>
      fileExists: (p: string) => Promise<boolean>
      listDir: (p: string) => Promise<any[]>
      deleteFile: (p: string) => Promise<void>
      statFile: (p: string) => Promise<any>
      getHomeDir: () => Promise<string>
      getSyncStatus: () => Promise<{ pending: number; syncing: boolean }>
      notify: (title: string, body: string) => Promise<void>
      isElectron: boolean
      platform: string
    }
  }
}
export {}

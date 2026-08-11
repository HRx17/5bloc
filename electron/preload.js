/**
 * 5Bloc Electron preload — exposes a safe IPC bridge to the renderer.
 * All APIs are explicitly allow-listed here (no raw ipcRenderer in renderer).
 */
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  // Filesystem
  readFile:     (p)    => ipcRenderer.invoke('fs:read', p),
  writeFile:    (p, d) => ipcRenderer.invoke('fs:write', p, d),
  fileExists:   (p)    => ipcRenderer.invoke('fs:exists', p),
  listDir:      (p)    => ipcRenderer.invoke('fs:list', p),
  deleteFile:   (p)    => ipcRenderer.invoke('fs:delete', p),
  statFile:     (p)    => ipcRenderer.invoke('fs:stat', p),
  getHomeDir:   ()     => ipcRenderer.invoke('get-home'),
  getVersion:   ()     => ipcRenderer.invoke('get-version'),

  // Notifications
  notify:       (title, body) => ipcRenderer.invoke('notify', title, body),

  // Environment flags (set synchronously, safe to read without await)
  isElectron:   true,
  platform:     process.platform,
})

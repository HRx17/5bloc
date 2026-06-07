import { app, BrowserWindow, ipcMain, Notification, Menu, Tray, nativeImage } from 'electron'
import path from 'path'
import { promises as fs } from 'fs'
import { SyncDaemon } from './sync-daemon'

let mainWindow: BrowserWindow | null = null
let syncDaemon: SyncDaemon | null = null

const isDev  = process.env.NODE_ENV === 'development'
const APP_URL = isDev ? 'http://localhost:3000'
              : `file://${path.join(__dirname, '../out/index.html')}`

function createWindow() {
  mainWindow = new BrowserWindow({
    width:          1440,
    height:          900,
    minWidth:       1024,
    minHeight:       700,
    titleBarStyle:   process.platform === 'darwin' ? 'hiddenInset' : 'default',
    backgroundColor: '#0C1220',
    show:            false,
    webPreferences: {
      preload:         path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox:         true,
    },
  })

  mainWindow.loadURL(APP_URL)
  mainWindow.once('ready-to-show', () => mainWindow!.show())
  mainWindow.on('closed', () => { mainWindow = null })
}

function createTray() {
  const icon = nativeImage.createFromPath(
    path.join(__dirname, '../public/icons/icon-32.png')
  )
  const tray = new Tray(icon)
  tray.setToolTip('5Bloc')
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Open 5Bloc', click: () => mainWindow?.show() },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() },
  ]))
}

app.whenReady().then(() => {
  createWindow()
  createTray()
  syncDaemon = new SyncDaemon()
  syncDaemon.start()
  app.on('activate', () => { if (!mainWindow) createWindow() })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// IPC: Filesystem bridge
ipcMain.handle('fs:read',   async (_, filePath: string) => fs.readFile(filePath))
ipcMain.handle('fs:write',  async (_, filePath: string, data: Buffer) => {
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, data)
})
ipcMain.handle('fs:exists', async (_, filePath: string) => {
  try { await fs.access(filePath); return true } catch { return false }
})
ipcMain.handle('fs:list',   async (_, dirPath: string) => {
  try {
    const list = await fs.readdir(dirPath, { withFileTypes: true })
    return list.map(item => ({ name: item.name, isDirectory: item.isDirectory() }))
  } catch { return [] }
})
ipcMain.handle('fs:delete', async (_, filePath: string) => fs.unlink(filePath))
ipcMain.handle('fs:stat',   async (_, filePath: string) => {
  const stat = await fs.stat(filePath)
  return { size: stat.size, mtime: stat.mtime }
})
ipcMain.handle('get-home',  async () => app.getPath('home'))
ipcMain.handle('get-sync',  async () => syncDaemon?.getStatus() ?? { pending: 0, syncing: false })
ipcMain.handle('notify',    async (_, title: string, body: string) => {
  new Notification({ title, body }).show()
})
export {}

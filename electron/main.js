/**
 * 5Bloc Electron main process (plain JS, no compile step required).
 * Dev:  loads http://localhost:3001 (Next.js dev server)
 * Prod: loads static export from out/index.html
 */
const { app, BrowserWindow, ipcMain, Notification, Menu, Tray, nativeImage, shell } = require('electron')
const path = require('path')
const fs   = require('fs').promises

let mainWindow = null

const isDev   = process.env.NODE_ENV === 'development' || !app.isPackaged
const APP_URL = isDev
  ? 'http://localhost:3001'
  : `file://${path.join(__dirname, '../out/index.html')}`

function createWindow() {
  mainWindow = new BrowserWindow({
    width:           1440,
    height:           900,
    minWidth:        1024,
    minHeight:        700,
    titleBarStyle:   process.platform === 'darwin' ? 'hiddenInset' : 'default',
    backgroundColor: '#08090e',
    show:            false,
    icon:            path.join(__dirname, '../public/icons/icon-256.png'),
    webPreferences: {
      preload:          path.join(__dirname, 'preload.js'),
      nodeIntegration:  false,
      contextIsolation: true,
      sandbox:          true,
      webSecurity:      !isDev,
    },
  })

  mainWindow.loadURL(APP_URL)

  // Show once ready (avoids white flash)
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    if (isDev) mainWindow.webContents.openDevTools({ mode: 'detach' })
  })

  // Open external links in the OS browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) shell.openExternal(url)
    return { action: 'deny' }
  })

  mainWindow.on('closed', () => { mainWindow = null })
}

function createTray() {
  const iconPath = path.join(__dirname, '../public/icons/icon-32.png')
  try {
    const icon = nativeImage.createFromPath(iconPath)
    if (icon.isEmpty()) return // skip if icon not found in dev
    const tray = new Tray(icon)
    tray.setToolTip('5Bloc')
    tray.setContextMenu(Menu.buildFromTemplate([
      { label: 'Open 5Bloc', click: () => mainWindow ? mainWindow.show() : createWindow() },
      { type: 'separator' },
      { label: 'Quit',       click: () => app.quit() },
    ]))
    tray.on('double-click', () => mainWindow?.show())
  } catch (_) { /* tray is optional */ }
}

function buildMenu() {
  const template = [
    ...(process.platform === 'darwin' ? [{ role: 'appMenu' }] : []),
    {
      label: 'File',
      submenu: [
        { label: 'New Project', accelerator: 'CmdOrCtrl+N', click: () => mainWindow?.webContents.executeJavaScript("window.location.href='/projects/new'") },
        { type: 'separator' },
        process.platform === 'darwin' ? { role: 'close' } : { role: 'quit' },
      ],
    },
    { role: 'editMenu' },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        ...(isDev ? [{ role: 'toggleDevTools' }] : []),
      ],
    },
    { role: 'windowMenu' },
    {
      label: 'Help',
      submenu: [
        { label: 'Documentation', click: () => shell.openExternal('https://5bloc.com/docs') },
        { label: 'Report a bug',  click: () => shell.openExternal('mailto:support@5bloc.com') },
        { type: 'separator' },
        { label: `Version ${app.getVersion()}`, enabled: false },
      ],
    },
  ]
  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

app.whenReady().then(() => {
  buildMenu()
  createWindow()
  createTray()
  app.on('activate', () => { if (!mainWindow) createWindow() })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

/* ── IPC: filesystem bridge (used by sync daemon + offline mode) ── */
ipcMain.handle('fs:read',   async (_, filePath) => fs.readFile(filePath))
ipcMain.handle('fs:write',  async (_, filePath, data) => {
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, data)
})
ipcMain.handle('fs:exists', async (_, filePath) => {
  try { await fs.access(filePath); return true } catch { return false }
})
ipcMain.handle('fs:list', async (_, dirPath) => {
  try {
    const list = await fs.readdir(dirPath, { withFileTypes: true })
    return list.map(item => ({ name: item.name, isDirectory: item.isDirectory() }))
  } catch { return [] }
})
ipcMain.handle('fs:delete', async (_, filePath) => fs.unlink(filePath))
ipcMain.handle('fs:stat',   async (_, filePath) => {
  const stat = await fs.stat(filePath)
  return { size: stat.size, mtime: stat.mtime.toISOString() }
})
ipcMain.handle('get-home',  async () => app.getPath('home'))
ipcMain.handle('get-version', async () => app.getVersion())
ipcMain.handle('notify',    async (_, title, body) => {
  if (Notification.isSupported()) new Notification({ title, body }).show()
})

import { app, BrowserWindow, ipcMain, shell, dialog } from 'electron'
import { join } from 'path'
import { startDownload, fetchVideoInfo, cancelDownload } from './downloader'
import { checkLicense } from './store-license'

let mainWindow = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 960,
    height: 680,
    minWidth: 800,
    minHeight: 600,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    },
    icon: join(__dirname, '../../assets/icon.ico'),
    show: false
  })

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(join(__dirname, '../../dist-renderer/index.html'))
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// ──── IPC HANDLERS ────────────────────────────────────────────

// Window controls
ipcMain.on('window:minimize', () => mainWindow?.minimize())
ipcMain.on('window:maximize', () => {
  if (mainWindow?.isMaximized()) mainWindow.unmaximize()
  else mainWindow?.maximize()
})
ipcMain.on('window:close', () => mainWindow?.close())

// Fetch video info (title, thumbnail, resolutions)
ipcMain.handle('video:info', async (_, url) => {
  try {
    return await fetchVideoInfo(url)
  } catch (err) {
    return { error: err.message }
  }
})

// Start download
ipcMain.handle('video:download', async (event, { url, format, quality, title, downloadsFolder }) => {
  try {
    const license = await checkLicense()
    const isPro = license.isPro

    // Gate: 1080p and 4K require Pro
    const proOnlyQualities = ['1080p', '1080p60', '4K', '2160p']
    if (proOnlyQualities.includes(quality) && !isPro) {
      return { error: 'PRO_REQUIRED', quality }
    }

    const safeTitle = (title || 'video').replace(/[<>:"/\\|?*]/g, '')
    const ext = format === 'mp3' ? 'mp3' : 'mp4'
    let filePath

    if (downloadsFolder) {
      filePath = join(downloadsFolder, `${safeTitle}.${ext}`)
    } else {
      // Show native save dialog
      const { filePath: chosenPath, canceled } = await dialog.showSaveDialog(mainWindow, {
        title: 'Save Video As',
        defaultPath: join(app.getPath('downloads'), `${safeTitle}.${ext}`),
        filters: [
          { name: format === 'mp3' ? 'Audio Files' : 'Video/Audio Files', extensions: [ext] }
        ]
      })

      if (canceled || !chosenPath) {
        return { error: 'DOWNLOAD_CANCELLED' }
      }
      filePath = chosenPath
    }

    // Start download with progress events
    await startDownload({ url, format, quality, savePath: filePath }, (progress) => {
      event.sender.send('download:progress', progress)
    })
    return { success: true }
  } catch (err) {
    return { error: err.message }
  }
})

// Select folder dialog
ipcMain.handle('dialog:selectFolder', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Select Download Folder',
    defaultPath: app.getPath('downloads')
  })
  if (canceled) return null
  return filePaths[0]
})

// Cancel download
ipcMain.on('video:cancel', () => {
  cancelDownload()
})

// Check license / subscription
ipcMain.handle('license:check', async () => {
  return await checkLicense()
})

// Open folder in Explorer
ipcMain.on('shell:openFolder', (_, folderPath) => {
  shell.openPath(folderPath)
})

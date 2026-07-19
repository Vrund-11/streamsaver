import { contextBridge, ipcRenderer } from 'electron'

/**
 * Secure bridge between Electron main process and React renderer.
 * Only explicitly listed APIs are exposed — nothing else from Node/Electron leaks through.
 */
contextBridge.exposeInMainWorld('electronAPI', {

  // Window controls (for custom titlebar)
  minimize: ()  => ipcRenderer.send('window:minimize'),
  maximize: ()  => ipcRenderer.send('window:maximize'),
  close:    ()  => ipcRenderer.send('window:close'),

  // Fetch video info from URL
  fetchVideoInfo: (url) => ipcRenderer.invoke('video:info', url),

  // Start a download
  startDownload: (options) => ipcRenderer.invoke('video:download', options),

  // Cancel in-progress download
  cancelDownload: () => ipcRenderer.send('video:cancel'),

  // Listen for download progress events
  onDownloadProgress: (callback) => {
    const handler = (_, progress) => callback(progress)
    ipcRenderer.on('download:progress', handler)
    // Return cleanup function
    return () => ipcRenderer.removeListener('download:progress', handler)
  },

  // Check license / subscription status
  checkLicense: () => ipcRenderer.invoke('license:check'),

  // Open Downloads folder in Windows Explorer
  openDownloadsFolder: (path) => ipcRenderer.send('shell:openFolder', path),

  // Select folder dialog
  selectFolder: () => ipcRenderer.invoke('dialog:selectFolder')
})

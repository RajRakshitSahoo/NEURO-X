// electron/preload.js
// Exposes safe node APIs to the renderer via contextBridge

const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  // Version info
  getVersion: () => process.versions.electron,
  getPlatform: () => process.platform,

  // IPC channels (send from renderer → main)
  sendCommand: (cmd) => ipcRenderer.send('command', cmd),

  // Receive events from main
  onUpdate: (callback) => ipcRenderer.on('update', (_, data) => callback(data)),

  // Remove listeners on unmount
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
})

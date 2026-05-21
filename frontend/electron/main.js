// electron/main.js
// Electron main process — creates the desktop window for NEURO-X

const { app, BrowserWindow, Menu, globalShortcut, ipcMain } = require('electron')
const path = require('path')

// Suppress certificate errors in dev (remove for production)
app.commandLine.appendSwitch('ignore-certificate-errors')

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    title: 'NEURO-X — AI Cyber Intelligence',
    backgroundColor: '#000a00',
    // Dark title bar
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true,
    },
    // Frameless option — comment out if you want native title bar
    // frame: false,
    show: false, // Show after ready
  })

  // Load the Vite dev server or production build
  const isDev = process.env.NODE_ENV !== 'production'
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    // Open DevTools in dev mode
    // mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  // Graceful show
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    mainWindow.focus()
  })

  mainWindow.on('closed', () => { mainWindow = null })
}

// ── App menu (minimal)
function buildMenu() {
  const template = [
    {
      label: 'NEURO-X',
      submenu: [
        { label: 'About NEURO-X', role: 'about' },
        { type: 'separator' },
        { label: 'Quit', accelerator: 'CmdOrCtrl+Q', role: 'quit' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { label: 'Reload', accelerator: 'CmdOrCtrl+R', role: 'reload' },
        { label: 'Toggle DevTools', accelerator: 'F12', role: 'toggleDevTools' },
        { type: 'separator' },
        { label: 'Zoom In',  role: 'zoomIn' },
        { label: 'Zoom Out', role: 'zoomOut' },
        { label: 'Reset Zoom', role: 'resetZoom' },
        { type: 'separator' },
        { label: 'Toggle Fullscreen', role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Window',
      submenu: [
        { label: 'Minimize', role: 'minimize' },
        { label: 'Close', role: 'close' },
      ],
    },
  ]
  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

app.whenReady().then(() => {
  buildMenu()
  createWindow()

  // Global shortcut: Ctrl+Shift+X to show/hide
  globalShortcut.register('CommandOrControl+Shift+X', () => {
    if (mainWindow) {
      mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (!mainWindow) createWindow()
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

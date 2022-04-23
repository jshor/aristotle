import { app, protocol, nativeImage, BrowserWindow } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import path from 'path'
const remote = require('@electron/remote/main')
// import remote from '@electron/remote/main'

remote.initialize()

const isDevelopment = process.env.NODE_ENV !== 'production'

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } }
])

async function createWindow() {
  const p = path.join(__dirname, '../public/icon32x32.png')
  const image = nativeImage.createFromPath(p)

  image.setTemplateImage(true)

  // Create the browser window.
  const win = new BrowserWindow({
    width: 2000,
    height: 1200,
    webPreferences: {
      nativeWindowOpen: true,
      nodeIntegration: true,
      contextIsolation: false
    },
    show: false, // don't show the window until we tell it to
    icon: image
  })

  remote.enable(win.webContents)

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)

    setTimeout(() => {
      win.webContents.openDevTools()
    }, 500)
  } else {
    createProtocol('app')
    // Load the index.html when not in development
    win.loadURL('app://./index.html')
  }

  return win
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  const win = await createWindow()

  // show a splash screen while waiting for the window to load
  app.whenReady().then(async () => {
    const timer = new Promise(resolve => setTimeout(resolve, 1000))

    // create a new `splash`-Window
    const splash = new BrowserWindow({
      width: 810, height: 610, frame: false, show: false, alwaysOnTop: true, transparent: true,
      visualEffectState: "followWindow"
    })
    splash.loadFile(`../src/splash.html`) // TODO

    splash.webContents.on('did-finish-load', () => splash.show())

    await timer

    splash.destroy()
    win.maximize()
    win.setAlwaysOnTop(true)
    win.show();
    win.setAlwaysOnTop(false)
    win.focus()

    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  })
})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', (data) => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}

import { app, protocol, BrowserWindow, ipcMain, Event, App, BrowserWindowConstructorOptions } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import * as remote from '@electron/remote/main'
import path from 'path'

remote.initialize()

const isDevelopment = process.env.NODE_ENV !== 'production'

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([{
  scheme: 'app',
  privileges: {
    secure: true,
    standard: true
  }
}])

/**
 * Creates a new Electron window that loads the given file name.
 */
function createWindow (opts: BrowserWindowConstructorOptions, fileName: string, showDevTools: boolean = false) {
  const win = new BrowserWindow({
    show: false, // don't show the window until we tell it to
    ...opts
  })

  remote.enable(win.webContents)

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    win.loadURL(`${process.env.WEBPACK_DEV_SERVER_URL}${fileName}.html`)

    if (showDevTools) {
      win.webContents.openDevTools()
    }
  } else {
    createProtocol('aristotle')

    win.loadURL(`aristotle://./${fileName}.html`)
  }

  return win
}

/**
 * Creates the main app window.
 */
function createMainWindow () {
  return createWindow({
    width: 2000,
    height: 1200,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nativeWindowOpen: true
    },
  }, 'index', true)
}

/**
 * Loads the main window, using a splash screen as an interstitial until it's ready.
 */
async function boot (app: App, mainWindow: BrowserWindow) {
  // flag of whether or not renderer is ready to exit
  let canClose = false

  // create the splash screen
  const splashScreen = createWindow({
    width: 645,
    height: 345,
    frame: false,
    alwaysOnTop: true,
    transparent: true,
    show: true,
    visualEffectState: 'followWindow'
  }, 'splash')

  splashScreen
    .webContents
    .on('did-finish-load', () => {
      // start a timer so that the splash screen appears for at least 1.5 seconds
      const timer = new Promise(resolve => setTimeout(resolve, 1500))

      splashScreen.show()

      mainWindow
        .webContents
        .on('did-finish-load', async () => {
          // once the main window has finished loading, run out the remaining time on the timer
          await timer

          // then destroy the splash screen and show the main window
          splashScreen.destroy()

          mainWindow.show()
          mainWindow.focus()
          mainWindow.on('close', ($event: Event) => {
            // when the main window is about to close, inform the renderer
            // this gives it time to prompt the user to save any unsaved files before exiting
            if (!canClose) {
              mainWindow.webContents.send('about-to-close')
              $event.preventDefault()
            }
          })
        })
    })

  ipcMain.on('quit', () => {
    // the renderer has asked to exit
    canClose = true
    mainWindow.close()
    app.quit()
  })
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('ready', async () => {
  const mainWindow = createMainWindow()

  app.whenReady().then(async () => {
    await boot(app, mainWindow)

    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (BrowserWindow.getAllWindows().length === 0) {
        boot(app, createMainWindow())
      }
    })
  })
})

if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', (data: string) => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => app.quit())
  }
}

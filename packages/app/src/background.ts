import { app, protocol, BrowserWindow, ipcMain, Event, App, BrowserWindowConstructorOptions, dialog } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import * as remote from '@electron/remote/main'
import path from 'path'
import fs from 'fs'

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
    win.loadURL(`app://./${fileName}.html`)
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
      nativeWindowOpen: true,
      backgroundThrottling: false
    }
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
    visualEffectState: 'followWindow',
    webPreferences: {
      backgroundThrottling: false
    }
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

          mainWindow.show()

          // destroy the splash screen AFTER showing the main window
          // https://github.com/electron/electron/issues/27353#issuecomment-834734077
          splashScreen.destroy()

          mainWindow.on('close', ($event: Event) => {
            // when the main window is about to close, inform the renderer
            // this gives it time to prompt the user to save any unsaved files before exiting
            if (!canClose) {
              mainWindow.webContents.send('about-to-close')
              $event.preventDefault()
            }
          })

          const filePath = process.argv.slice(-1)[0]

          if (process.argv.length > 1 && fs.existsSync(filePath) && !!path.extname(filePath)) {
            mainWindow
              .webContents
              .send('open-file', filePath)
          }
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

const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  let mainWindow: BrowserWindow

  app.on('second-instance', (e, argv) => {
    // Someone tried to run a second instance, we should focus our window.
    if (mainWindow) {
      mainWindow
        .webContents
        .send('open-file', argv.slice(-1)[0])

      if (mainWindow.isMinimized()) {
        mainWindow.restore()
      }
      mainWindow.focus()
    }
  })

  app.on('ready', async () => {
    createProtocol('app')

    mainWindow = await createMainWindow()

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
}

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

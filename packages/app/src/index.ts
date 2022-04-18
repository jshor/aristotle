const { app, BrowserWindow } = require('electron');
const path = require("path");
const remote = require('@electron/remote/main')

remote.initialize()

function createWindow() {
  const win = new BrowserWindow({
    width: 2000,
    height: 1200,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true
    },
    show: false // don't show the main window
  });

  remote.enable(win.webContents)

  win.loadURL("http://localhost:3100/alpha/index.html");
  win.webContents.openDevTools()

  return win
}


app.whenReady().then(() => {
  const win = createWindow();

  app.whenReady().then((choice) => {
    // create a new `splash`-Window
    const splash = new BrowserWindow({
      width: 810, height: 610, frame: false, show: false, alwaysOnTop: true, transparent: true,
      backgroundColor: "#00000000", // transparent hexadecimal or anything with transparency,
      vibrancy: "under-window", // in my case...
      visualEffectState: "followWindow",
    });
    splash.loadFile(`./splash.html`);

    splash.webContents.on('did-finish-load', function() {
      splash.show();
    });

    // if main window is ready to show, then destroy the splash window and show up the main window
    win.once('ready-to-show', () => {
      setTimeout(() => {
        splash.destroy();
        win.show();
      }, 1500)
    });
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

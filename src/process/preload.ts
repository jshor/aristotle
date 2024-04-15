import { contextBridge, ipcRenderer, MenuItemConstructorOptions, FileFilter, clipboard, MessageBoxSyncOptions, shell } from 'electron'
import { Menu, dialog, app, screen, getCurrentWindow } from '@electron/remote'
import path from 'path'
import fs from 'fs'
import os from 'os'

const defaultPath = path.resolve(app.getPath('desktop'))
const cursorPosition = { x: 0, y: 0 }

window.addEventListener('contextmenu', (e) => {
  cursorPosition.x = e.x
  cursorPosition.y = e.y
}, false)

function addInspectElementItem (menuItems: MenuItemConstructorOptions[]) {
  return menuItems.concat({
    label: 'Inspect Element',
    click: () => {
      getCurrentWindow()
        .webContents
        .inspectElement(cursorPosition.x, cursorPosition.y)
    }
  })
}

export const api: typeof window.api = {
  showContextMenu (menuItems: MenuItemConstructorOptions[]) {
    Menu
      .buildFromTemplate(addInspectElementItem(menuItems))
      .popup()
  },
  setApplicationMenu (menuItems: MenuItemConstructorOptions[]) {
    if (menuItems.length) {
      Menu.setApplicationMenu(Menu.buildFromTemplate(menuItems))
    }
  },
  showOpenFileDialog (filters: FileFilter[]): string[] {
    return dialog.showOpenDialogSync({ defaultPath, filters }) || []
  },
  showSaveFileDialog (filters: FileFilter[], fileName: string) {
    return dialog.showSaveDialogSync({
      defaultPath: path.join(defaultPath, fileName),
      filters
    }) || ''
  },

  getFilePaths (directoryPath: string, filter: string) {
    return fs
      .readdirSync(directoryPath)
      .filter(fileName => fileName.includes(filter))
      .map(fileName => path.resolve(path.join(directoryPath, fileName)))
  },

  showMessageBox ({ message, type = 'warning', buttons = ['OK'], title = 'Aristotle' }: MessageBoxSyncOptions) {
    return dialog.showMessageBoxSync(getCurrentWindow(), {
      type,
      buttons,
      title,
      message
    })
  },
  onBeforeClose (beforeCloseCallback: () => Promise<boolean>) {
    function attachBeforeCloseEvent () {
      ipcRenderer.once('about-to-close', async () => {
        const canClose = await beforeCloseCallback()

        if (canClose !== false) {
          ipcRenderer.send('quit')
        } else {
          setTimeout(() => {
            attachBeforeCloseEvent()
          })
        }
      })
    }

    attachBeforeCloseEvent()
  },
  onOpenFile (fn: (filePath: string) => void) {
    ipcRenderer.on('open-file', (e, filePath) => {
      fn(filePath as any)
    })
  },
  quit () {
    ipcRenderer.send('quit')
  },
  openFile (filePath: string) {
    return fs
      .readFileSync(filePath)
      .toString()
  },
  saveFile (filePath: string, data: ArrayBuffer) {
    const buf = Buffer.from(data)

    fs.writeFileSync(filePath, buf)
  },
  setClipboardContents (data: string) {
    const buffer = Buffer.from(data, 'utf8')

    clipboard.writeBuffer('public/aristotle', buffer)
  },
  getClipboardContents () {
    return clipboard
      .readBuffer('public/aristotle')
      .toString()
  },
  clearClipboard () {
    return clipboard.clear()
  },
  canPaste () {
    return clipboard.has('public/aristotle')
  },
  setFullscreen (isFullscreen: boolean) {
    getCurrentWindow().setFullScreen(isFullscreen)
  },
  getDefaultSavePath () {
    return os.homedir()
  },
  beep () {
    shell.beep()
  }
}

contextBridge.exposeInMainWorld('api', api)

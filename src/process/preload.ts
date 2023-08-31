import { contextBridge, ipcRenderer, MenuItemConstructorOptions, FileFilter, clipboard, MessageBoxSyncOptions } from 'electron'
import { Menu, dialog, app, screen, getCurrentWindow } from '@electron/remote'
import path from 'path'
import fs from 'fs'
import os from 'os'

const defaultPath = path.resolve(app.getPath('desktop'))

export const api = {
  showContextMenu (menuItems: MenuItemConstructorOptions[]) {
    const point = screen.getCursorScreenPoint()

    // TODO: put this in a wrapper for dev mode only (not production)
    menuItems.push({
      label: 'Inspect Element',
      click: () => {
        getCurrentWindow()
          .webContents
          .inspectElement(point.x, point.y)
      }
    })

    Menu
      .buildFromTemplate(menuItems)
      .popup()
  },
  setApplicationMenu (menuItems: MenuItemConstructorOptions[]) {
    Menu.setApplicationMenu(Menu.buildFromTemplate(menuItems))
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
  onBeforeClose (fn: () => Promise<boolean>) {
    ipcRenderer.on('about-to-close', async () => {
      const canClose = await fn()

      if (canClose) {
        ipcRenderer.send('quit')
      }
    })
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
      // .toString()
  },
  saveFile (filePath: string, data: ArrayBuffer) {
    const buf = Buffer.from(data)

    fs.writeFileSync(filePath, buf)
  },
  copy (data: string) {
    const buffer = Buffer.from(data, 'utf8')

    clipboard.writeBuffer('public/utf8-plain-text', buffer)
  },
  paste () {
    return clipboard
      .readBuffer('public/utf8-plain-text')
      .toString()
  },
  setFullscreen (isFullscreen: boolean) {
    getCurrentWindow().setFullScreen(isFullscreen)
  },
  getDefaultSavePath () {
    return os.homedir()
  }
}

contextBridge.exposeInMainWorld('api', api)

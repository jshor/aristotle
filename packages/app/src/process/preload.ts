import { contextBridge, ipcRenderer, MenuItemConstructorOptions, FileFilter, clipboard } from 'electron'
import { Menu, dialog, app, getCurrentWindow } from '@electron/remote'
import path from 'path'
import fs from 'fs'

const defaultPath = path.resolve(app.getPath('desktop'))

export const api = {
  showContextMenu (menuItems: MenuItemConstructorOptions[]) {
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
  showMessageBox ({ message, type = 'warning', buttons = ['OK'], title = 'Aristotle' }: {
    message: string
    type?: string
    title?: string
    buttons?: string[]
  }) {
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
      .toString()
  },
  saveFile (filePath: string, data: Buffer) {
    fs.writeFileSync(filePath, data)
  },
  copy (data: string) {
    const buffer = Buffer.from(data, 'utf8')

    clipboard.writeBuffer('public/utf8-plain-text', buffer)
  },
  paste () {
    return clipboard
      .readBuffer('public/utf8-plain-text')
      .toString()
  }
}

contextBridge.exposeInMainWorld('api', api)

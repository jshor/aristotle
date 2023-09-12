import { FileFilter, MenuItemConstructorOptions, MessageBoxSyncOptions } from 'electron'

interface WindowApi {
  showContextMenu: (menuItems: MenuItemConstructorOptions[]) => void
  setApplicationMenu: (menuItems: MenuItemConstructorOptions[]) => void
  showOpenFileDialog: (filters: FileFilter[]) => string[]
  showSaveFileDialog: (filters: FileFilter[], fileName: string) => string
  showMessageBox: ({ message, type, buttons, title }: MessageBoxSyncOptions) => number
  beep: () => void
  quit: () => void
  onBeforeClose: (fn: () => Promise<boolean>) => void
  onOpenFile: (fn: (filePath: string) => void) => void
  openFile: (filePath: string) => string
  saveFile: (filePath: string, data: ArrayBuffer) => void
  getFilePaths: (directoryPath: string, filter: string) => string[]
  setFullscreen: (isFullscreen: boolean) => void
  getDefaultSavePath: () => string
  setClipboardContents: (data: string) => void
  getClipboardContents: () => string
  clearClipboard: () => void
  canPaste: () => boolean
}

export default WindowApi

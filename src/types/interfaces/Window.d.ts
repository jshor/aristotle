import { FileFilter, MenuItemConstructorOptions } from 'electron'

declare global {
  interface Window {
    api: {
      showContextMenu: (menuItems: MenuItemConstructorOptions[]) => void
      setApplicationMenu: (menuItems: MenuItemConstructorOptions[]) => void
      showOpenFileDialog: (filters: FileFilter[]) => string[]
      showSaveFileDialog: (filters: FileFilter[], fileName: string) => string
      showMessageBox: ({ message, type, buttons, title }: MessageBoxSyncOptions) => number
      beep: () => void
      quit: () => void
      onBeforeClose (fn: () => Promise<boolean>)
      onOpenFile (fn: (filePath: string) => void)
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
  }
}

export default Window

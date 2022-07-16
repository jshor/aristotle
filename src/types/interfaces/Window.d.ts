import { FileFilter, MenuItemConstructorOptions } from 'electron'

declare global {
  interface Window {
    api: {
      showContextMenu: (menuItems: MenuItemConstructorOptions[]) => void
      setApplicationMenu: (menuItems: MenuItemConstructorOptions[]) => void
      showOpenFileDialog: (filters: FileFilter[]) => string[]
      showSaveFileDialog: (filters: FileFilter[], fileName: string) => string
      showMessageBox: ({ message, type, buttons, title }: {
        message: string
        type?: 'none' | 'info' | 'error' | 'question' | 'warning'
        title?: string
        buttons?: string[]
      }) => number
      beep: () => void
      quit: () => void
      copy: (data: string) => void
      paste: () => string
      onBeforeClose (fn: () => Promise<boolean>)
      onOpenFile (fn: (filePath: string) => void)
      openFile: (filePath: string) => string
      saveFile: (filePath: string, data: Buffer) => void
      getFilePaths: (directoryPath: string, filter: string) => string[]
      setFullscreen: (isFullscreen: boolean) => void
    }
  }
}

export default Window

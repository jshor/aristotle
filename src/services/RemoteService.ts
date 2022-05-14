import path from 'path'
import { TinyEmitter } from 'tiny-emitter'
import createApplicationMenu from '@/menus'
import { Store } from 'pinia'
import { RootStore } from '@/store/root'
// import { Menu, dialog, app, shell, getCurrentWindow, BrowserWindow } from '@electron/remote'



// window.api.receive("fromMain", (data) => {
//   console.log(`Received ${data} from main process`);
// });
// window.api.send("toMain", "some data");


/**
 * This service provides all interactions to Electron remote elements (menus, dialogs, exiting, etc.).
 * Any interaction with Electron should be done in this service.
 * If the context of the app is not in Electron, firing these methods does nothing.
 */
class RemoteService {
  /** Flag to determine if the window can be closed. */
  static canCloseWindow = false

  /** Event emitter. */
  static emitter = new TinyEmitter()

  static clipboard: string | null = null

  static menuCallbacks: Record<string, () => void> = {}

  static copy (data: string) {
    if (!window.require) return

    this.clipboard = data
  }

  static paste () {
    if (!window.require) return

    return this.clipboard
  }

  /**
   * Sets the main application menu, building the app menu from the data in the given store.
   * This method should be called as the result of a watchEffect() on the root store.
   *
   * @param store - root store module
   */
  static setApplicationMenu (store: Store<string, RootStore, any>) {
    // if (!window.require) return

    // const menu = Menu.buildFromTemplate(createApplicationMenu(store))

    // Menu.setApplicationMenu(menu)
  }

  /**
   * Shows a context menu to the user with the menu entries provided.
   *
   * @param entries - menu entries to show to the user
   */
  static showContextMenu (entries: MenuEntry[]) {
    // if (!window.require) return

    // const menu = Menu.buildFromTemplate(entries)

    // menu.popup()

  }

  static beep () {
    // shell.beep()
  }

  /**
   * Opens a modal window with the given path.
   *
   * @param url - the vue-router path to open
   */
  static async openModal (url: string = 'https://aristotle.dev') {
    // const parent = getCurrentWindow()
    // const win = new BrowserWindow({
    //   autoHideMenuBar: true,
    //   minimizable: false,
    //   maximizable: false,
    //   modal: true,
    //   show: false,
    //   parent
    // })

    // win.loadURL(url)
    // win.webContents.on('did-finish-load', () => win.show())
    // win.setMenu(null)
  }

  static showOpenFileDialog (filters: FileFilter[]) {
    // const defaultPath = path.resolve(app.getPath('desktop'))

    // return dialog.showOpenDialogSync({ defaultPath, filters }) || []
    return [] as string[]
  }

  static showSaveFileDialog (filters: FileFilter[], fileName: string) {
    // const defaultPath = path.resolve(app.getPath('desktop'), fileName)

    // return dialog.showSaveDialogSync({ defaultPath, filters })
    return ''
  }

  /**
   * Shows a message box to the user.
   *
   * @see {@link https://www.electronjs.org/docs/latest/api/dialog/} for info on available types.
   *
   * @param params
   * @param params.message - message content to display in the box
   * @param [params.type = 'warning'] - Electron system warning type
   * @param [params.buttons = ['OK']] - message box buttons with user friendly text
   * @param [params.title = 'Aristotle'] - message box title
   * @returns the index number of the button selected by the user
   */
  static showMessageBox ({ message, type = 'warning', buttons = ['OK'], title = 'Aristotle' }: {
    message: string
    type?: string
    title?: string
    buttons?: string[]
  }) {
    return 0
    // return dialog.showMessageBoxSync(getCurrentWindow(), {
    //     type,
    //     buttons,
    //     title,
    //     message
    //   })
  }

  // TODO: need to do garbage collection (need 'off' events for this, ClockService, OscillationService, etc.)
  /**
   * Assigns an event listener.
   *
   * @param event - valid values are: `close`
   * @param fn - callback function
   */
  static on (event: string, fn: () => void) {
    this.emitter.on(event, fn)
  }

  /**
   * The event handler for prior to a window close.
   * If the remote service is not available, this will always return true.
   */
  static onBeforeUnload () {
    return !window.require || this.canCloseWindow
  }

  /**
   * Assigns the pre-quit event handler, which emits `close` when the application is about to quit.
   * This will prevent the app from quitting unless quit() is explicitly invoked.
   *
   * @emits close when the app has tried to quit but is not ready to
   */
  static assignQuitter () {
    // getCurrentWindow().on('close', (e) => {
    //   console.log('E: ', e)

    //   if (!this.canCloseWindow) {
    //     this.emitter.emit('close')
    //   } else {
    //     app.quit()
    //   }
    // })
  }

  /**
   * Quits the application.
   */
  static quit () {
    // this.canCloseWindow = true
    // window.close()
  }
}

window.onbeforeunload = RemoteService.onBeforeUnload

export default RemoteService

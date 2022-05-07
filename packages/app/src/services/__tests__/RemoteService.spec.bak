import { setActivePinia, createPinia } from 'pinia'
import RemoteService from '../RemoteService'
import { useRootStore } from '@/store/root'

setActivePinia(createPinia())

describe('Remote Service', () => {
  beforeEach(() => {
    window.require = jest.fn() as any
  })

  afterEach(() => jest.resetAllMocks())

  describe('setApplicationMenu()', () => {
    const Menu = {
      buildFromTemplate: jest.fn(),
      setApplicationMenu: jest.fn()
    }
    const store = useRootStore()

    it('should not create any menus when the Electron remote module is not available', () => {
      window.require = null as any

      RemoteService.setApplicationMenu(store)

      expect(Menu.setApplicationMenu).not.toHaveBeenCalled()
    })

    describe('when the Electron remote module is available', () => {
      it('should set the application menu to the one created', () => {
        jest
          .spyOn(window, 'require')
          .mockImplementation(() => ({ Menu }))

        jest
          .spyOn(Menu, 'buildFromTemplate')
          .mockReturnValue(Menu)

        RemoteService.setApplicationMenu(store)

        expect(Menu.setApplicationMenu).toHaveBeenCalledTimes(1)
        expect(Menu.setApplicationMenu).toHaveBeenCalledWith(Menu)
      })
    })
  })

  describe('showContextMenu()', () => {
    const Menu = {
      buildFromTemplate: jest.fn(),
      popup: jest.fn()
    }
    const entries: MenuEntry[] = [
      { label: 'A menu item' },
      { label: 'A second menu item' }
    ]

    it('should not create any menus when the Electron remote module is not available', () => {
      window.require = null as any

      RemoteService.showContextMenu(entries)

      expect(Menu.popup).not.toHaveBeenCalled()
    })

    describe('when the Electron remote module is available', () => {
      it('should set the application menu to the one created', () => {
        jest
          .spyOn(window, 'require')
          .mockImplementation(() => ({ Menu }))

        jest
          .spyOn(Menu, 'buildFromTemplate')
          .mockReturnValue(Menu)

        RemoteService.showContextMenu(entries)

        expect(Menu.buildFromTemplate).toHaveBeenCalledWith(entries)
        expect(Menu.popup).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('openModal()', () => {
    let callback: Function

    const url = 'index.html/path'
    const loadURL = jest.fn()
    const setMenu = jest.fn()
    const show = jest.fn()

    class BrowserWindow {
      webContents = ({
        on: (e: string, fn: Function) => fn()
      })
      loadURL = loadURL
      setMenu = setMenu
      show = show
    }

    const currentWindow = jest.fn()
    const remote = {
      getCurrentWindow: () => currentWindow,
      BrowserWindow
    }

    it('should not create any menus when the Electron remote module is not available', () => {
      window.require = null as any

      RemoteService.openModal()

      expect(loadURL).not.toHaveBeenCalled()
    })


    describe('when the Electron remote module is available', () => {
      beforeEach(() => {
        jest
          .spyOn(window, 'require')
          .mockImplementation(() => remote)

        RemoteService.openModal(url)
      })

      it('should load the given URL', () => {
        expect(loadURL).toHaveBeenCalledTimes(1)
        expect(loadURL).toHaveBeenCalledWith(url)
      })

      it('should invoke show() when did-finish-load fires', () => {
        expect(show).toHaveBeenCalledTimes(1)
      })

      it('should remove the menu from the window', () => {
        expect(setMenu).toHaveBeenCalledTimes(1)
        expect(setMenu).toHaveBeenCalledWith(null)
      })
    })
  })

  describe('showMessageBox()', () => {
    const currentWindow = jest.fn()
    const remote = {
      getCurrentWindow: () => currentWindow,
      dialog: {
        showMessageBoxSync: jest.fn()
      }
    }

    it('should not create any menus when the Electron remote module is not available', () => {
      window.require = null as any

      RemoteService.showMessageBox({ message: 'A test message.' })

      expect(remote.dialog.showMessageBoxSync).not.toHaveBeenCalled()
    })


    describe('when the Electron remote module is available', () => {
      beforeEach(() => {
        jest
          .spyOn(window, 'require')
          .mockImplementation(() => remote)
      })

      it('should show the message box with the given params', () => {
        const params = {
          title: 'A message',
          type: 'info',
          message: 'More message info',
          buttons: ['Yes', 'No']
        }

        RemoteService.showMessageBox(params)

        expect(remote.dialog.showMessageBoxSync).toHaveBeenCalledTimes(1)
        expect(remote.dialog.showMessageBoxSync).toHaveBeenCalledWith(currentWindow, params)
      })

      it('should default to a warning with an OK button and a title of \'Aristotle\'', () => {
        const message = 'A test message.'

        RemoteService.showMessageBox({ message })

        expect(remote.dialog.showMessageBoxSync).toHaveBeenCalledTimes(1)
        expect(remote.dialog.showMessageBoxSync).toHaveBeenCalledWith(currentWindow, {
          type: 'warning',
          buttons: ['OK'],
          title: 'Aristotle',
          message
        })
      })
    })
  })

  describe('onBeforeUnload()', () => {
    afterEach(() => {
      RemoteService.canCloseWindow = false
    })

    it('should return true when the Electron remote module is not available', () => {
      window.require = null as any

      expect(RemoteService.onBeforeUnload()).toBe(true)
    })

    it('should return false when the window cannot be closed', () => {
      RemoteService.canCloseWindow = false

      expect(RemoteService.onBeforeUnload()).toBe(false)
    })

    it('should return true when the window can be closed', () => {
      RemoteService.canCloseWindow = true

      expect(RemoteService.onBeforeUnload()).toBe(true)
    })
  })

  describe('quitting the application', () => {
    let closeFn: Function

    const remote = {
      getCurrentWindow: () => ({
        on: (e: string, _closeFn: Function) => {
          closeFn = _closeFn
        }
      }),
      app: {
        quit: jest.fn()
      }
    }

    it('should not quit when the Electron remote module is not available', () => {
      const callback = jest.fn()

      window.require = null as any

      RemoteService.on('close', callback)
      RemoteService.assignQuitter()

      expect(remote.app.quit).not.toHaveBeenCalled()
      expect(callback).not.toHaveBeenCalled()
    })

    describe('when the Electron remote module is available', () => {
      beforeEach(() => {
        jest
          .spyOn(window, 'require')
          .mockImplementation(() => remote)
        jest
          .spyOn(window, 'close')
          .mockImplementation(jest.fn())
      })

      describe('when the app is not yet ready to close', () => {
        it('should emit close when the window is attempting to close instead of quitting', () => {
          const callback = jest.fn()

          RemoteService.on('close', callback)
          RemoteService.assignQuitter()

          closeFn()

          expect(callback).toHaveBeenCalledTimes(1)
          expect(remote.app.quit).not.toHaveBeenCalled()
        })
      })

      describe('when the application is quit using the quit() method', () => {
        it('should quit the application instead of emitting close()', () => {
          const callback = jest.fn()

          RemoteService.on('close', callback)
          RemoteService.assignQuitter()
          RemoteService.quit()

          closeFn()

          expect(callback).not.toHaveBeenCalled()
          expect(remote.app.quit).toHaveBeenCalledTimes(1)
        })
      })
    })
  })
})

import { ipcRenderer, MenuItemConstructorOptions } from 'electron'
import { Menu, dialog } from '@electron/remote'
import { api } from '../preload'

/**
 * TODO: all of these tests fail because of "No such module was linked: electron_common_features"
 *
 * see: https://github.com/electron/remote/issues/101
 *
 * (it is not fixed in 2.0.8)
 */
jest.mock('electron')
jest.mock('@electron/remote')

describe('Remote Service', () => {
  afterEach(() => jest.resetAllMocks())

  it('should be true', () => {
    expect(true).toBe(true)
  })

  describe('setApplicationMenu()', () => {
    const menuItems: MenuItemConstructorOptions[] = [{
      label: 'Test item'
    }]

    it('should set the application menu to the one created', () => {
      const popup = jest.fn()

      jest
        .spyOn(Menu, 'buildFromTemplate')
        .mockReturnValue({ popup } as any)

      api.setApplicationMenu(menuItems)

      expect(Menu.setApplicationMenu).toHaveBeenCalledTimes(1)
      expect(Menu.setApplicationMenu).toHaveBeenCalledWith(Menu)
    })
  })

  describe('showContextMenu()', () => {
    const popup = jest.fn()
    const menuItems: MenuItemConstructorOptions[] = [{
      label: 'Test item'
    }]

    it('should set the application menu to the one created', () => {
      jest
        .spyOn(Menu, 'buildFromTemplate')
        .mockReturnValue({ popup } as any)

      jest
        .spyOn(window, 'require')
        .mockImplementation(() => ({ Menu }))

      jest
        .spyOn(Menu, 'buildFromTemplate')
        .mockReturnValue({ popup } as any)

      api.showContextMenu(menuItems)

      expect(Menu.buildFromTemplate).toHaveBeenCalledWith(menuItems)
      expect(popup).toHaveBeenCalledTimes(1)
    })
  })

  describe('showMessageBox()', () => {

    beforeEach(() => {
      jest
        .spyOn(dialog, 'showMessageBoxSync')
        .mockImplementation(jest.fn())
    })

    it('should show the message box with the given params', () => {
      const params = {
        title: 'A message',
        type: 'info',
        message: 'More message info',
        buttons: ['Yes', 'No']
      }

      // api.showMessageBox(params)

      expect(dialog.showMessageBoxSync).toHaveBeenCalledTimes(1)
      expect(dialog.showMessageBoxSync).toHaveBeenCalledWith(expect.anything(), params)
    })

    it('should default to a warning with an OK button and a title of \'Aristotle\'', () => {
      const message = 'A test message.'

      api.showMessageBox({ message })

      expect(dialog.showMessageBoxSync).toHaveBeenCalledTimes(1)
      expect(dialog.showMessageBoxSync).toHaveBeenCalledWith(expect.anything(), {
        type: 'warning',
        buttons: ['OK'],
        title: 'Aristotle',
        message
      })
    })
  })

  describe('onBeforeClose()', () => {
    beforeEach(() => {
      jest
        .spyOn(ipcRenderer, 'send')
        .mockImplementation(jest.fn())
      jest
        .spyOn(ipcRenderer, 'on')
        .mockImplementation((a, fn: any) => fn())
    })

    it('should send the `about-to-close` IPC call to the main process', async () => {
      api.onBeforeClose(() => Promise.resolve(true))

      expect(ipcRenderer.send).toHaveBeenCalledTimes(1)
    })
  })
})

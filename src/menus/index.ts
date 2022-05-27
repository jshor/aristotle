import { MenuItemConstructorOptions } from 'electron/main'
import { useRootStore } from '@/store/root'
import edit from './submenus/edit'
import file from './submenus/file'
import view from './submenus/view'

export default function createApplicationMenu () {
  const store = useRootStore()
  const menus: MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: file()
    }
  ]

  if (store.activeDocument) {
    menus.push({
      label: 'Edit',
      submenu: edit(store.activeDocument.store)
    })

    menus.push({
      label: 'View',
      submenu: view(store.activeDocument.store).concat([
        { type: 'separator' },
        {
          type: 'checkbox',
          click: store.toggleFullscreen,
          checked: store.isFullscreen,
          accelerator: 'F11',
          label: 'Fullscreen'
        }
      ])
    })
  }

  return menus
}

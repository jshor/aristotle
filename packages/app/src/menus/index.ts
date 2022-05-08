import { MenuItemConstructorOptions } from 'electron/main'
import { useRootStore } from '@/store/root'
import edit from './submenus/edit'
import file from './submenus/file'

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
      submenu: edit(store.activeDocument.store())
    })
  }

  return menus
}

import { MenuItemConstructorOptions } from 'electron/main'
import { RootStore } from '@/store/root'
import { Store } from 'pinia'
import edit from './submenus/edit'
import file from './submenus/file'

export default function createApplicationMenu (store: Store<string, RootStore, any>) {
  const menus: MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: file(store)
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

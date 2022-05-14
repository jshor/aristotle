import { MenuItemConstructorOptions } from 'electron/main'
import { Store } from 'pinia'
import DocumentState from '@/store/DocumentState'
import edit from '../submenus/edit'
import grid from '../submenus/grid'

export default function editor (store: Store<string, DocumentState, any>): MenuItemConstructorOptions[] {
  return edit(store, grid(store).concat({ type: 'separator' }))
}

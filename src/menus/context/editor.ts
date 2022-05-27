import { MenuItemConstructorOptions } from 'electron/main'
import { Store } from 'pinia'
import { DocumentStore } from '@/store/document'
import edit from '../submenus/edit'
import grid from '../submenus/grid'

export default function editor (store: DocumentStore): MenuItemConstructorOptions[] {
  return edit(store, grid(store).concat({ type: 'separator' }))
}

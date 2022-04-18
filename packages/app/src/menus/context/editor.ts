import { Store } from 'pinia'
import DocumentState from '@/store/DocumentState'
import edit from '../submenus/edit'
import grid from '../submenus/grid'

export default function editor (store: Store<string, DocumentState, any>): MenuEntry[] {
  return edit(store, grid(store).concat({ type: 'separator' }))
}

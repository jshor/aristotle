import { MenuItemConstructorOptions } from 'electron/main'
import { Store } from 'pinia'
import DocumentState from '@/store/DocumentState'

export default function grid (store: Store<string, DocumentState, any>): MenuItemConstructorOptions[] {
  return [
    {
      label: '&Grid',
      submenu: [
        {
          label: '&Show grid'
        },
        { type: 'separator' },
        { label: 'Snap to &grid' },
        { label: 'Snap to &elements' }
      ]
    }
  ]
}

import { MenuItemConstructorOptions } from 'electron/main'
import { DocumentStore } from '@/store/document'

export default function grid (useDocumentStore: DocumentStore): MenuItemConstructorOptions[] {
  const store = useDocumentStore()

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

import { MenuItemConstructorOptions } from 'electron/main'
import DocumentState from '@/store/DocumentState'
import { Store } from 'pinia'
import grid from './grid'

export default function edit (documentStore: Store<string, DocumentState, any>): MenuItemConstructorOptions[] {
  const zoomSubmenu: MenuItemConstructorOptions[] = []
  let hasFixedZoom = false

  for (let i = 1; i <= 8; i++) {
    const zoom = (i * 25) / 100
    const checked = documentStore.zoomLevel === zoom

    hasFixedZoom = hasFixedZoom || checked

    zoomSubmenu.push({
      type: 'checkbox',
      checked,
      label: `${zoom * 100}%`,
      accelerator: zoom === 1 ? 'CommandOrControl+0' : undefined,
      click: () => documentStore.setZoom({ zoom })
    })
  }

  if (!hasFixedZoom) {
    zoomSubmenu.unshift({
      type: 'checkbox',
      checked: true,
      label: 'Custom'
    })
  }

  const menu: MenuItemConstructorOptions[] = [
    {
      label: '&Zoom In',
      accelerator: 'CommandOrControl+=',
      enabled: documentStore.zoomLevel < 2, // TODO: const
      click: () => documentStore.incrementZoom(1)
    },
    {
      label: '&Zoom Out',
      accelerator: 'CommandOrControl+-',
      enabled: documentStore.zoomLevel > 0.1, // TODO: const
      click: () => documentStore.incrementZoom(-1)
    },
    {
      label: '&Zoom...',
      submenu: zoomSubmenu
    },
    { type: 'separator' },
    {
      label: '&Pan to Center',
      accelerator: 'CommandOrControl+;',
      click: documentStore.panToCenter
    },
    { type: 'separator' }
  ]

  return menu.concat(grid(documentStore))
}

import { MenuItemConstructorOptions } from 'electron/main'
import { DocumentStore } from '@/store/document'
import { createGridSubmenu } from './grid'
import { MenuFactory } from '@/types/interfaces/MenuFactory'
import { useRootStore } from '@/store/root'

/**
 * Creates the document View submenu.
 */
export const createViewSubmenu: MenuFactory = (useDocumentStore?: DocumentStore) => {
  const rootStore = useRootStore()
  const store = useDocumentStore!()
  const zoomSubmenu: MenuItemConstructorOptions[] = []
  let hasFixedZoom = false

  for (let i = 1; i <= 8; i++) {
    const zoom = (i * 25) / 100
    const checked = store.zoomLevel === zoom

    hasFixedZoom = hasFixedZoom || checked

    zoomSubmenu.push({
      type: 'checkbox',
      checked,
      label: `${zoom * 100}%`,
      accelerator: zoom === 1 ? 'CommandOrControl+0' : undefined,
      click: () => store.setZoom({ zoom })
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
      enabled: store.zoomLevel < 2, // TODO: const
      click: () => store.incrementZoom(1)
    },
    {
      label: '&Zoom Out',
      accelerator: 'CommandOrControl+-',
      enabled: store.zoomLevel > 0.1, // TODO: const
      click: () => store.incrementZoom(-1)
    },
    {
      label: '&Zoom...',
      submenu: zoomSubmenu
    },
    { type: 'separator' },
    {
      label: '&Pan to Center',
      accelerator: 'CommandOrControl+;',
      click: store.panToCenter
    },
    { type: 'separator' },
    {
      type: 'checkbox',
      click: rootStore.toggleFullscreen,
      checked: rootStore.isFullscreen,
      accelerator: 'F11',
      label: 'Fullscreen'
    }
  ]

  return menu.concat(createGridSubmenu())
}

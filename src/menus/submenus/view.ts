import { MenuItemConstructorOptions } from 'electron/main'
import { DocumentStore } from '@/store/document'
import { createGridSubmenu } from './grid'
import { MenuFactory } from '@/types/interfaces/MenuFactory'
import { useRootStore } from '@/store/root'
import { t } from '@/utils/i18n'
import { MAX_ZOOM, MIN_ZOOM } from '@/constants'

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
      label: t('menu.view.zoomCustom')
    })
  }

  const menu: MenuItemConstructorOptions[] = [
    {
      label: t('menu.view.zoomIn'),
      accelerator: 'CommandOrControl+=',
      enabled: store.zoomLevel < MIN_ZOOM,
      click: () => store.incrementZoom(1)
    },
    {
      label: t('menu.view.zoomOut'),
      accelerator: 'CommandOrControl+-',
      enabled: store.zoomLevel > MAX_ZOOM,
      click: () => store.incrementZoom(-1)
    },
    {
      label: t('menu.view.zoomLevel'),
      submenu: zoomSubmenu
    },
    { type: 'separator' },
    {
      label: t('menu.view.panToCenter'),
      accelerator: 'CommandOrControl+;',
      click: () => store.panToCenter()
    },
    { type: 'separator' },
    {
      type: 'checkbox',
      click: () => rootStore.toggleFullscreen(),
      checked: rootStore.isFullscreen,
      accelerator: 'F11',
      label: t('menu.view.fullscreen'),
    }
  ]

  return menu.concat(createGridSubmenu())
}

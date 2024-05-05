import { MenuItemConstructorOptions } from 'electron/main'
import { DocumentStore } from '@/store/document'
import { useRootStore } from '@/store/root'
import { MenuFactory } from '@/types/interfaces/MenuFactory'
import { t } from '@/utils/i18n'

/**
 * Creates a document Edit menu.
 */
export const createEditSubmenu: MenuFactory = (useDocumentStore?: DocumentStore, submenus = []) => {
  const store = useDocumentStore!()
  const rootStore = useRootStore()

  let menu: MenuItemConstructorOptions[] = [
    {
      label: t('menu.edit.undo'),
      enabled: store.canUndo,
      accelerator: 'CommandOrControl+Z',
      click: store.undo
    },
    { type: 'separator' },
    {
      role: 'cut',
      enabled: store.hasSelectedItems
    },
    {
      role: 'copy',
      enabled: store.hasSelectedItems
    },
    {
      role: 'paste',
      enabled: rootStore.canPaste
    },
    {
      label: t('menu.edit.delete'),
      accelerator: 'Delete',
      enabled: store.canDelete,
      click: () => store.deleteSelection()
    },
    { type: 'separator' },
    {
      label: t('menu.edit.selectAll'),
      accelerator: 'CommandOrControl+A',
      enabled: store.baseItems.length > 0,
      click: () => store.selectAll()
    }
  ]

  if (store.selectedItemIds.size > 0) {
    menu.push({ type: 'separator' })
    menu.push({
      label: t('menu.edit.rotate.parent'),
      submenu: [
        {
          label: t('menu.edit.rotate.clockwise'),
          accelerator: 'CmdOrCtrl+R',
          click: () => store.rotate(1)
        },
        {
          label: t('menu.edit.rotate.counterClockwise'),
          accelerator: 'CmdOrCtrl+Shift+R',
          click: () => store.rotate(-1)
        }
      ]
    })
  }

  if (store.hasSelection) {
    menu.push({ type: 'separator' })
    menu.push({
      label: t('menu.edit.forward.parent'),
      submenu: [
        {
          label: t('menu.edit.forward.bringForward'),
          accelerator: 'CmdOrCtrl+]',
          click: () => store.incrementZIndex(1)
        },
        {
          label: t('menu.edit.forward.bringToFront'),
          accelerator: 'CmdOrCtrl+Shift+]',
          click: () => store.setZIndex(store.zIndex)
        }
      ]
    })
    menu.push({
      label: t('menu.edit.backward.parent'),
      submenu: [
        {
          label: t('menu.edit.backward.sendBackward'),
          accelerator: 'CmdOrCtrl+[',
          click: () => store.incrementZIndex(-1)
        },
        {
          label: t('menu.edit.backward.sendToBack'),
          accelerator: 'CmdOrCtrl+Shift+[',
          click: () => store.setZIndex(store.zIndex)
        }
      ]
    })
    menu.push({ type: 'separator' })
    menu.push({
      label: t('menu.edit.group.parent'),
      submenu: [
        {
          label: t('menu.edit.group.group'),
          accelerator: 'CmdOrCtrl+G',
          enabled: store.canGroup,
          click: () => store.group()
        },
        {
          label: t('menu.edit.group.ungroup'),
          accelerator: 'CmdOrCtrl+Shift+G',
          enabled: store.canUngroup,
          click: () => store.ungroup()
        }
      ]
    })
  }

  if (submenus.length > 0) {
    menu.push({ type: 'separator' })
    menu = menu.concat(submenus)
  }

  if (store.activePortId) {
    const port = store.ports[store.activePortId]

    menu.push({ type: 'separator' })
    menu.push({
      type: 'checkbox',
      label: t('menu.edit.showInOscilloscope'),
      accelerator: 'CmdOrCtrl+.',
      checked: port.isMonitored,
      click: () => port.isMonitored
        ? store.unmonitorPort(port.id)
        : store.monitorPort(port.id)
    })
  }

  return menu
}

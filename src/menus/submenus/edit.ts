import { MenuItemConstructorOptions } from 'electron/main'
import { DocumentStore } from '@/store/document'
import { useRootStore } from '@/store/root'

export default function edit (useDocumentStore: DocumentStore, submenus: MenuItemConstructorOptions[] = []): MenuItemConstructorOptions[] {
  const store = useDocumentStore()
  const rootStore = useRootStore()

  let menu: MenuItemConstructorOptions[] = [
    {
      label: '&Undo',
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
      label: 'Delete',
      accelerator: 'Delete',
      enabled: store.canDelete,
      click: store.deleteSelection
    },
    { type: 'separator' },
    {
      label: '&Select All',
      accelerator: 'CommandOrControl+A',
      enabled: store.baseItems.length > 0,
      click: store.selectAll
    }
  ]

  if (store.selectedItemIds.size > 0) {
    menu.push({ type: 'separator' })
    menu.push({
      label: '&Rotate',
      submenu: [
        {
          label: 'Rotate 90° &CW',
          accelerator: 'CmdOrCtrl+R',
          click: () => store.rotate(1)
        },
        {
          label: 'Rotate 90° CC&W',
          accelerator: 'CmdOrCtrl+Shift+R',
          click: () => store.rotate(-1)
        }
      ]
    })
  }

  if (store.hasSelection) {
    menu.push({ type: 'separator' })
    menu.push({
      label: '&Bring to Front',
      submenu: [
        {
          label: '&Bring to Front',
          click: () => store.setZIndex(store.zIndex)
        },
        {
          label: 'Bring &Forward',
          click: () => store.incrementZIndex(1)
        }
      ]
    })
    menu.push({
      label: '&Send to Back',
      submenu: [
        {
          label: '&Send to Back',
          click: () => store.setZIndex(store.zIndex)
        },
        {
          label: 'Send &Backward',
          click: () => store.incrementZIndex(-1)
        }
      ]
    })
  }

  if (store.canGroup) {
    menu.push({
      label: '&Group',
      submenu: [
        { label: '&Group' },
        {
          label: '&Ungroup',
          enabled: store.canUngroup
        }
      ]
    })
  }

  if (submenus.length > 0) {
    menu.push({ type: 'separator' })
    menu = menu.concat(submenus)
  }

  if (store.selectedItemIds.size === 1) {
    menu.push({ type: 'separator' })
    menu.push({
      label: '&Item Properties'
    })
  }

  if (store.activePortId) {
    menu.push({ type: 'separator' })
    menu.push({
      type: 'checkbox',
      label: 'Show in &Oscilloscope',
      checked: true
    })
  }

  return menu
}

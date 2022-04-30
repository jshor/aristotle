import { Store } from 'pinia'
import DocumentState from '@/store/DocumentState'

export default function edit (store: Store<string, DocumentState, any>, submenus: MenuEntry[] = []): MenuEntry[] {
  let menu: MenuEntry[] = [
    {
      label: '&Undo',
      enabled: store.canUndo,
      accelerator: 'CommandOrControl+Z',
      click: store.undo
    },
    { type: 'separator' },
    {
      role: 'cut',
      enabled: store.hasSelection,
      click: () => console.log('cut')
    },
    {
      label: 'Copy',
      enabled: store.hasSelection,
      accelerator: 'CommandOrControl+C',
      click: store.copy
    },
    {
      label: 'Paste',
      accelerator: 'CommandOrControl+V',
      click: store.paste
    },
    {
      label: 'Delete',
      accelerator: 'Delete',
      enabled: store.hasSelection,
      click: store.deleteSelection
    },
    { type: 'separator' },
    {
      role: 'selectAll',
      click: store.selectAll
    }
  ]

  if (store.selectedItemIds.length > 0) {
    menu.push({ type: 'separator' })
    menu.push({
      label: '&Rotate',
      submenu: [
        {
          label: 'Rotate 90° &CW',
          click: () => store.rotate(1)
        },
        {
          label: 'Rotate 90° CC&W',
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

  if (store.selectedItemIds.length === 1) {
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

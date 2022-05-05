import { MenuItemConstructorOptions } from 'electron/main'
import { Store } from 'pinia'
import { RootStore } from '@/store/root'

export default function file (store: Store<string, RootStore, any>): MenuItemConstructorOptions[] {
  const hasDocument = store.activeDocumentId !== null
  const documentList = Object.keys(store.documents)
  const items: MenuItemConstructorOptions[] = [
    {
      label: '&New Circuit',
      accelerator: 'CommandOrControl+N',
      click: store.newDocument
    },
    { type: 'separator' },
    {
      label: '&Open Circuit',
      accelerator: 'CommandOrControl+O',
      click: store.selectDocument
    },
    {
      label: 'Open &Integrated Circuit',
      accelerator: 'CommandOrControl+Shift+O',
      click: store.selectDocument
    },
    { type: 'separator' },
    {
      label: 'Save',
      enabled: hasDocument,
      accelerator: 'CommandOrControl+S',
      click: store.saveActiveDocument
    },
    {
      label: 'Save As...',
      enabled: hasDocument,
      accelerator: 'CommandOrControl+Shift+S',
      click: () => store.saveActiveDocument(true)
    },
    {
      label: 'Save All',
      enabled: hasDocument,
      accelerator: 'CommandOrControl+Shift+A',
      click: () => console.log('root store save all')
    },
    { type: 'separator' },
    {
      label: 'Export',
      enabled: hasDocument,
      submenu: [{
        label: 'Integrated Circuit',
        accelerator: 'CommandOrControl+Shift+E',
        click: () => console.log('export IC')
      }]
    },
    { type: 'separator' },
    {
      label: 'Preferences',
      submenu: [
        {
          label: 'Global Preferences',
          accelerator: 'CommandOrControl+,',
          click: () => console.log('global prefs')
        },
        {
          label: 'Document Preferences',
          accelerator: 'CommandOrControl+Shift+,',
          click: () => console.log('doc prefs')
        }
      ]
    }
  ]

  if (Object.keys(store.documents).length > 1) {
    const submenu: MenuItemConstructorOptions[] = [
      {
        label: 'Previous File',
        accelerator: 'CmdOrCtrl+Shift+Tab',
        click: () => store.switchDocument(-1)
      },
      {
        label: 'Next File',
        accelerator: 'CmdOrCtrl+Tab',
        click: () => store.switchDocument(1)
      },
      { type: 'separator' }
    ]

    for (let i = 0; i < documentList.length; i++) {
      submenu.push({
        type: "checkbox",
        label: store.documents[documentList[i]].displayName,
        checked: store.activeDocumentId === documentList[i],
        click: () => store.activateDocument(documentList[i])
      })
    }

    items.push({ type: 'separator' })
    items.push({
      label: 'Switch to...',
      submenu
    })
  }

  items.push({ type: 'separator' })
  items.push({
    label: 'Close Document',
    accelerator: 'CmdOrCtrl+W',
    click: () => store.closeDocument(store.activeDocumentId)
  })

  items.push({ type: 'separator' })
  items.push({
    label: 'Exit',
    accelerator: 'CmdOrCtrl+Q',
    click: () => window.close()
  })

  return items
}

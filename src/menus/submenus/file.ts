import { MenuItemConstructorOptions } from 'electron/main'
import { useRootStore } from '@/store/root'
import { DocumentStatus } from '@/types/enums/DocumentStatus'
import { MenuFactory } from '@/types/interfaces/MenuFactory'
import { ViewType } from '@/types/enums/ViewType'

/**
 * Creates a document File menu.
 */
export const createFileSubmenu: MenuFactory = () => {
  const rootStore = useRootStore()
  const hasDocument = rootStore.activeDocumentId !== null
  const documentList = Object.keys(rootStore.documents)
  const store = rootStore.activeDocument?.store()
  const items: MenuItemConstructorOptions[] = [
    {
      label: '&New Circuit',
      accelerator: 'CommandOrControl+N',
      click: rootStore.newDocument
    },
    { type: 'separator' },
    {
      label: '&Open Circuit',
      accelerator: 'CommandOrControl+O',
      click: rootStore.selectDocument
    },
    {
      label: 'Open &Integrated Circuit',
      accelerator: 'CommandOrControl+Shift+O',
      click: rootStore.selectDocument
    },
    { type: 'separator' },
    {
      label: 'Save',
      enabled: hasDocument,
      accelerator: 'CommandOrControl+S',
      click: () => rootStore.saveActiveDocument()
    },
    {
      label: 'Save As...',
      enabled: hasDocument,
      accelerator: 'CommandOrControl+Shift+S',
      click: () => rootStore.saveActiveDocument(true)
    },
    {
      label: 'Save All',
      enabled: hasDocument,
      accelerator: 'CommandOrControl+Shift+A',
      click: () => console.log('root store save all')
    },
    { type: 'separator' },
    {
      label: 'Print',
      enabled: hasDocument,
      accelerator: 'CommandOrControl+P',
      click: store?.setStatus.bind(store, DocumentStatus.Printing)
    },
    { type: 'separator' },
    {
      label: 'Export...',
      enabled: hasDocument,
      submenu: [
        {
          label: 'Integrated Circuit',
          accelerator: 'CommandOrControl+Shift+E',
          click: () => console.log('export IC')
        },
        {
          label: 'PNG Image',
          accelerator: 'CommandOrControl+Shift+I',
          click: store?.setStatus.bind(store, DocumentStatus.SavingImage)
        }
      ]
    },
    { type: 'separator' },
    {
      label: 'Preferences',
      accelerator: 'CommandOrControl+,',
      click: () => (rootStore.dialogType = ViewType.Preferences)
    }
  ]

  if (Object.keys(rootStore.documents).length > 1) {
    const submenu: MenuItemConstructorOptions[] = [
      {
        label: 'Previous File',
        accelerator: 'Ctrl+Shift+Tab',
        click: () => rootStore.switchDocument(-1)
      },
      {
        label: 'Next File',
        accelerator: 'Ctrl+Tab',
        click: () => rootStore.switchDocument(1)
      },
      { type: 'separator' }
    ]

    for (let i = 0; i < documentList.length; i++) {
      submenu.push({
        type: "checkbox",
        label: rootStore.documents[documentList[i]].displayName,
        checked: rootStore.activeDocumentId === documentList[i],
        click: () => rootStore.activateDocument(documentList[i])
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
    enabled: hasDocument,
    click: () => rootStore.closeActiveDocument()
  })

  items.push({ type: 'separator' })
  items.push({
    label: 'Exit',
    accelerator: 'CmdOrCtrl+Q',
    click: () => window.close()
  })

  return items
}

import { MenuItemConstructorOptions } from 'electron/main'
import { useRootStore } from '@/store/root'
import { DocumentStatus } from '@/types/enums/DocumentStatus'
import { MenuFactory } from '@/types/interfaces/MenuFactory'
import { ViewType } from '@/types/enums/ViewType'
import { t } from '@/utils/i18n'

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
      label: t('menu.file.newCircuit'),
      accelerator: 'CommandOrControl+N',
      click: () => rootStore.newDocument()
    },
    { type: 'separator' },
    {
      label: t('menu.file.openCircuit'),
      accelerator: 'CommandOrControl+O',
      click: () => rootStore.selectDocument()
    },
    {
      label: t('menu.file.openIntegratedCircuit'),
      accelerator: 'CommandOrControl+Shift+O',
      click: () => rootStore.selectDocument(true)
    },
    { type: 'separator' },
    {
      label: t('menu.file.save'),
      enabled: hasDocument,
      accelerator: 'CommandOrControl+S',
      click: () => rootStore.saveActiveDocument()
    },
    {
      label: t('menu.file.saveAs'),
      enabled: hasDocument,
      accelerator: 'CommandOrControl+Shift+S',
      click: () => rootStore.saveActiveDocument(true)
    },
    {
      label: t('menu.file.saveAll'),
      enabled: hasDocument,
      accelerator: 'CommandOrControl+Shift+A',
      click: () => rootStore.saveAllDocuments()
    },
    { type: 'separator' },
    {
      label: t('menu.file.print'),
      enabled: hasDocument,
      accelerator: 'CommandOrControl+P',
      click: () => store!.setStatus(DocumentStatus.Printing)
    },
    { type: 'separator' },
    {
      label: t('menu.file.export.parent'),
      enabled: hasDocument,
      submenu: [
        {
          label: t('menu.file.export.integratedCircuit'),
          accelerator: 'CommandOrControl+Shift+E',
          click: () => console.log('export IC')
        },
        {
          label: t('menu.file.export.pngImage'),
          accelerator: 'CommandOrControl+Shift+I',
          click: () => store!.setStatus(DocumentStatus.SavingImage)
        }
      ]
    },
    { type: 'separator' },
    {
      label: t('menu.file.preferences'),
      accelerator: 'CommandOrControl+,',
      click: () => (rootStore.dialogType = ViewType.Preferences)
    }
  ]

  if (Object.keys(rootStore.documents).length > 1) {
    const submenu: MenuItemConstructorOptions[] = [
      {
        label: t('menu.file.switchTo.previous'),
        accelerator: 'Ctrl+Shift+Tab',
        click: () => rootStore.switchDocument(-1)
      },
      {
        label: t('menu.file.switchTo.next'),
        accelerator: 'Ctrl+Tab',
        click: () => rootStore.switchDocument(1)
      },
      { type: 'separator' }
    ]

    for (let i = 0; i < documentList.length; i++) {
      submenu.push({
        type: 'checkbox',
        label: rootStore.documents[documentList[i]].displayName,
        checked: rootStore.activeDocumentId === documentList[i],
        click: () => rootStore.activateDocument(documentList[i])
      })
    }

    items.push({ type: 'separator' })
    items.push({
      label: t('menu.file.switchTo.parent'),
      submenu
    })
  }

  items.push({ type: 'separator' })
  items.push({
    label: t('menu.file.closeDocument'),
    accelerator: 'CmdOrCtrl+W',
    enabled: hasDocument,
    click: () => rootStore.closeActiveDocument()
  })

  items.push({ type: 'separator' })
  items.push({
    label: t('menu.file.exit'),
    accelerator: 'CmdOrCtrl+Q',
    click: () => window.close()
  })

  return items
}

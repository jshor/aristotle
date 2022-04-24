import { Store } from 'pinia'
import { RootStore } from '@/store/root'

export default function file (store: Store<string, RootStore, any>): MenuEntry[] {
  const hasDocument = store.activeDocumentId !== null

  return [
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
    },
    { type: 'separator' },
    // close document, close saved, close all
    {
      label: 'Exit',
      click: () => window.close()
    }
  ]
}

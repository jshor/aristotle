import { MenuItemConstructorOptions } from 'electron/main'
import { DocumentStore } from '@/store/document'

export default function oscilloscope (useDocumentStore: DocumentStore, portId?: string): MenuItemConstructorOptions[] {
  const store = useDocumentStore()
  const menuItems: MenuItemConstructorOptions[] = []

  if (portId) {
    menuItems.push({
      label: 'Change color',
      click: () => store.setRandomPortColor(portId)
    })
    menuItems.push({
      label: 'Remove wave',
      click: () => store.unmonitorPort(portId)
    })
    menuItems.push({
      type: 'separator'
    })
  }

  return menuItems.concat([
    {
      label: 'Clear all waves',
      click: () => store.oscillator.clear()
    },
    {
      label: 'Remove all waves',
      click: () => store.destroyOscilloscope()
    },
    {
      type: 'separator'
    },
    {
      label: 'Close oscilloscope',
      click: () => store.closeOscilloscope()
    }
  ])
}

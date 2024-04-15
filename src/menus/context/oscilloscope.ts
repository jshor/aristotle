import { DocumentStore } from '@/store/document'
import { MenuFactory } from '@/types/interfaces/MenuFactory'

/**
 * Creates the oscilloscope context menu.
 */
export const createOscilloscopeContextMenu: MenuFactory = (useDocumentStore?: DocumentStore, submenu = []) => {
  const store = useDocumentStore!()

  return submenu.concat([
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

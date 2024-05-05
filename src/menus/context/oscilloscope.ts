import { DocumentStore } from '@/store/document'
import { MenuFactory } from '@/types/interfaces/MenuFactory'
import { t } from '@/utils/i18n'

/**
 * Creates the oscilloscope context menu.
 */
export const createOscilloscopeContextMenu: MenuFactory = (useDocumentStore?: DocumentStore, submenu = []) => {
  const store = useDocumentStore!()

  return submenu.concat([
    {
      label: t('menu.oscilloscope.clearAllWaves'),
      click: () => store.oscillator.clear()
    },
    {
      label: t('menu.oscilloscope.removeAllWaves'),
      click: () => store.destroyOscilloscope()
    },
    {
      type: 'separator'
    },
    {
      label: t('menu.oscilloscope.close'),
      click: () => store.closeOscilloscope()
    }
  ])
}

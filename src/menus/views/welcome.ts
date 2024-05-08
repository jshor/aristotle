import { MenuFactory } from '@/types/interfaces/MenuFactory'
import { createHelpSubmenu } from '../submenus/help'
import { useRootStore } from '@/store/root'
import { ViewType } from '@/types/enums/ViewType'
import { t } from '@/utils/i18n'

/**
 * Creates the application menu for the preferences dialog.
 */
export const createWelcomeMenu: MenuFactory = () => {
  const rootStore = useRootStore()

  return [
    {
      label: 'File',
      submenu: [
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
          label: t('menu.file.preferences'),
          accelerator: 'CommandOrControl+,',
          click: () => (rootStore.dialogType = ViewType.Preferences)
        },
        { type: 'separator' },
        {
          label: t('menu.file.exit'),
          accelerator: 'CmdOrCtrl+Q',
          click: () => window.close()
        }
      ]
    },
    {
      label: t('menu.help.parent'),
      role: 'help',
      submenu: createHelpSubmenu()
    }
  ]
}

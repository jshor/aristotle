import { MenuFactory } from '@/types/interfaces/MenuFactory'
import { createHelpSubmenu } from '../submenus/help'
import { useRootStore } from '@/store/root'
import { ViewType } from '@/types/enums/ViewType'
import { t } from '@/utils/i18n'

/**
 * Creates the application menu for the preferences dialog.
 */
export const createPreferencesMenu: MenuFactory = () => {
  const rootStore = useRootStore()

  return [
    {
      label: 'File',
      submenu: [
        {
          label: t('menu.file.closePreferences'),
          accelerator: 'Escape',
          click: () => (rootStore.dialogType = ViewType.None)
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

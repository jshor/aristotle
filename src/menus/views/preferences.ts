import { MenuFactory } from '@/types/interfaces/MenuFactory'
import { createHelpSubmenu } from '../submenus/help'
import { useRootStore } from '@/store/root'
import { ViewType } from '@/types/enums/ViewType'

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
          label: 'Close Preferences',
          accelerator: 'Escape',
          click: () => (rootStore.dialogType = ViewType.None)
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: 'CmdOrCtrl+Q',
          click: () => window.close()
        }
      ]
    },
    {
      label: 'Help',
      role: 'help',
      submenu: createHelpSubmenu()
    }
  ]
}

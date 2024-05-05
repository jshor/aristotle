import { MenuFactory } from '@/types/interfaces/MenuFactory'
import { DocumentStore } from '@/store/document'
import { createHelpSubmenu } from '../submenus/help'
import { createEditSubmenu } from '../submenus/edit'
import { createFileSubmenu } from '../submenus/file'
import { createViewSubmenu } from '../submenus/view'
import { t } from '@/utils/i18n'

/**
 * Creates the document application menu.
 */
export const createDocumentMenu: MenuFactory = (useDocumentStore?: DocumentStore) => {
  return [
    {
      label: t('menu.file.parent'),
      submenu: createFileSubmenu(useDocumentStore)
    },
    {
      label: t('menu.edit.parent'),
      submenu: createEditSubmenu(useDocumentStore)
    },
    {
      label: t('menu.view.parent'),
      submenu: createViewSubmenu(useDocumentStore)
    },
    {
      label: t('menu.help.parent'),
      role: 'help',
      submenu: createHelpSubmenu()
    }
  ]
}

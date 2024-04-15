import { MenuFactory } from '@/types/interfaces/MenuFactory'
import { DocumentStore } from '@/store/document'
import { createHelpSubmenu } from '../submenus/help'
import { createEditSubmenu } from '../submenus/edit'
import { createFileSubmenu } from '../submenus/file'
import { createViewSubmenu } from '../submenus/view'

/**
 * Creates the document application menu.
 */
export const createDocumentMenu: MenuFactory = (useDocumentStore?: DocumentStore) => {
  return [
    {
      label: 'File',
      submenu: createFileSubmenu(useDocumentStore)
    },
    {
      label: 'Edit',
      submenu: createEditSubmenu(useDocumentStore)
    },
    {
      label: 'View',
      submenu: createViewSubmenu(useDocumentStore)
    },
    {
      label: 'Help',
      role: 'help',
      submenu: createHelpSubmenu()
    }
  ]
}

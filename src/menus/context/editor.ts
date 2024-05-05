import { DocumentStore } from '@/store/document'
import { createEditSubmenu } from '../submenus/edit'
import { createGridSubmenu } from '../submenus/grid'
import { MenuFactory } from '@/types/interfaces/MenuFactory'

/**
 * Creates the document editor context menu.
 */
export const createEditorContextMenu: MenuFactory = (useDocumentStore?: DocumentStore) => {
  return createEditSubmenu(useDocumentStore, createGridSubmenu(useDocumentStore))
}

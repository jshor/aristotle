import { MenuItemConstructorOptions } from 'electron/main'
import { DocumentStore } from '@/store/document'

export interface MenuFactory {
  (useDocumentStore?: DocumentStore, submenus?: MenuItemConstructorOptions[]): MenuItemConstructorOptions[]
}

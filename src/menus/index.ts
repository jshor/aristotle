import { MenuItemConstructorOptions } from 'electron/main'
import { useRootStore } from '@/store/root'
import { createDocumentMenu } from './views/document'
import { createPreferencesMenu } from './views/preferences'
import { ViewType } from '@/types/enums/ViewType'
import { createWelcomeMenu } from './views/welcome'

/**
 * Returns the application menu based on the current view type.
 */
export function createApplicationMenu (): MenuItemConstructorOptions[] {
  const store = useRootStore()

  switch (store.viewType) {
    case ViewType.Document:
      return createDocumentMenu(store.activeDocument?.store)
    case ViewType.Preferences:
      return createPreferencesMenu()
    default:
      return createWelcomeMenu()
  }
}

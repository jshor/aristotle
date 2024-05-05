import { usePreferencesStore } from '@/store/preferences'
import { MenuFactory } from '@/types/interfaces/MenuFactory'
import { t } from '@/utils/i18n'

/**
 * Creates a document-based editor Grid submenu.
 */
export const createGridSubmenu: MenuFactory = () => {
  const preferencesStore = usePreferencesStore()

  return [
    {
      label: t('menu.grid.parent'),
      submenu: [
        {
          label: t('menu.grid.showGrid'),
          checked: preferencesStore.grid.showGrid.value,
          click: () => (preferencesStore.grid.showGrid.value = !preferencesStore.grid.showGrid.value)
        },
        { type: 'separator' },
        {
          label: t('menu.grid.snapToGrid'),
          checked: preferencesStore.snapping.snapToGrid.value,
          click: () => (preferencesStore.snapping.snapToGrid.value = !preferencesStore.snapping.snapToGrid.value)
        },
        {
          label: t('menu.grid.snapToElements'),
          checked: preferencesStore.snapping.snapToAlign.value,
          click: () => (preferencesStore.snapping.snapToAlign.value = !preferencesStore.snapping.snapToAlign.value)
        }
      ]
    }
  ]
}

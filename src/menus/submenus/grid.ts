import { usePreferencesStore } from '@/store/preferences'
import { MenuFactory } from '@/types/interfaces/MenuFactory'

/**
 * Creates a document-based editor Grid submenu.
 */
export const createGridSubmenu: MenuFactory = () => {
  const preferencesStore = usePreferencesStore()

  return [
    {
      label: '&Grid',
      submenu: [
        {
          label: '&Show grid',
          checked: preferencesStore.grid.showGrid.value,
          click: () => (preferencesStore.grid.showGrid.value = !preferencesStore.grid.showGrid.value)
        },
        { type: 'separator' },
        {
          label: 'Snap to &grid',
          checked: preferencesStore.snapping.snapToGrid.value,
          click: () => (preferencesStore.snapping.snapToGrid.value = !preferencesStore.snapping.snapToGrid.value)
        },
        {
          label: 'Snap to &elements',
          checked: preferencesStore.snapping.snapToAlign.value,
          click: () => (preferencesStore.snapping.snapToAlign.value = !preferencesStore.snapping.snapToAlign.value)
        }
      ]
    }
  ]
}

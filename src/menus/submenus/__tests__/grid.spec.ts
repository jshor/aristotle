import { setActivePinia } from 'pinia'
import { createTestingPinia } from '@pinia/testing'
import { createGridSubmenu } from '../grid'
import { DocumentStore, createDocumentStore } from '@/store/document'
import { t } from '@/utils/i18n'
import { buildMenu } from '@/menus/__tests__/utils.helper'
import { usePreferencesStore } from '@/store/preferences'

describe('Grid submenu', () => {
  const documentId = 'test-document-id'
  let useDocumentStore: DocumentStore

  beforeEach(() => {
    setActivePinia(createTestingPinia())
    useDocumentStore = createDocumentStore(documentId)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should provide the submenu', () => {
    expect(buildMenu(createGridSubmenu(useDocumentStore))[0].label).toBe(t('menu.grid.parent'))
  })

  describe('the grid toggle option', () => {
    it('should provide an option to toggle the grid on when it is off', () => {
      const store = usePreferencesStore()
      store.grid.showGrid.value = false
      const menuItem = buildMenu(createGridSubmenu(useDocumentStore))[0].submenu[0]

      expect(menuItem.label).toBe(t('menu.grid.showGrid'))
      expect(menuItem.checked).toBe(false)

      menuItem.click()
      expect(store.grid.showGrid.value).toBe(true)
    })

    it('should provide an option to toggle the grid off when it is on', () => {
      const store = usePreferencesStore()
      store.grid.showGrid.value = true
      const menuItem = buildMenu(createGridSubmenu(useDocumentStore))[0].submenu[0]

      expect(menuItem.label).toBe(t('menu.grid.showGrid'))
      expect(menuItem.checked).toBe(true)

      menuItem.click()
      expect(store.grid.showGrid.value).toBe(false)
    })
  })

  describe('the snap-to-grid toggle option', () => {
    it('should provide an option to snap elements to the grid when it is not enabled', () => {
      const store = usePreferencesStore()
      store.snapping.snapToGrid.value = false
      const menuItem = buildMenu(createGridSubmenu(useDocumentStore))[0].submenu[2]

      expect(menuItem.label).toBe(t('menu.grid.snapToGrid'))
      expect(menuItem.checked).toBe(false)

      menuItem.click()
      expect(store.snapping.snapToGrid.value).toBe(true)
    })

    it('should provide an option to not snap elements to the grid when it is enabled', () => {
      const store = usePreferencesStore()
      store.snapping.snapToGrid.value = true
      const menuItem = buildMenu(createGridSubmenu(useDocumentStore))[0].submenu[2]

      expect(menuItem.label).toBe(t('menu.grid.snapToGrid'))
      expect(menuItem.checked).toBe(true)

      menuItem.click()
      expect(store.snapping.snapToGrid.value).toBe(false)
    })
  })

  describe('the snap-to-elements toggle option', () => {
    it('should provide an option to snap elements to other elements when it is not enabled', () => {
      const store = usePreferencesStore()
      store.snapping.snapToAlign.value = false
      const menuItem = buildMenu(createGridSubmenu(useDocumentStore))[0].submenu[3]

      expect(menuItem.label).toBe(t('menu.grid.snapToElements'))
      expect(menuItem.checked).toBe(false)

      menuItem.click()
      expect(store.snapping.snapToAlign.value).toBe(true)
    })

    it('should provide an option to not snap elements to other elements when it is enabled', () => {
      const store = usePreferencesStore()
      store.snapping.snapToAlign.value = true
      const menuItem = buildMenu(createGridSubmenu(useDocumentStore))[0].submenu[3]

      expect(menuItem.label).toBe(t('menu.grid.snapToElements'))
      expect(menuItem.checked).toBe(true)

      menuItem.click()
      expect(store.snapping.snapToAlign.value).toBe(false)
    })
  })
})

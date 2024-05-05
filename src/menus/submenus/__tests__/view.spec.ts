import { setActivePinia } from 'pinia'
import { createTestingPinia } from '@pinia/testing'
import { createViewSubmenu } from '../view'
import { DocumentStore, createDocumentStore } from '@/store/document'
import { t } from '@/utils/i18n'
import { buildMenu } from '@/menus/__tests__/utils.helper'
import { useRootStore } from '@/store/root'
import { stubAll } from '@/store/document/actions/__tests__/__helpers__'

describe('View submenu', () => {
  const documentId = 'test-document-id'
  let useDocumentStore: DocumentStore

  beforeEach(() => {
    setActivePinia(createTestingPinia())
    useDocumentStore = createDocumentStore(documentId)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('zoom functions', () => {
    it('should provide an option to zoom in', () => {
      const store = useDocumentStore()
      const zoomSubmenu = buildMenu(createViewSubmenu(useDocumentStore))
      const zoomIn = zoomSubmenu[0]

      stubAll(store, ['incrementZoom'])
      zoomIn.click()

      expect(zoomIn.label).toBe(t('menu.view.zoomIn'))
      expect(store.incrementZoom).toHaveBeenCalledTimes(1)
      expect(store.incrementZoom).toHaveBeenCalledWith(1)
    })

    it('should provide an option to zoom out', () => {
      const store = useDocumentStore()
      const zoomSubmenu = buildMenu(createViewSubmenu(useDocumentStore))
      const zoomIn = zoomSubmenu[1]

      stubAll(store, ['incrementZoom'])
      zoomIn.click()

      expect(zoomIn.label).toBe(t('menu.view.zoomOut'))
      expect(store.incrementZoom).toHaveBeenCalledTimes(1)
      expect(store.incrementZoom).toHaveBeenCalledWith(-1)
    })

    it('should provide a list of fixed zoom levels', () => {
      const store = useDocumentStore()
      const menuItem = buildMenu(createViewSubmenu(useDocumentStore))[2]
      const zoomLevels = menuItem.submenu.slice(0, 8)

      stubAll(store, ['setZoom'])

      expect(menuItem.label).toBe(t('menu.view.zoomLevel'))

      zoomLevels.forEach((item, index) => {
        const zoomLevel = (index + 1) * 25

        expect(item.label).toBe(`${zoomLevel}%`)
        expect(item.checked).toBe(zoomLevel === 100)
        expect(item.accelerator).toBe(zoomLevel === 100 ? 'CommandOrControl+0' : undefined)

        item.click()

        expect(store.setZoom).toHaveBeenCalledWith({ zoom: zoomLevel / 100 })

        store.zoomLevel = zoomLevel / 100
        expect(buildMenu(createViewSubmenu(useDocumentStore))[2].submenu[index].checked).toBe(true)
      })

      expect(store.setZoom).toHaveBeenCalledTimes(zoomLevels.length)
    })

    it('should show that a custom zoom level is used when the zoom is not a pre-defined option', () => {
      const store = useDocumentStore()

      store.zoomLevel = 0.175

      const menuItem = buildMenu(createViewSubmenu(useDocumentStore))[2]
      const customZoom = menuItem.submenu[0]

      expect(customZoom.label).toBe(t('menu.view.zoomCustom'))
      expect(customZoom.checked).toBe(true)
    })
  })

  it('should provide an option to pan to the center', () => {
    const store = useDocumentStore()
    const menuItem = buildMenu(createViewSubmenu(useDocumentStore))[4]

    stubAll(store, ['panToCenter'])
    menuItem.click()

    expect(menuItem.label).toBe(t('menu.view.panToCenter'))
    expect(menuItem.accelerator).toBe('CommandOrControl+;')
    expect(store.panToCenter).toHaveBeenCalledTimes(1)
  })

  it('should provide an option to pan to toggle fullscreen mode', () => {
    const store = useRootStore()
    const menuItem = buildMenu(createViewSubmenu(useDocumentStore))[6]

    stubAll(store, ['toggleFullscreen'])
    menuItem.click()

    expect(menuItem.label).toBe(t('menu.view.fullscreen'))
    expect(menuItem.accelerator).toBe('F11')
    expect(store.toggleFullscreen).toHaveBeenCalledTimes(1)
    expect(menuItem.checked).toBe(store.isFullscreen)
  })
})

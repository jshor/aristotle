import { setActivePinia } from 'pinia'
import { createTestingPinia } from '@pinia/testing'
import { MenuItem } from 'electron'
import { createEditSubmenu } from '../edit'
import { DocumentStore, createDocumentStore } from '@/store/document'
import { t } from '@/utils/i18n'
import { buildMenu } from '@/menus/__tests__/utils.helper'
import { createItem, stubAll } from '@/store/document/actions/__tests__/__helpers__'
import ItemType from '@/types/enums/ItemType'


describe('Edit submenu', () => {
  let useDocumentStore: DocumentStore

  beforeEach(() => {
    setActivePinia(createTestingPinia())

    useDocumentStore = createDocumentStore('test-document')
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('the delete menu item', () => {
    it('should provide an option to delete selected items', () => {
      const store = useDocumentStore()

      vi
        .spyOn(store, 'canDelete', 'get')
        .mockReturnValue(true)

      const item = buildMenu(createEditSubmenu(useDocumentStore))[5]

      stubAll(store, ['deleteSelection'])
      item.click()

      expect(item.label).toBe(t('menu.edit.delete'))
      expect(item.enabled).toBe(true)
      expect(store.deleteSelection).toHaveBeenCalledTimes(1)
    })

    it('should disable the option when there is nothing to delete', () => {
      const store = useDocumentStore()

      vi
        .spyOn(store, 'canDelete', 'get')
        .mockReturnValue(false)

      expect(buildMenu(createEditSubmenu(useDocumentStore))[5].enabled).toBe(false)
    })
  })

  describe('the select all menu item', () => {
    it('should provide an option to select all items', () => {
      const store = useDocumentStore()

      vi
        .spyOn(store, 'baseItems', 'get')
        .mockReturnValue([{ id: '1', isSelected: false, zIndex: 1 }])

      const item = buildMenu(createEditSubmenu(useDocumentStore))[7]

      stubAll(store, ['selectAll'])
      item.click()

      expect(item.label).toBe(t('menu.edit.selectAll'))
      expect(item.enabled).toBe(true)
      expect(store.selectAll).toHaveBeenCalledTimes(1)
    })

    it('should disable the option when there is nothing to select', () => {
      const store = useDocumentStore()

      vi
        .spyOn(store, 'baseItems', 'get')
        .mockReturnValue([])

      expect(buildMenu(createEditSubmenu(useDocumentStore))[7].enabled).toBe(false)
    })
  })

  describe('when at least one item can be rotated', () => {
    let store: ReturnType<DocumentStore>

    beforeEach(() => {
      store = useDocumentStore()

      stubAll(store, ['rotate'])
      store.items = { 'item-id': createItem('item-id', ItemType.Buffer) }
      vi
        .spyOn(store, 'selectedItemIds', 'get')
        .mockReturnValue(new Set(['item-id']))
    })

    it('should include the rotation submenu with a separator', () => {
      const items = buildMenu(createEditSubmenu(useDocumentStore))

      expect(items[8].type).toBe('separator')
      expect(items[9].label).toBe(t('menu.edit.rotate.parent'))
    })

    it('should provide an option to rotate the selected items clockwise', () => {
      const item = buildMenu(createEditSubmenu(useDocumentStore))[9].submenu[0]

      expect(item.label).toBe(t('menu.edit.rotate.clockwise'))
      expect(item.accelerator).toBe('CmdOrCtrl+R')

      item.click()

      expect(store.rotate).toHaveBeenCalledTimes(1)
      expect(store.rotate).toHaveBeenCalledWith(1)
    })

    it('should provide an option to rotate the selected items counter-clockwise', () => {
      const item = buildMenu(createEditSubmenu(useDocumentStore))[9].submenu[1]

      expect(item.label).toBe(t('menu.edit.rotate.counterClockwise'))
      expect(item.accelerator).toBe('CmdOrCtrl+Shift+R')

      item.click()

      expect(store.rotate).toHaveBeenCalledTimes(1)
      expect(store.rotate).toHaveBeenCalledWith(-1)
    })
  })

  describe('when at least one element is selected', () => {
    let store: ReturnType<DocumentStore>

    beforeEach(() => {
      store = useDocumentStore()

      stubAll(store, [
        'incrementZIndex',
        'setZIndex'
      ])
      vi
        .spyOn(store, 'hasSelection', 'get')
        .mockReturnValue(true)
      vi
        .spyOn(store, 'canGroup', 'get')
        .mockReturnValue(true)
      vi
        .spyOn(store, 'canUngroup', 'get')
        .mockReturnValue(true)
    })

    describe('arrange forward submenu', () => {
      it('should include the forward arrangement submenu with a separator', () => {
        const items = buildMenu(createEditSubmenu(useDocumentStore))

        expect(items[8].type).toBe('separator')
        expect(items[9].label).toBe(t('menu.edit.forward.parent'))
      })

      it('should provide an option to bring selected items forward', () => {
        const item = buildMenu(createEditSubmenu(useDocumentStore))[9].submenu[0]

        expect(item.label).toBe(t('menu.edit.forward.bringForward'))
        expect(item.accelerator).toBe('CmdOrCtrl+]')

        item.click()

        expect(store.incrementZIndex).toHaveBeenCalledTimes(1)
        expect(store.incrementZIndex).toHaveBeenCalledWith(1)
      })

      it('should provide an option to bring selected items to the front', () => {
        const item = buildMenu(createEditSubmenu(useDocumentStore))[9].submenu[1]

        expect(item.label).toBe(t('menu.edit.forward.bringToFront'))
        expect(item.accelerator).toBe('CmdOrCtrl+Shift+]')

        item.click()

        expect(store.setZIndex).toHaveBeenCalledTimes(1)
        expect(store.setZIndex).toHaveBeenCalledWith(store.zIndex)
      })
    })

    describe('arrange backward submenu', () => {
      it('should include the backward arrangement submenu', () => {
        const items = buildMenu(createEditSubmenu(useDocumentStore))

        expect(items[10].label).toBe(t('menu.edit.backward.parent'))
      })

      it('should provide an option to send selected items backward', () => {
        const item = buildMenu(createEditSubmenu(useDocumentStore))[10].submenu[0]

        expect(item.label).toBe(t('menu.edit.backward.sendBackward'))
        expect(item.accelerator).toBe('CmdOrCtrl+[')

        item.click()

        expect(store.incrementZIndex).toHaveBeenCalledTimes(1)
        expect(store.incrementZIndex).toHaveBeenCalledWith(-1)
      })

      it('should provide an option to send selected items to the back', () => {
        const item = buildMenu(createEditSubmenu(useDocumentStore))[10].submenu[1]

        expect(item.label).toBe(t('menu.edit.backward.sendToBack'))
        expect(item.accelerator).toBe('CmdOrCtrl+Shift+[')

        item.click()

        expect(store.setZIndex).toHaveBeenCalledTimes(1)
        expect(store.setZIndex).toHaveBeenCalledWith(store.zIndex)
      })
    })

    describe('group submenu', () => {
      it('should include a separator', () => {
        const items = buildMenu(createEditSubmenu(useDocumentStore))

        expect(items[11].type).toBe('separator')
        expect(items[12].label).toBe(t('menu.edit.group.parent'))
      })

      it('should provide an option to group the selected items', () => {
        const item = buildMenu(createEditSubmenu(useDocumentStore))[12].submenu[0]

        expect(item.label).toBe(t('menu.edit.group.group'))
        expect(item.accelerator).toBe('CmdOrCtrl+G')
        expect(item.enabled).toBe(true)

        item.click()

        expect(store.group).toHaveBeenCalledTimes(1)
      })

      it('should disable the option to group when the selected items cannot be grouped together', () => {
        vi
          .spyOn(store, 'canGroup', 'get')
          .mockReturnValue(false)

        const item = buildMenu(createEditSubmenu(useDocumentStore))[12].submenu[0]

        expect(item.enabled).toBe(false)
      })

      it('should provide an option to ungroup the selected groups', () => {
        const item = buildMenu(createEditSubmenu(useDocumentStore))[12].submenu[1]

        expect(item.label).toBe(t('menu.edit.group.ungroup'))
        expect(item.accelerator).toBe('CmdOrCtrl+Shift+G')
        expect(item.enabled).toBe(true)

        item.click()

        expect(store.ungroup).toHaveBeenCalledTimes(1)
      })

      it('should disable the option to ungroup when there is no group among the selection', () => {
        vi
          .spyOn(store, 'canUngroup', 'get')
          .mockReturnValue(false)

        const item = buildMenu(createEditSubmenu(useDocumentStore))[12].submenu[1]

        expect(item.enabled).toBe(false)
      })
    })
  })

  describe('when one of the ports is active', () => {
    let store: ReturnType<DocumentStore>
    const portId = 'port-id'

    beforeEach(() => {
      store = useDocumentStore()
      store.$patch({
        activePortId: portId,
        ports: {
          [portId]: {
            id: portId,
            isMonitored: true
          }
        }
      })

      stubAll(store, [
        'monitorPort',
        'unmonitorPort'
      ])
    })

    it('should include the show in oscilloscope option', () => {
      const item = buildMenu(createEditSubmenu(useDocumentStore)).pop()!

      expect(item.type).toBe('checkbox')
      expect(item.label).toBe(t('menu.edit.showInOscilloscope'))
      expect(item.accelerator).toBe('CmdOrCtrl+.')
    })

    it('should monitor the port when it is not monitored', () => {
      store.ports[portId].isMonitored = false

      const item = buildMenu(createEditSubmenu(useDocumentStore)).pop()!

      item.click()

      expect(item.checked).toBe(false)
      expect(store.monitorPort).toHaveBeenCalledTimes(1)
      expect(store.monitorPort).toHaveBeenCalledWith(portId)
    })

    it('should unmonitor the port when it is already monitored', () => {
      store.ports[portId].isMonitored = true

      const item = buildMenu(createEditSubmenu(useDocumentStore)).pop()!

      item.click()

      expect(item.checked).toBe(true)
      expect(store.unmonitorPort).toHaveBeenCalledTimes(1)
      expect(store.unmonitorPort).toHaveBeenCalledWith(portId)
    })
  })

  it('should include the given submenu', () => {
    const submenu = [{ label: 'Submenu' }]
    const menuWithoutSubmenu = buildMenu(createEditSubmenu(useDocumentStore))
    const menuWithSubmenu = buildMenu(createEditSubmenu(useDocumentStore, submenu))

    expect(menuWithSubmenu).toHaveLength(menuWithoutSubmenu.length + submenu.length + 1) // +1 for separator
  })
})

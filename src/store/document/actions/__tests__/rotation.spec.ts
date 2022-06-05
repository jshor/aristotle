import { setActivePinia, createPinia } from 'pinia'
import PortType from '@/types/enums/PortType'
import ItemType from '@/types/enums/ItemType'
import {
  createGroup,
  createItem,
  createPort,
  stubAll
} from './__helpers__'
import { createDocumentStore } from '../..'

setActivePinia(createPinia())

describe('rotation actions', () => {
  beforeEach(() => jest.restoreAllMocks())

  describe('rotate', () => {
    const store = createDocumentStore('document')()

    beforeEach(() => {
      stubAll(store, [
        'commitState',
        'setItemPosition',
        'setItemBoundingBox',
        'setItemPortPositions',
        'setGroupBoundingBox'
      ])

      store.$reset()
    })

    describe('rotating a group', () => {
      const item1 = createItem('item1', ItemType.LogicGate, {
        groupId: 'group1',
        portIds: ['port1'],
        isSelected: true
      })
      const item2 = createItem('item2', ItemType.LogicGate, {
        groupId: 'group1',
        portIds: ['port2'],
        isSelected: true
      })
      const port1 = createPort('port1', 'item1', PortType.Input)
      const port2 = createPort('port2', 'item2', PortType.Input)
      const group1 = createGroup('group1', ['item1', 'item2'])
      const group2 = createGroup('group2', [])

      beforeEach(() => {
        store.$patch({
          items: { item1, item2 },
          ports: { port1, port2 },
          groups: { group1, group2 }
        })
        store.rotate(1)
      })

      it('should commit the undo-able state', () => {
        expect(store.commitState).toHaveBeenCalled()
      })

      it('should set the rotations of the selected items', () => {
        expect(store.items.item1.rotation).toEqual(2)
        expect(store.items.item2.rotation).toEqual(2)
      })

      it('should set the rotations of the ports of all selected items', () => {
        expect(store.ports.port1.rotation).toEqual(3)
        expect(store.ports.port2.rotation).toEqual(3)
      })

      it('should update the group\'s bounding box for each group rotated', () => {
        expect(store.setGroupBoundingBox).toHaveBeenCalledWith('group1')
      })

      it('should not mutate a group which has none of its elements selected', () => {
        expect(store.setGroupBoundingBox).not.toHaveBeenCalledWith('group2')
      })
    })

    describe('rotating an individual item', () => {
      const item1 = createItem('item1', ItemType.LogicGate, { isSelected: true })

      beforeEach(() => {
        store.$patch({
          items: { item1 }
        })

        store.rotate(1)
      })

      it('should commit the undo-able state', () => {
        expect(store.commitState).toHaveBeenCalled()
      })

      it('should set the rotation of the item', () => {
        expect(store.items.item1.rotation).toEqual(2)
      })
    })
  })
})

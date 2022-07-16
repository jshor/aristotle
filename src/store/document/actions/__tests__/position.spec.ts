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
import rotation from '../../geometry/rotation'

setActivePinia(createPinia())

describe('positioning actions', () => {
  beforeEach(() => jest.restoreAllMocks())

  describe('centerAll', () => {
    const store = createDocumentStore('document')()
    const item1 = createItem('item1', ItemType.InputNode, {
      position: {
        x: 30,
        y: 30
      },
      width: 200,
      height: 200
    })
    const item2 = createItem('item2', ItemType.OutputNode, {
      position: {
        x: 60,
        y: 60
      },
      width: 150,
      height: 150
    })

    beforeEach(() => {
      stubAll(store, [
        'setItemPosition'
      ])

      store.$reset()
      store.canvas = {
        left: -100,
        top: -100,
        right: 500,
        bottom: 500
      }
      store.items = { item1, item2 }
      store.centerAll()
    })

    it('should set the position of each item relative to its centered, parent group position', () => {
      expect(store.setItemPosition).toHaveBeenCalledTimes(2)
      expect(store.setItemPosition).toHaveBeenCalledWith({
        id: 'item1',
        position: {
          x: 330,
          y: 330
        }
      })
      expect(store.setItemPosition).toHaveBeenCalledWith({
        id: 'item2',
        position: {
          x: 360,
          y: 360
        }
      })
    })
  })

  describe('setItemPosition', () => {
    const store = createDocumentStore('document')()
    const position = { x: 210, y: 452 }
    const item1 = createItem('item1', ItemType.LogicGate, {
      portIds: ['port1'],
      position: { x: 10, y: 25 }
    })
    const port1 = createPort('port1', 'item1', PortType.Input, {
      position: { x: 10, y: 25 }
    })

    beforeEach(() => {
      store.$reset()
      store.$patch({
        items: { item1 },
        ports: { port1 }
      })
      store.setItemPosition({ id: 'item1', position })
    })

    it('should update the item\'s position to the new one provided', () => {
      expect(store.items[item1.id].position).toEqual(position)
    })

    it('should move the bounding box of the item to the distance changed', () => {
      expect(store.items[item1.id].boundingBox).toEqual({
        left: item1.boundingBox.left + (position.x - item1.position.x),
        top: item1.boundingBox.top + (position.y - item1.position.y),
        right: item1.boundingBox.left + (position.x - item1.position.x),
        bottom: item1.boundingBox.bottom + (position.y - item1.position.y)
      })
    })

    it('should update the position of the ports according to the distance changed', () => {
      expect(store.ports[port1.id].position).toEqual({
        x: port1.position.x + (position.x - item1.position.x),
        y: port1.position.y + (position.y - item1.position.y)
      })
    })
  })

  describe('moveSelectionPosition', () => {
    const store = createDocumentStore('document')()

    beforeEach(() => {
      store.$reset()

      stubAll(store, [
        'setSelectionPosition',
        'commitState'
      ])
    })

    describe('when an item is selected', () => {
      const position: Point = { x: 7, y: 49 }
      const delta: Point = { x: 7, y: 49 }
      const item1 = createItem('item1', ItemType.LogicGate, { position, isSelected: true })

      beforeEach(() => {
        store.$patch({
          items: { item1 },
          selectedItemIds: ['item1', 'item2']
        })
        store.moveSelectionPosition(delta)
      })

      it('should commit the current state', () => {
        expect(store.commitState).toHaveBeenNthCalledWith(1)
      })

      it('should move the first selected item according to the delta provided', () => {
        expect(store.setSelectionPosition).toHaveBeenCalledWith({
          id: 'item1',
          position: {
            x: item1.position.x + delta.x,
            y: item1.position.y + delta.y
          }
        })
      })
    })

    describe('when nothing is selected', () => {
      it('should not dispatch anything', () => {
        store.moveSelectionPosition({ x: 7, y: 49 })

        expect(store.commitState).not.toHaveBeenCalled()
        expect(store.setSelectionPosition).not.toHaveBeenCalled()
      })
    })
  })

  describe('setSelectionPosition', () => {
    const store = createDocumentStore('document')()
    const oldPosition: Point = { x: 10, y: 24 }
    const position: Point = { x: 7, y: 49 }
    const delta: Point = {
      x: position.x - oldPosition.x,
      y: position.y - oldPosition.y
    }
    const item1 = createItem('item1', ItemType.LogicGate, { position: oldPosition, isSelected: true })
    const item2 = createItem('item2', ItemType.Freeport, { groupId: 'group1', isSelected: true })
    const group1 = createGroup('group1', ['item1', 'item2'])

    beforeEach(() => {
      store.$reset()
      store.$patch({
        items: { item1, item2 },
        groups: { group1 },
      })

      stubAll(store, [
        'setItemPosition'
      ])
    })

    it('should move only the freeport if it is the reference item', () => {
      const newPosition: Point = {
        x: 10,
        y: 22
      }

      store.$patch({
        selectedItemIds: ['item1', 'item2']
      })
      store.setSelectionPosition({
        id: 'item2',
        position: newPosition
      })

      expect(store.setItemPosition).toHaveBeenCalledTimes(1)
      expect(store.setItemPosition).toHaveBeenCalledWith({
        id: 'item2',
        position: {
          x: item2.position.x + newPosition.x,
          y: item2.position.y + newPosition.y
        }
      })
    })

    it('should set the position of each item according to the delta moved', () => {
      store.$patch({
        selectedItemIds: ['item1', 'item2']
      })
      store.setSelectionPosition({
        id: 'item1',
        position
      })

      expect(store.setItemPosition).toHaveBeenCalledTimes(2)
      expect(store.setItemPosition).toHaveBeenCalledWith({
        id: 'item1',
        position: {
          x: item1.position.x + delta.x,
          y: item1.position.y + delta.y
        }
      })
      expect(store.setItemPosition).toHaveBeenCalledWith({
        id: 'item2',
        position: {
          x: item2.position.x + delta.x,
          y: item2.position.y + delta.y
        }
      })
    })
  })

})

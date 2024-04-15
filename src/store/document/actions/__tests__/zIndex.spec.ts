import { setActivePinia, createPinia } from 'pinia'
import ItemType from '@/types/enums/ItemType'
import {
  createConnection,
  createItem,
  stubAll
} from './__helpers__'
import { createDocumentStore } from '../..'

setActivePinia(createPinia())

describe('z-index actions', () => {
  beforeEach(() => vi.restoreAllMocks())

  describe('sendBackward', () => {
    const store = createDocumentStore('document')()

    beforeEach(() => {
      stubAll(store, [
        'commitState',
        'incrementZIndex'
      ])

      store.sendBackward()
    })

    it('should commit the current state', () => {
      expect(store.commitState).toHaveBeenCalledTimes(1)
    })

    it('should invoke incrementZIndex() with -1', () => {
      expect(store.incrementZIndex).toHaveBeenCalledTimes(1)
      expect(store.incrementZIndex).toHaveBeenCalledWith(-1)
    })
  })

  describe('bringForward', () => {
    const store = createDocumentStore('document')()

    beforeEach(() => {
      stubAll(store, [
        'commitState',
        'incrementZIndex'
      ])

      store.bringForward()
    })

    it('should commit the current state', () => {
      expect(store.commitState).toHaveBeenCalledTimes(1)
    })

    it('should invoke incrementZIndex() with -1', () => {
      expect(store.incrementZIndex).toHaveBeenCalledTimes(1)
      expect(store.incrementZIndex).toHaveBeenCalledWith(1)
    })
  })

  describe('sendToBack', () => {
    const store = createDocumentStore('document')()

    beforeEach(() => {
      stubAll(store, [
        'commitState',
        'setZIndex'
      ])

      store.sendToBack()
    })

    it('should commit the current state', () => {
      expect(store.commitState).toHaveBeenCalledTimes(1)
    })

    it('should invoke setZIndex() with 1', () => {
      expect(store.setZIndex).toHaveBeenCalledTimes(1)
      expect(store.setZIndex).toHaveBeenCalledWith(1)
    })
  })

  describe('bringToFront', () => {
    const store = createDocumentStore('document')()
    const zIndex = 20

    beforeEach(() => {
      stubAll(store, [
        'commitState',
        'setZIndex'
      ])

      store.zIndex = zIndex
      store.bringToFront()
    })

    it('should commit the current state', () => {
      expect(store.commitState).toHaveBeenCalledTimes(1)
    })

    it('should invoke setZIndex() with the current maximum z-index value', () => {
      expect(store.setZIndex).toHaveBeenCalledTimes(1)
      expect(store.setZIndex).toHaveBeenCalledWith(zIndex)
    })
  })

  describe('incrementZIndex', () => {
    const store = createDocumentStore('document')()

    beforeEach(() => {
      store.$reset()
      store.$patch({
        items: {
          item1: createItem('item1', ItemType.InputNode, { zIndex: 1 }),
          item2: createItem('item2', ItemType.InputNode, { zIndex: 3 }),
          item3: createItem('item3', ItemType.InputNode, { zIndex: 5 }),
          item4: createItem('item4', ItemType.InputNode, { zIndex: 7 })
        },
        connections: {
          connection1: createConnection('connection1', 'port1', 'port2', { zIndex: 2 }),
          connection2: createConnection('connection2', 'port3', 'port4', { zIndex: 4 }),
          connection3: createConnection('connection3', 'port6', 'port5', { zIndex: 6 }),
          connection4: createConnection('connection4', 'port7', 'port8', { zIndex: 8 })
        }
      })
    })

    it('should decrement selected items backward', () => {
      store.items.item2.isSelected = true
      store.items.item4.isSelected = true
      store.connections.connection3.isSelected = true

      store.incrementZIndex(-1)

      expect(store.items.item1.zIndex).toEqual(1)
      expect(store.items.item2.zIndex).toEqual(2)
      expect(store.items.item3.zIndex).toEqual(7)
      expect(store.items.item4.zIndex).toEqual(6)
      expect(store.connections.connection1.zIndex).toEqual(3)
      expect(store.connections.connection2.zIndex).toEqual(4)
      expect(store.connections.connection3.zIndex).toEqual(5)
      expect(store.connections.connection4.zIndex).toEqual(8)
    })

    it('should increment selected items forward', () => {
      store.items.item2.isSelected = true
      store.items.item4.isSelected = true
      store.connections.connection3.isSelected = true

      store.incrementZIndex(1)

      expect(store.items.item1.zIndex).toEqual(1)
      expect(store.items.item2.zIndex).toEqual(4)
      expect(store.items.item3.zIndex).toEqual(5)
      expect(store.items.item4.zIndex).toEqual(8)
      expect(store.connections.connection1.zIndex).toEqual(2)
      expect(store.connections.connection2.zIndex).toEqual(3)
      expect(store.connections.connection3.zIndex).toEqual(7)
      expect(store.connections.connection4.zIndex).toEqual(6)
    })

    it('should not increment a selected item\'s z-index if it collides with the next item\'s movement', () => {
      store.$reset()
      store.$patch({
        items: {
          item1: createItem('item1', ItemType.InputNode, {
            zIndex: 1,
            isSelected: true
          }),
          item2: createItem('item2', ItemType.InputNode, {
            zIndex: 2,
            isSelected: true
          })
        }
      })
      store.incrementZIndex(1)

      expect(store.items.item1.zIndex).toEqual(1)
      expect(store.items.item2.zIndex).toEqual(2)
    })

    it('should not allow sibling items to collide while moving forward', () => {
      store.items.item3.isSelected = true
      store.connections.connection3.isSelected = true

      store.incrementZIndex(1)

      expect(store.items.item3.zIndex).toEqual(6)
      expect(store.connections.connection3.zIndex).toEqual(7)
    })

    it('should not allow sibling items to collide while moving backward', () => {
      store.items.item3.isSelected = true
      store.connections.connection3.isSelected = true

      store.incrementZIndex(-1)

      expect(store.items.item3.zIndex).toEqual(4)
      expect(store.connections.connection3.zIndex).toEqual(5)
    })

    it('should not allow an item already at the back to decrement further', () => {
      store.items.item1.isSelected = true

      store.incrementZIndex(-1)

      expect(store.items.item1.zIndex).toEqual(1)
    })

    it('should not allow an item already at the front to increment further', () => {
      store.connections.connection4.isSelected = true

      store.incrementZIndex(1)

      expect(store.connections.connection4.zIndex).toEqual(8)
    })
  })

  describe('setZIndex', () => {
    const store = createDocumentStore('document')()

    beforeEach(() => {
      store.$reset()
      store.$patch({
        items: {
          item1: createItem('item1', ItemType.InputNode, { zIndex: 1 }),
          item2: createItem('item2', ItemType.InputNode, { zIndex: 3 }),
          item3: createItem('item3', ItemType.InputNode, { zIndex: 5 }),
          item4: createItem('item4', ItemType.InputNode, { zIndex: 7 })
        },
        connections: {
          connection1: createConnection('connection1', 'port1', 'port2', { zIndex: 2 }),
          connection2: createConnection('connection2', 'port3', 'port4', { zIndex: 4 }),
          connection3: createConnection('connection3', 'port6', 'port5', { zIndex: 6 }),
          connection4: createConnection('connection4', 'port7', 'port8', { zIndex: 8 })
        }
      })
    })

    it('should move all items together to the given zIndex value', () => {
      store.items.item2.isSelected = true
      store.items.item4.isSelected = true
      store.connections.connection3.isSelected = true

      store.setZIndex(8)

      expect(store.items.item1.zIndex).toEqual(1)
      expect(store.items.item3.zIndex).toEqual(4)
      expect(store.connections.connection1.zIndex).toEqual(2)
      expect(store.connections.connection2.zIndex).toEqual(3)
      expect(store.connections.connection4.zIndex).toEqual(5)
      expect(store.items.item2.zIndex).toEqual(6)
      expect(store.connections.connection3.zIndex).toEqual(7)
      expect(store.items.item4.zIndex).toEqual(8)
    })
  })
})

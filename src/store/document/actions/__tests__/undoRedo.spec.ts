import { setActivePinia, createPinia } from 'pinia'
import PortType from '@/types/enums/PortType'
import ItemType from '@/types/enums/ItemType'
import {
  createConnection,
  createGroup,
  createIntegratedCircuit,
  createItem,
  createPort,
  createSerializedState,
  stubAll
} from './__helpers__'
import { createDocumentStore } from '../..'

setActivePinia(createPinia())

describe('undo/redo actions', () => {
  afterEach(() => jest.resetAllMocks())

  describe('undo', () => {
    const store = createDocumentStore('document')()

    beforeEach(() => {
      store.$reset()

      stubAll(store, [
        'applySerializedState'
      ])
    })

    describe('when an available state exists in the undo stack', () => {
      const undoState = createSerializedState()

      beforeEach(() => {
        store.$patch({
          undoStack: [undoState]
        })
        store.undo()
      })

      it('should commit the state to the redo stack', () => {
        expect(store.redoStack).toHaveLength(1)
      })

      it('should apply the undo-able state on the top of the undo stack', () => {
        expect(store.applySerializedState).toHaveBeenCalledTimes(1)
        expect(store.applySerializedState).toHaveBeenCalledWith(undoState)
      })

      it('should remove the redo-able state from the top of the redo stack', () => {
        expect(store.undoStack).toHaveLength(0)
      })
    })

    it('should not commit anything to the store if the undo stack is empty', () => {
      store.$reset()
      store.undo()

      expect(store.redoStack).toHaveLength(0)
      expect(store.applySerializedState).not.toHaveBeenCalled()
    })
  })

  describe('redo', () => {
    const store = createDocumentStore('document')()

    beforeEach(() => {
      store.$reset()

      stubAll(store, [
        'applySerializedState'
      ])
    })

    describe('when an available state exists in the undo stack', () => {
      const redoState = createSerializedState()

      beforeEach(() => {
        store.$patch({
          redoStack: [redoState]
        })
        store.redo()
      })

      it('should commit the state back to the undo stack', () => {
        expect(store.undoStack).toHaveLength(1)
      })

      it('should apply the undo-able state on the top of the redo stack', () => {
        expect(store.applySerializedState).toHaveBeenCalledWith(redoState)
      })

      it('should remove the redo-able state from the top of the redo stack', () => {
        expect(store.redoStack).toHaveLength(0)
      })
    })

    it('should not commit anything to the store if the redo stack is empty', () => {
      store.redo()

      expect(store.undoStack).toHaveLength(0)
      expect(store.applySerializedState).not.toHaveBeenCalled()
    })
  })

  describe('cacheState', () => {
    it('should set the cached state to a stringified object containing the connections, items, ports, and groups', () => {
      const store = createDocumentStore('document')()

      store.cacheState()

      expect(store.cachedState).toEqual(JSON.stringify({
        connections: store.connections,
        items: store.items,
        ports: store.ports,
        groups: store.groups
      }))
    })
  })

  describe('commitCachedState', () => {
    describe('when there is a state cached', () => {
      const store = createDocumentStore('document')()
      const cachedState = createSerializedState()

      beforeEach(() => {
        store.$reset()
        store.$patch({
          cachedState,
          redoStack: [
            createSerializedState(),
            createSerializedState()
          ]
        })

        store.commitCachedState()
      })

      it('should push the cached state into the undo stack', () => {
        expect(store.undoStack[store.undoStack.length - 1]).toEqual(cachedState)
      })

      it('should clear the current cached state', () => {
        expect(store.cachedState).toBeNull()
      })

      it('should clear the redo stack', () => {
        expect(store.redoStack).toHaveLength(0)
      })
    })

    it('should not mutate the undo stack if there is no cached state', () => {
      const store = createDocumentStore('document')()

      store.$reset()
      store.$patch({ cachedState: null })
      store.commitCachedState()

      expect(store.undoStack).toHaveLength(0)
    })
  })

  describe('applyDeserializedState', () => {
    const store = createDocumentStore('document')()

    const addedItem1 = createItem('addedItem1', ItemType.InputNode)
    const addedItem2 = createItem('addedItem2', ItemType.InputNode)
    const addedIc = createItem('addedIc', ItemType.IntegratedCircuit, {
      integratedCircuit: createIntegratedCircuit()
    })
    const addedPort1 = createPort('addedPort1', 'addedItem1', PortType.Output)
    const addedPort2 = createPort('addedPort2', 'addedItem2', PortType.Input)
    const addedConnection = createConnection('addedConnection', 'addedPort1', 'addedPort2')
    const addedGroup = createGroup('addedGroup', [addedItem1.id, addedItem2.id])

    const removedItem1 = createItem('removedItem1', ItemType.InputNode)
    const removedItem2 = createItem('removedItem2', ItemType.InputNode)
    const removedPort1 = createPort('removedPort1', 'removedItem1', PortType.Output)
    const removedPort2 = createPort('removedPort2', 'removedItem2', PortType.Input)
    const removedConnection = createConnection('removedConnection', 'removedPort1', 'removedPort2')

    beforeEach(() => {
      store.$reset()
      store.$patch({
        items: { removedItem1, removedItem2 },
        ports: { removedPort1, removedPort2 },
        connections: { removedConnection },
        groups: {}
      })

      jest
        .spyOn(window, 'requestAnimationFrame')
        .mockImplementation(cb => {
          cb(0)
          return 0
        })

      stubAll(store, [
        'addItem',
        'deselectAll',
        'connect',
        'disconnectById',
        'removeElement',
        'setItemBoundingBox',
        'setGroupBoundingBox'
      ])

      store.applyDeserializedState({
        items: { addedItem1, addedItem2, addedIc },
        ports: { addedPort1, addedPort2 },
        connections: { addedConnection },
        groups: { addedGroup }
      })
    })

    it('should remove the items from the old state that are not present in the new one', () => {
      expect(store.items).toHaveProperty('addedItem1')
      expect(store.items).toHaveProperty('addedItem2')
      expect(store.items.addedItem1).toEqual(addedItem1)
      expect(store.items.addedItem2).toEqual(addedItem2)
      expect(store.items.addedIc).toEqual(addedIc)
    })

    it('should commit removeElement for each item that will be lost between states', () => {
      expect(store.removeElement).toHaveBeenCalledTimes(2)
      expect(store.removeElement).toHaveBeenCalledWith('removedItem1')
      expect(store.removeElement).toHaveBeenCalledWith('removedItem2')
    })

    it('should commit disconnect for each connection that will be lost between states', () => {
      expect(store.disconnectById).toHaveBeenCalledTimes(1)
      expect(store.disconnectById).toHaveBeenCalledWith('removedConnection')
    })

    it('should commit connect for each connection that will be gained between states', () => {
      expect(store.connect).toHaveBeenCalledWith(addedConnection)
    })

    it('should set the group and its bounding box', () => {
      expect(store.groups).toHaveProperty(addedGroup.id)
      expect(store.groups.addedGroup).toEqual(addedGroup)
      expect(store.setGroupBoundingBox).toHaveBeenCalledTimes(1)
      expect(store.setGroupBoundingBox).toHaveBeenCalledWith(addedGroup.id)
    })
  })

  describe('applySerializedState', () => {
    it('should call applyDeserializedState()', () => {
      jest.restoreAllMocks()

      const store = createDocumentStore('document')()
      const state = {
        items: {},
        connections: {},
        ports: {},
        groups: {}
      }

      stubAll(store, [
        'applyDeserializedState'
      ])

      store.applySerializedState(JSON.stringify(state))

      expect(store.applyDeserializedState).toHaveBeenCalledTimes(1)
      expect(store.applyDeserializedState).toHaveBeenCalledWith(state)
    })
  })

  describe('commitState', () => {
    const store = createDocumentStore('document')()

    it('should cache the current state', () => {
      stubAll(store, [
        'cacheState',
        'commitCachedState'
      ])

      store.commitState()

      expect(store.cacheState).toHaveBeenCalledTimes(1)
      expect(store.commitCachedState).toHaveBeenCalledTimes(1)
    })
  })
})

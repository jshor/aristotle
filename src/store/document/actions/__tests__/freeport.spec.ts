import { setActivePinia, createPinia } from 'pinia'
import Direction from '@/types/enums/Direction'
import PortType from '@/types/enums/PortType'
import boundaries from '../../geometry/boundaries'
import ItemType from '@/types/enums/ItemType'
import {
  createConnection,
  createItem,
  createPort,
  stubAll
} from './__helpers__'
import { createDocumentStore } from '../..'
import ItemSubtype from '@/types/enums/ItemSubtype'

setActivePinia(createPinia())

describe('freeport actions', () => {
  beforeEach(() => jest.restoreAllMocks())

  describe('removeFreeport', () => {
    const store = createDocumentStore('document')()

    beforeEach(() => {
      store.$reset()

      stubAll(store, [
        'disconnect',
        'connect',
        'removeElement'
      ])
    })

    describe('when a connection is connected at both the target and the source', () => {
      beforeEach(() => {
        store.$patch({
          connections: {
            'connection1': createConnection('connection1', 'port1', 'port2'),
            'connection2': createConnection('connection2', 'port3', 'port4')
          },
          ports: {
            'port1': createPort('port1', 'item1', PortType.Output),
            'port2': createPort('port2', 'freeport', PortType.Input, { isFreeport: true }),
            'port3': createPort('port3', 'freeport', PortType.Output, { isFreeport: true }),
            'port4': createPort('port4', 'item2', PortType.Input)
          },
          items: {
            'item1': createItem('item1', ItemType.InputNode, { portIds: ['port1'] }),
            'item2': createItem('item2', ItemType.OutputNode, { portIds: ['port4'] }),
            'freeport': createItem('freeport', ItemType.Freeport, { portIds: ['port2', 'port3'] })
          }
        })
        store.removeFreeport('freeport')
      })

      it('should disconnect the freeport from its source', () => {
        expect(store.disconnect).toHaveBeenCalledWith({ source: 'port1', target: 'port2' })
      })

      it('should disconnect the freeport from its target', () => {
        expect(store.disconnect).toHaveBeenCalledWith({ source: 'port3', target: 'port4' })
      })

      it('should connect the freeport\'s original source to its original target', () => {
        expect(store.connect).toHaveBeenCalledWith({ source: 'port1', target: 'port4' })
      })

      it('should remove the item from the document', () => {
        expect(store.removeElement).toHaveBeenCalledWith('freeport')
      })
    })

    describe('when a connection is a freeport being dragged from a source port', () => {
      beforeEach(() => {
        store.$patch({
          connections: {
            'connection1': createConnection('connection1', 'port1', 'port2')
          },
          ports: {
            'port1': createPort('port1', 'item1', PortType.Output),
            'port2': createPort('port2', 'freeport', PortType.Input, { isFreeport: true }),
            'port3': createPort('port3', 'freeport', PortType.Output, { isFreeport: true })
          },
          items: {
            'item1': createItem('item1', ItemType.InputNode, { portIds: ['port1'] }),
            'freeport': createItem('freeport', ItemType.Freeport, { portIds: ['port2', 'port3'] })
          }
        })
        store.removeFreeport('freeport')
      })

      it('should only disconnect the freeport from its source', () => {
        expect(store.disconnect).toHaveBeenCalledWith({ source: 'port1', target: 'port2' })
      })

      it('should remove the item from the document', () => {
        expect(store.removeElement).toHaveBeenCalledWith('freeport')
      })
    })

    describe('when a connection is a freeport being dragged from a source port', () => {
      beforeEach(() => {
        store.$patch({
          connections: {
            'connection2': createConnection('connection2', 'port3', 'port4')
          },
          ports: {
            'port2': createPort('port2', 'freeport', PortType.Input, { isFreeport: true }),
            'port3': createPort('port3', 'freeport', PortType.Output, { isFreeport: true }),
            'port4': createPort('port4', 'item2', PortType.Input)
          },
          items: {
            'freeport': createItem('freeport', ItemType.Freeport, { portIds: ['port2', 'port3'] }),
            'item2': createItem('item2', ItemType.OutputNode, { portIds: ['port4'] })
          }
        })
        store.removeFreeport('freeport')
      })

      it('should only disconnect the freeport from its target', () => {
        expect(store.disconnect).toHaveBeenCalledWith({ source: 'port3', target: 'port4' })
      })

      it('should remove the item from the document', () => {
        expect(store.removeElement).toHaveBeenCalledWith('freeport')
      })
    })
  })

  describe('createFreeport', () => {
    const store = createDocumentStore('document')()

    const itemId = 'freeport'
    const sourceId = 'source-port'
    const targetId = 'target-port'
    const connectionChainId = 'connection-chain'
    const inputPortId = 'freeport-input-port'
    const outputPortId = 'freeport-output-port'
    const position: Point = { x: 0, y: 0 }

    beforeEach(() => {
      store.$reset()

      stubAll(store, [
        'addFreeportItem',
        'disconnect',
        'connect',
        'commitState',
        'setItemBoundingBox',
        'setSelectionState',
        'deselectAll',
        'createConnection'
      ])
      stubAll(store.simulation, [
        'addConnection',
        'removeConnection'
      ])
    })

    it('should not create a new freeport if an item having the same ID already exists', () => {
      store.$patch({
        items: {
          [itemId]: createItem(itemId, ItemType.Freeport)
        }
      })
      store.createFreeport({
        itemId,
        outputPortId,
        inputPortId
      })

      expect(store.connect).not.toHaveBeenCalled()
      expect(store.disconnect).not.toHaveBeenCalled()
      expect(store.addFreeportItem).not.toHaveBeenCalled()
    })

    describe('when this freeport is a joint between two connection segments', () => {
      const data = {
        itemId,
        sourceId,
        targetId,
        inputPortId,
        outputPortId,
        connectionChainId,
        position
      }

      beforeEach(() => {
        store.createFreeport(data)
      })

      it('should commit the current state to be undo-able', () => {
        expect(store.commitState).toHaveBeenCalled()
      })

      it('should deselect all items', () => {
        expect(store.deselectAll).toHaveBeenCalled()
      })

      it('should create the new freeport', () => {
        expect(store.addFreeportItem).toHaveBeenCalledWith({
          ...data,
          position: {
            x: 0,
            y: 0
          }
        })
        expect(store.setItemBoundingBox).toHaveBeenCalledWith(itemId)
        expect(store.activeFreeportId).toEqual(itemId)
      })
    })

    describe('when this freeport is a port being dragged from an output port', () => {
      const data = {
        itemId,
        sourceId,
        inputPortId,
        outputPortId: '',
        connectionChainId,
        position
      }

      beforeEach(() => {
        store.createFreeport(data)
      })

      it('should not commit the current state to be undo-able', () => {
        expect(store.commitState).not.toHaveBeenCalled()
      })

      it('should deselect all items', () => {
        expect(store.deselectAll).toHaveBeenCalled()
      })

      it('should create the new freeport', () => {
        expect(store.addFreeportItem).toHaveBeenCalledWith(data)
        expect(store.setItemBoundingBox).toHaveBeenCalledWith(itemId)
        expect(store.activeFreeportId).toEqual(itemId)
      })

      it('should not disconnect any connections', () => {
        expect(store.disconnect).not.toHaveBeenCalledWith(expect.any(Object))
      })

      it('should not reconnect the target port to anything', () => {
        expect(store.connect).not.toHaveBeenCalledWith({
          source: expect.any(String),
          target: targetId,
          connectionChainId
        })
      })
    })

    describe('when this freeport is a port being dragged from an input port', () => {
      const data = {
        itemId,
        targetId,
        inputPortId,
        outputPortId,
        connectionChainId,
        position
      }

      beforeEach(() => {
        store.createFreeport(data)
      })

      it('should not commit the current state to be undo-able', () => {
        expect(store.commitState).not.toHaveBeenCalled()
      })

      it('should deselect all items', () => {
        expect(store.deselectAll).toHaveBeenCalled()
      })

      it('should create the new freeport', () => {
        expect(store.addFreeportItem).toHaveBeenCalledWith(data)
        expect(store.setItemBoundingBox).toHaveBeenCalledWith(itemId)
        expect(store.activeFreeportId).toEqual(itemId)
      })

      it('should not disconnect any connections', () => {
        expect(store.disconnect).not.toHaveBeenCalledWith(expect.any(Object))
      })

      it('should not reconnect the source port to anything', () => {
        expect(store.connect).not.toHaveBeenCalledWith({
          source: sourceId,
          target: expect.any(String),
          connectionChainId
        })
      })
    })
  })

  describe('connectFreeport', () => {
    const store = createDocumentStore('document')()

    beforeEach(() => {
      stubAll(store, [
        'removeElement',
        'disconnect',
        'connect',
        'commitState'
      ])

      store.$reset()
    })

    describe('when there is a port in the neighborhood', () => {
      const sourceId = 'source-id'
      const targetId = 'target-id'
      const portId = 'port-id'
      const newPortId = 'new-port-id'

      const patch = (connectablePortIds: string[] = []) => store.$patch({
        ports: {
          [sourceId]: createPort(sourceId, '2', PortType.Input),
          [targetId]: createPort(sourceId, '2', PortType.Output),
          [newPortId]: createPort(newPortId, '2', PortType.Output),
          [portId]: createPort(portId, '1', PortType.Input)
        },
        connectablePortIds
      })

      beforeEach(() => {
        store.$reset()

        jest
          .spyOn(boundaries, 'isInNeighborhood')
          .mockReturnValue(true)
      })

      it('should not connect the port to itself or to one that is not in the predefined set of connectable ports', () => {
        patch()

        store.connectFreeport({ sourceId, portId })

        expect(store.connect).not.toHaveBeenCalled()
      })

      describe('when a connection is being made from an output port (acting as a source)', () => {
        beforeEach(() => {
          patch([newPortId])

          store.connectFreeport({ sourceId, portId })
        })

        it('should disconnect the temporary dragged port from the source', () => {
          expect(store.disconnect).toHaveBeenCalledWith({
            source: sourceId,
            target: portId
          })
        })

        it('should connect the the source to the discovered target', () => {
          expect(store.connect).toHaveBeenCalledWith({
            source: sourceId,
            target: newPortId
          })
        })
      })

      describe('when a connection is being made from an input port (acting as a target) to a receiving output port', () => {
        beforeEach(() => {
          patch([newPortId])

          store.connectFreeport({ targetId, portId })
        })

        it('should disconnect the temporary dragged port from the old target', () => {
          expect(store.disconnect).toHaveBeenCalledWith({
            source: portId,
            target: targetId
          })
        })

        it('should connect the the source to the new discovered source', () => {
          expect(store.connect).toHaveBeenCalledWith({
            source: newPortId,
            target: targetId
          })
        })
      })

      describe('when any connectable port is discovered', () => {
        it('should clear the list of connectable port IDs', () => {
          patch([newPortId])

          store.connectFreeport({ sourceId, portId })

          expect(store.connectablePortIds).toEqual([])
        })
      })

      describe('when an item owns the given port', () => {
        const itemId = 'item-id'
        const otherItemId = 'other-item-id'

        beforeEach(() => {
          patch([newPortId])

          store.$patch({
            items: {
              [itemId]: createItem(itemId, ItemType.Freeport, { portIds: [portId] }),
              [otherItemId]: createItem(otherItemId, ItemType.Freeport, { portIds: [sourceId, targetId] })
            }
          })
          store.connectFreeport({ sourceId, portId })
        })

        it('should remove the item', () => {
          expect(store.removeElement).toHaveBeenCalledWith(itemId)
        })

        it('should not remove any other items', () => {
          expect(store.removeElement).not.toHaveBeenCalledWith(otherItemId)
        })
      })
    })
  })

  describe('addFreeportItem', () => {
    const store = createDocumentStore('document')()
    const itemId = 'item-id'
    const inputPortId = 'input-port-id'
    const outputPortId = 'output-port-id'
    const value = 1

    beforeEach(() => {
      store.$reset()
      store.$patch({
        items: {
          [itemId]: createItem(itemId, ItemType.InputNode)
        }
      })

      jest
        .spyOn(store.simulation, 'addNode')
        .mockImplementation(jest.fn())
    })

    it('should add an input port if its ID is defined', () => {
      store.addFreeportItem({ itemId, inputPortId })

      expect(store.ports).toHaveProperty(inputPortId)
      expect(store.ports[inputPortId]).toEqual({
        id: inputPortId,
        type: PortType.Input,
        connectedPortIds: [],
        name: expect.any(String),
        elementId: itemId,
        orientation: Direction.Right,
        isFreeport: true,
        isMonitored: false,
        hue: 0,
        position: { x: 0, y: 0 },
        rotation: 0,
        value: 0
      })
    })

    it('should add an output port if its ID is defined', () => {
      store.addFreeportItem({ itemId, outputPortId })

      expect(store.ports).toHaveProperty(outputPortId)
      expect(store.ports[outputPortId]).toEqual({
        id: outputPortId,
        connectedPortIds: [],
        name: expect.any(String),
        type: PortType.Output,
        elementId: itemId,
        orientation: Direction.Left,
        isFreeport: true,
        isMonitored: false,
        hue: 0,
        position: { x: 0, y: 0 },
        rotation: 0,
        value: 0
      })
    })

    it('should add a new freeport item with the provided port IDs', () => {
      store.addFreeportItem({ itemId, inputPortId, outputPortId, value })

      expect(store.items).toHaveProperty(itemId)
      expect(store.items[itemId]).toEqual({
        id: itemId,
        name: '',
        type: ItemType.Freeport,
        subtype: ItemSubtype.None,
        portIds: [outputPortId, inputPortId],
        position: { x: 0, y: 0 },
        rotation: 0,
        boundingBox: {
          left: 0,
          top: 0,
          right: 1,
          bottom: 1
        },
        properties: {},
        isSelected: false,
        groupId: null,
        zIndex: 1,
        width: 1,
        height: 1
      })
    })

    it('should add the freeport to the circuit with its evaluation forced', () => {
      store.addFreeportItem({ itemId, inputPortId, outputPortId, value })

      expect(store.simulation.addNode).toHaveBeenCalledTimes(1)
      expect(store.simulation.addNode).toHaveBeenCalledWith(store.items[itemId], store.ports, true)
    })
  })
})

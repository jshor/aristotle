import { setActivePinia, createPinia } from 'pinia'
import PortType from '@/types/enums/PortType'
import boundaries from '../../geometry/boundaries'
import ItemType from '@/types/enums/ItemType'
import {
  createConnection,
  createGroup,
  createIntegratedCircuit,
  createItem,
  createPort,
  stubAll
} from './__helpers__'
import { createDocumentStore } from '../..'

setActivePinia(createPinia())

describe('selection actions', () => {
  beforeEach(() => jest.restoreAllMocks())

  describe('deselectItem', () => {
    it('should deselect the given item', () => {
      const store = createDocumentStore('document')()

      jest
        .spyOn(store, 'setSelectionState')
        .mockImplementation(jest.fn())

      store.deselectItem('item1')

      expect(store.setSelectionState).toHaveBeenCalledTimes(1)
      expect(store.setSelectionState).toHaveBeenCalledWith({
        id: 'item1',
        value: false
      })
    })
  })

  describe('selectItem', () => {
    const store = createDocumentStore('document')()
    const item1 = createItem('item1', ItemType.LogicGate)

    beforeEach(() => {
      store.$reset()
      store.items = { item1 }

      stubAll(store, [
        'deselectAll',
        'setSelectionState'
      ])
    })

    it('should select the given item', () => {
      store.selectItem('item1')

      expect(store.setSelectionState).toHaveBeenCalledTimes(1)
      expect(store.setSelectionState).toHaveBeenCalledWith({
        id: 'item1',
        value: true
      })
    })

    it('should deselect all other items when keepSelection is false', () => {
      store.selectItem('item1')

      expect(store.deselectAll).toHaveBeenCalledTimes(1)
    })

    it('should not deselect anything when keepSelection is true', () => {
      store.selectItem('item1', true)

      expect(store.deselectAll).not.toHaveBeenCalled()
    })
  })

  describe('deselectAll', () => {
    const store = createDocumentStore('document')()

    beforeEach(() => {
      const item1 = createItem('item1', ItemType.Buffer, { isSelected: true })
      const item2 = createItem('item2', ItemType.Buffer, { isSelected: true })
      const connection1 = createConnection('connection1', 'port1', 'port2', { isSelected: true })
      const connection2 = createConnection('connection2', 'port3', 'port4', { isSelected: true })

      stubAll(store, [
        'clearStatelessInfo'
      ])

      store.$reset()
      store.$patch({
        items: { item1, item2 },
        connections: { connection1, connection2 }
      })
      store.deselectAll()
    })

    it('should clear all stateless info', () => {
      store.deselectAll()

      expect(store.clearStatelessInfo).toHaveBeenCalled()
    })

    it('should set isSelected to false for all connections', () => {
      expect(store.connections.connection1.isSelected).toBe(false)
      expect(store.connections.connection2.isSelected).toBe(false)
    })

    it('should set isSelected to false for all items', () => {
      expect(store.items.item2.isSelected).toBe(false)
      expect(store.items.item2.isSelected).toBe(false)
    })

    it('should empty the lists of selected connection and item ids', () => {
      expect(store.selectedItemIds).toHaveLength(0)
      expect(store.selectedConnectionIds).toHaveLength(0)
    })
  })

  describe('selectAll', () => {
    const store = createDocumentStore('document')()

    beforeEach(() => {
      const item1 = createItem('item1', ItemType.Buffer, { isSelected: true })
      const item2 = createItem('item2', ItemType.Buffer, { isSelected: true })
      const connection1 = createConnection('connection1', 'port1', 'port2', { isSelected: true })
      const connection2 = createConnection('connection2', 'port3', 'port4', { isSelected: true })

      store.$reset()
      store.$patch({
        items: { item1, item2 },
        connections: { connection1, connection2 }
      })
      store.selectAll()
    })

    it('should set isSelected to true for all connections', () => {
      expect(store.connections.connection1.isSelected).toBe(true)
      expect(store.connections.connection2.isSelected).toBe(true)
    })

    it('should set isSelected to true for all items', () => {
      expect(store.items.item2.isSelected).toBe(true)
      expect(store.items.item2.isSelected).toBe(true)
    })

    it('should populate selectedItemIds to have exactly all item ids selected', () => {
      expect(store.selectedItemIds).toHaveLength(2)
      expect(store.selectedItemIds).toContain('item1')
      expect(store.selectedItemIds).toContain('item2')
    })

    it('should populate selectedConnectionIds to have exactly all connection ids selected', () => {
      expect(store.selectedConnectionIds).toHaveLength(2)
      expect(store.selectedConnectionIds).toContain('connection1')
      expect(store.selectedConnectionIds).toContain('connection2')
    })
  })

  describe('createSelection', () => {
    const store = createDocumentStore('document')()

    beforeEach(() => {
      store.$reset()

      stubAll(store, [
        'updateSelectionList',
        'selectItemConnections'
      ])
    })

    it('should not select anything if the selection is not a valid two-dimensional rectangle', () => {
      store.createSelection({
        left: 0,
        top: 0,
        bottom: 0,
        right: 0
      })

      expect(store.updateSelectionList).not.toHaveBeenCalled()
      expect(store.selectItemConnections).not.toHaveBeenCalled()
    })

    describe('when the selection is a two-dimensional rectangle', () => {
      const port = createPort('port', 'item1', PortType.Input)
      const item1 = createItem('item1', ItemType.LogicGate)
      const item2 = createItem('item2', ItemType.LogicGate)
      const connection1 = createConnection('connection1', 'port', 'port')
      const connection2 = createConnection('connection2', 'port', 'port')

      beforeEach(() => {
        jest
          .spyOn(boundaries, 'hasIntersection')
          .mockReturnValueOnce(true) // item1 is in rect
          .mockReturnValueOnce(false) // item2 is not in rect
        jest
          .spyOn(boundaries, 'isLineIntersectingRectangle')
          .mockReturnValueOnce(true) // connection1 is in rect
          .mockReturnValueOnce(false) // connection2 is not in rect

        store.$patch({
          items: { item1, item2 },
          connections: { connection1, connection2 },
          ports: { port }
        })

        store.createSelection({
          left: 10,
          top: 10,
          right: 100,
          bottom: 100
        })
      })

      it('should select all items that lie within the selection boundary', () => {
        expect(store.updateSelectionList).toHaveBeenCalledWith({
          id: item1.id,
          isSelected: true
        })
      })

      it('should select all connections that lie within the selection boundary', () => {
        expect(store.updateSelectionList).toHaveBeenCalledWith({
          id: connection1.id,
          isSelected: true
        })
      })

      it('should not select a connection that lies outside the selection boundary', () => {
        expect(store.updateSelectionList).not.toHaveBeenCalledWith({
          id: connection2.id,
          isSelected: true
        })
      })

      it('should select the connections of all items that lie within the selection boundary', () => {
        expect(store.selectItemConnections).toHaveBeenCalledWith([item1.id])
      })
    })
  })

  describe('selectItemConnections', () => {
    const store = createDocumentStore('document')()
    const item1 = createItem('item1', ItemType.LogicGate, { portIds: ['port1'] })
    const item2 = createItem('item2', ItemType.LogicGate, { portIds: ['port2'] })
    const item3 = createItem('item3', ItemType.LogicGate, { portIds: ['port3'] })
    const item4 = createItem('item4', ItemType.LogicGate, { portIds: ['port4'] })
    const port1 = createPort('port1', 'item1', PortType.Output)
    const port2 = createPort('port2', 'item2', PortType.Input)
    const port3 = createPort('port3', 'item3', PortType.Output)
    const port4 = createPort('port4', 'item4', PortType.Input)
    const connection1 = createConnection('connection1', 'port1', 'port2')
    const connection2 = createConnection('connection2', 'port3', 'port4')
    const connection3 = createConnection('connection2', 'port3', 'port4')

    beforeEach(() => {
      store.$reset()
      store.$patch({
        items: { item1, item2, item3, item4 },
        ports: { port1, port2, port3, port4 },
        connections: { connection1, connection2, connection3 }
      })

      stubAll(store, [
        'updateSelectionList'
      ])
    })

    it('should select a connection whose source and target are both attached to selected items', () => {
      store.selectItemConnections([item4.id, item3.id])

      expect(store.updateSelectionList).toHaveBeenCalledWith({ id: connection3.id, isSelected: true })
    })

    it('should not select a connection if only its source is among the item ports selected', () => {
      store.selectItemConnections([item1.id])

      expect(store.updateSelectionList).not.toHaveBeenCalledWith({ id: connection1.id, isSelected: true })
    })

    it('should not select a connection if only its targt is among the item ports selected', () => {
      store.selectItemConnections([item2.id])

      expect(store.updateSelectionList).not.toHaveBeenCalledWith({ id: connection1.id, isSelected: true })
    })

    it('should not select a connection where neither its target nor its source is an item in the given list', () => {
      store.selectItemConnections([item1.id, item2.id])

      expect(store.updateSelectionList).not.toHaveBeenCalledWith({ id: connection2.id, isSelected: true })
    })
  })

  describe('setSelectionState', () => {
    const store = createDocumentStore('document')()

    beforeEach(() => {
      store.$reset()

      stubAll(store, [
        'updateSelectionList'
      ])
    })

    describe('when the element is part of a larger group', () => {
      const groupId = 'group1'
      const item1 = createItem('item1', ItemType.LogicGate, { groupId })
      const item2 = createItem('item2', ItemType.LogicGate, { groupId })
      const connection1 = createConnection('connection1', 'port1', 'port2', { groupId })
      const connection2 = createConnection('connection2', 'port3', 'port4')
      const group1 = createGroup('group1', ['item1', 'item2'], { connectionIds: ['connection1'] })

      beforeEach(() => {
        store.$patch({
          items: { item1, item2 },
          connections: { connection1, connection2 },
          groups: { group1 }
        })

        store.setSelectionState({ id: 'item1', value: true })
      })

      it('should select all the elements and connections within that group', () => {
        store.setSelectionState({ id: 'item1', value: true })
        expect(store.updateSelectionList).toHaveBeenCalledWith({ id: 'item1', isSelected: true })
        expect(store.updateSelectionList).toHaveBeenCalledWith({ id: 'item2', isSelected: true })
        expect(store.updateSelectionList).toHaveBeenCalledWith({ id: 'connection1', isSelected: true })
      })

      it('should not select elements outside the group for which the item is a member of', () => {
        expect(store.updateSelectionList).not.toHaveBeenCalledWith({
          id: 'connection2',
          isSelected: expect.any(Boolean)
        })
      })

      it('should select the group', () => {
        expect(store.updateSelectionList).toHaveBeenCalledWith({ id: 'group1', isSelected: true })
      })
    })

    it('should select only the element when the element is not a member of any group', () => {
      const item1 = createItem('item1', ItemType.LogicGate)

      store.$patch({
        items: { item1 }
      })
      store.setSelectionState({ id: 'item1', value: true })

      expect(store.updateSelectionList).toHaveBeenCalledWith({ id: 'item1', isSelected: true })
    })

    it('should not commit any mutations if the value does not differ from the one provided', () => {
      const item1 = createItem('item1', ItemType.LogicGate, { isSelected: true })

      store.$patch({
        items: { item1 }
      })
      store.setSelectionState({ id: 'item1', value: true })

      expect(store.updateSelectionList).not.toHaveBeenCalled()
    })

    it('should not change the selection of an element that does not exist', () => {
      store.setSelectionState({ id: 'item1', value: true })

      expect(store.updateSelectionList).not.toHaveBeenCalled()
    })
  })

  describe('recycleSelection', () => {
    const store = createDocumentStore('document')()
    const item1 = createItem('item1', ItemType.LogicGate, { zIndex: 1 })
    const item2 = createItem('item2', ItemType.LogicGate, { zIndex: 2 })

    beforeEach(() => {
      store.$reset()
      store.items = { item1, item2 }

      stubAll(store, [
        'deselectAll',
        'setSelectionState'
      ])
    })

    describe('when the first item should be selected', () => {
      beforeEach(() => store.recycleSelection(true))

      it('should select the first item', () => {
        expect(store.setSelectionState).toHaveBeenCalledTimes(1)
        expect(store.setSelectionState).toHaveBeenCalledWith({
          id: 'item1',
          value: true
        })
      })

      it('should deselect all others items', () => {
        expect(store.deselectAll).toHaveBeenCalledTimes(1)
      })
    })

    describe('when the last item should be selected', () => {
      beforeEach(() => store.recycleSelection(false))

      it('should select the last item', () => {
        expect(store.setSelectionState).toHaveBeenCalledTimes(1)
        expect(store.setSelectionState).toHaveBeenCalledWith({
          id: 'item2',
          value: true
        })
      })

      it('should deselect all items', () => {
        expect(store.deselectAll).toHaveBeenCalledTimes(1)
      })
    })

    it('should not change the selection state of any items when no item is available', () => {
      store.items = {}
      store.recycleSelection(false)

      expect(store.deselectAll).not.toHaveBeenCalled()
      expect(store.setSelectionState).not.toHaveBeenCalled()
    })
  })

  describe('deleteSelection', () => {
    const store = createDocumentStore('document')()

    beforeEach(() => {
      store.$reset()
      store.$patch({
        connections: {
          'connection1': createConnection('connection1', 'port1', 'port2'),
          'connection2': createConnection('connection2', 'port3', 'port4'),
          'connection3': createConnection('connection3', 'port5', 'port6', { isSelected: true }),
          'dragged_connection1': createConnection('dragged_connection', 'port6', 'port7'),
          'dragged_connection2': createConnection('dragged_connection', 'port8', 'port9')
        },
        ports: {
          'port1': createPort('port1', 'item1', PortType.Output),
          'port2': createPort('port2', 'freeport', PortType.Input, { isFreeport: true }),
          'port3': createPort('port3', 'freeport', PortType.Output, { isFreeport: true }),
          'port4': createPort('port4', 'item2', PortType.Input),
          'port5': createPort('port5', 'item3', PortType.Input),
          'port6': createPort('port6', 'item4', PortType.Output)
        },
        items: {
          'item1': createItem('item1', ItemType.InputNode, { portIds: ['port1'], isSelected: true }),
          'item2': createItem('item2', ItemType.OutputNode, { portIds: ['port4'] }),
          'freeport': createItem('freeport', ItemType.Freeport, { portIds: ['port2', 'port3'], isSelected: true }),
          'item3': createItem('item3', ItemType.InputNode, { portIds: ['port5'] }),
          'item4': createItem('item4', ItemType.OutputNode, { portIds: ['port6'] }),
          'ic': createItem('ic', ItemType.IntegratedCircuit, {
            portIds: ['icPort'],
            isSelected: true,
            integratedCircuit: createIntegratedCircuit({
              items: {
                icNode: createItem('icNode', ItemType.InputNode)
              }
            })
          })
        }
      })

      stubAll(store, [
        'commitState',
        'setSelectionState',
        'disconnectFreeport',
        'disconnect',
        'removeElement',
      ])
    })

    describe('when there are one or more items selected', () => {
      beforeEach(() => {
        store.selectedItemIds = ['item1']
        store.deleteSelection()
      })

      it('should commit the current state to the undo stack', () => {
        expect(store.commitState).toHaveBeenCalledTimes(1)
      })

      it('should select all connections that are attached to selected non-freeport items', () => {
        expect(store.setSelectionState).toHaveBeenCalledWith({ id: 'connection1', value: true })
        expect(store.setSelectionState).not.toHaveBeenCalledWith({ id: 'connection3', value: true })
      })

      it('should not select connections attached to a freeport', () => {
        expect(store.setSelectionState).not.toHaveBeenCalledWith({ id: 'connection2', value: true })
      })

      it('should not select a connection with an invalid source port reference', () => {
        expect(store.setSelectionState).not.toHaveBeenCalledWith({ id: 'dragged_connection1', value: true })
        expect(store.setSelectionState).not.toHaveBeenCalledWith({ id: 'dragged_connection2', value: true })
      })

      it('should disconnect selected connections', () => {
        expect(store.disconnect).toHaveBeenCalledWith({ source: 'port5', target: 'port6' })
      })

      it('should remove selected non-freeport items', () => {
        expect(store.removeElement).toHaveBeenCalledWith('item1')
        expect(store.removeElement).not.toHaveBeenCalledWith('item2')
        expect(store.removeElement).not.toHaveBeenCalledWith('item3')
        expect(store.removeElement).not.toHaveBeenCalledWith('item4')
        expect(store.removeElement).not.toHaveBeenCalledWith('freeport')
      })

      it('should remove selected non-freeport, non-IC items', () => {
        expect(store.removeElement).toHaveBeenCalledWith('item1')
      })

      it('should remove all selected freeports', () => {
        expect(store.disconnectFreeport).toHaveBeenCalledWith('freeport')
      })
    })

    it('should not change the state if nothing is selected', () => {
      store.selectedItemIds = []
      store.deleteSelection()

      expect(store.commitState).not.toHaveBeenCalled()
      expect(store.setSelectionState).not.toHaveBeenCalled()
      expect(store.disconnect).not.toHaveBeenCalled()
      expect(store.disconnectFreeport).not.toHaveBeenCalled()
      expect(store.removeElement).not.toHaveBeenCalled()
    })
  })

  describe('updateSelectionList', () => {
    const store = createDocumentStore('document')()

    beforeEach(() => store.$reset())

    it('should select the item', () => {
      const item1 = createItem('item1', ItemType.Buffer)

      store.$patch({
        items: { item1 }
      })

      store.updateSelectionList({ id: 'item1', isSelected: true })

      expect(store.items.item1.isSelected).toBe(true)
    })

    describe('when the item is a connection', () => {
      const item1 = createItem('item1', ItemType.InputNode, { portIds: ['startPort'] })
      const item2 = createItem('item2', ItemType.OutputNode, { portIds: ['endPort'] })
      const freeportItem = createItem('freeportItem', ItemType.Freeport, { portIds: ['inputPort', 'outputPort'] })
      const inputPort = createPort('inputPort', 'freeportItem', PortType.Input, { isFreeport: true })
      const outputPort = createPort('outputPort', 'freeportItem', PortType.Output, { isFreeport: true })
      const startPort = createPort('startPort', 'item1', PortType.Output)
      const endPort = createPort('endPort', 'item2', PortType.Input)
      const connectionPart1 = createConnection('connectionPart1', 'startPort', 'inputPort', { connectionChainId: 'connectionPart1' })
      const connectionPart2 = createConnection('connectionPart2', 'outputPort', 'endPort', { connectionChainId: 'connectionPart1' })
      const connectionOther = createConnection('connectionOther', 'outputPort', 'endPort', { connectionChainId: 'connectionOther' })

      beforeEach(() => {
        store.$patch({
          items: { item1, item2, freeportItem },
          ports: { inputPort, outputPort, startPort, endPort },
          connections: { connectionPart1, connectionPart2, connectionOther }
        })

        store.updateSelectionList({ id: 'connectionPart1', isSelected: true })
      })

      it('should select all connections that are part of the connection chain', () => {
        expect(store.connections.connectionPart1.isSelected).toBe(true)
        expect(store.connections.connectionPart2.isSelected).toBe(true)
      })

      it('should populate the selected connection IDs to the list of cached selected connection IDs', () => {
        expect(store.selectedConnectionIds).toHaveLength(2)
        expect(store.selectedConnectionIds).toContain('connectionPart1')
        expect(store.selectedConnectionIds).toContain('connectionPart2')
      })

      it('should not include a connection outside the connection chain', () => {
        expect(store.connections.connectionOther.isSelected).toBe(false)
      })

      it('should select all freeports associated to the chain', () => {
        expect(store.items.freeportItem.isSelected).toBe(true)
      })

      it('should populate the selected freeport ID to the list of cached selected item IDs', () => {
        expect(store.selectedItemIds).toHaveLength(1)
        expect(store.selectedItemIds).toContain('freeportItem')
      })
    })

    it('should remove the selection from the cached list if it is already selected', () => {
      const item1 = createItem('item1', ItemType.Buffer, { isSelected: true })

      store.$patch({
        items: { item1 },
        selectedItemIds: ['item1']
      })

      store.updateSelectionList({ id: 'item1', isSelected: false })

      expect(store.items.item1.isSelected).toBe(false)
      expect(store.selectedItemIds).toHaveLength(0)
    })

    it('should select nothing if the element does not exist', () => {
      const item1 = createItem('item1', ItemType.Buffer)

      store.$patch({
        items: { item1 }
      })

      store.updateSelectionList({ id: 'someNonExistingElement', isSelected: true })

      expect(store.items.item1.isSelected).not.toBe(true)
    })
  })
})

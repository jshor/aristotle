import { setActivePinia, createPinia } from 'pinia'
import PortType from '@/types/enums/PortType'
import boundaries from '../../geometry/boundaries'
import ItemType from '@/types/enums/ItemType'
import {
  createConnection,
  createControlPoint,
  createGroup,
  createIntegratedCircuit,
  createItem,
  createPort,
  stubAll
} from './__helpers__'
import { createDocumentStore } from '../..'

setActivePinia(createPinia())

describe('selection actions', () => {
  beforeEach(() => vi.restoreAllMocks())

  describe('selectAll', () => {
    const store = createDocumentStore('document')()

    beforeEach(() => {
      const controlPoint1 = createControlPoint()
      const item1 = createItem('item1', ItemType.Buffer)
      const item2 = createItem('item2', ItemType.Buffer)
      const connection1 = createConnection('connection1', 'port1', 'port2')
      const connection2 = createConnection('connection2', 'port3', 'port4')

      stubAll(store, [
        'clearStatelessInfo',
        'setConnectionSelectionState',
        'setItemSelectionState'
      ])

      store.$reset()
      store.$patch({
        items: { item1, item2 },
        connections: { connection1, connection2 }
      })

      store.selectAll()
    })

    it('should clear all stateless info', () => {
      expect(store.clearStatelessInfo).toHaveBeenCalled()
    })

    it('should select all connections', () => {
      expect(store.setConnectionSelectionState).toHaveBeenCalledTimes(2)
      expect(store.setConnectionSelectionState).toHaveBeenCalledWith('connection1', true)
      expect(store.setConnectionSelectionState).toHaveBeenCalledWith('connection2', true)
    })

    it('should select all items', () => {
      expect(store.setItemSelectionState).toHaveBeenCalledTimes(2)
      expect(store.setItemSelectionState).toHaveBeenCalledWith('item1', true)
      expect(store.setItemSelectionState).toHaveBeenCalledWith('item2', true)
    })
  })

  describe('deselectAll', () => {
    const store = createDocumentStore('document')()

    beforeEach(() => {
      const controlPoint1 = createControlPoint({ isSelected: true })
      const item1 = createItem('item1', ItemType.Buffer, { isSelected: true })
      const item2 = createItem('item2', ItemType.Buffer, { isSelected: true })
      const connection1 = createConnection('connection1', 'port1', 'port2', { isSelected: true })
      const connection2 = createConnection('connection2', 'port3', 'port4', {
        isSelected: true,
        controlPoints: [controlPoint1]
      })
      const group1 = createGroup('group1', ['item1', 'item2'], { isSelected: true })

      stubAll(store, [
        'clearStatelessInfo'
      ])

      store.$reset()
      store.$patch({
        items: { item1, item2 },
        connections: { connection1, connection2 },
        groups: { group1 },
        selectedItemIds: new Set(['item1', 'item2', 'non-existent-item']),
        selectedConnectionIds: new Set(['connection1', 'connection2', 'non-existent-connection']),
        selectedControlPoints: {
          connection2: new Set([0])
        }
      })

      store.deselectAll()
    })

    it('should clear all stateless info', () => {
      expect(store.clearStatelessInfo).toHaveBeenCalled()
    })

    it('should deselect all connections', () => {
      expect(store.connections.connection1.isSelected).toBe(false)
      expect(store.connections.connection2.isSelected).toBe(false)
    })

    it('should deselect all connection control points', () => {
      expect(store.connections.connection1.isSelected).toBe(false)
      expect(store.connections.connection2.isSelected).toBe(false)
    })

    it('should deselect all items', () => {
      expect(store.items.item2.isSelected).toBe(false)
      expect(store.items.item2.isSelected).toBe(false)
    })

    it('should deselect all items', () => {
      expect(store.items.item2.isSelected).toBe(false)
      expect(store.items.item2.isSelected).toBe(false)
    })

    it('should clear the lists of selected elements', () => {
      expect(store.selectedConnectionIds.size).toBe(0)
      expect(store.selectedItemIds.size).toBe(0)
      expect(store.selectedGroupIds.size).toBe(0)
      expect(Object.keys(store.selectedControlPoints)).toHaveLength(0)
    })
  })

  describe('createSelection', () => {
    const store = createDocumentStore('document')()

    beforeEach(() => {
      store.$reset()

      stubAll(store, [
        'setItemSelectionState',
        'setConnectionSelectionState'
      ])
    })

    it('should not select anything if the selection is not a two-dimensional', () => {
      store.createSelection({
        left: 0,
        top: 0,
        bottom: 0,
        right: 0
      })

      expect(store.setItemSelectionState).not.toHaveBeenCalled()
      expect(store.setConnectionSelectionState).not.toHaveBeenCalled()
    })

    describe('when the selection is a two-dimensional rectangle', () => {
      const port1 = createPort('port1', 'item1', PortType.Input, {
        position: {
          x: 0,
          y: 0
        }
      })
      const port2 = createPort('port2', 'item2', PortType.Input, {
        position: {
          x: 150,
          y: 150
        }
      })
      const port3 = createPort('port3', 'item2', PortType.Input, {
        position: {
          x: 1000,
          y: 1000
        }
      })
      const port4 = createPort('port4', 'item2', PortType.Input, {
        position: {
          x: 2000,
          y: 2000
        }
      })
      const item1 = createItem('item1', ItemType.InputNode, {
        portIds: ['port1'],
        position: port1.position
      })
      const item2 = createItem('item2', ItemType.OutputNode, {
        portIds: ['port2'],
        position: port2.position
      })
      const item3 = createItem('item3', ItemType.InputNode, {
        portIds: ['port3'],
        position: item1.position,
        isSelected: true
      })
      const item4 = createItem('item4', ItemType.OutputNode, {
        portIds: ['port4'],
        position: item2.position,
        isSelected: true
      })
      const selectionBoundary = {
        left: 10,
        top: 10,
        right: 100,
        bottom: 100
      }

      // this connection crosses the selection boundary
      const connection1 = createConnection('connection1', 'port1', 'port2')

      // this connection connects items outside the selection boundary, but connects two selected items
      const connection2 = createConnection('connection2', 'port3', 'port4')

      beforeEach(() => {
        store.$patch({
          items: { item1, item2, item3, item4 },
          ports: { port1, port2, port3, port4 },
          connections: { connection1, connection2 },
          selectedItemIds: new Set(['item3', 'item4'])
        })
      })

      it('should select the connection that lies within the selection boundary', () => {
        vi
          .spyOn(boundaries, 'hasIntersection')
          .mockReturnValue(true)

        store.createSelection(selectionBoundary)

        expect(store.setItemSelectionState).toHaveBeenCalledWith(item1.id, true)
        expect(store.setItemSelectionState).toHaveBeenCalledWith(item2.id, true)
      })

      it('should select the connection that lies within the boundary', () => {
        store.createSelection(selectionBoundary)

        expect(store.setConnectionSelectionState).toHaveBeenCalledWith(connection1.id, true)
      })

      it('should select the connection that connects two selected items within the boundary', () => {
        vi
          .spyOn(boundaries, 'hasIntersection')
          .mockReturnValue(true)

        store.createSelection(selectionBoundary)

        expect(store.setConnectionSelectionState).toHaveBeenCalledWith(connection2.id, true)
      })
    })
  })

  describe('setControlPointSelectionState', () => {
    const store = createDocumentStore('document')()
    const connectionId = 'connection-id'

    beforeEach(() => {
      store.$reset()
      store.$patch({
        connections: {
          [connectionId]: createConnection(connectionId, 'port1', 'port2', {
            controlPoints: [
              createControlPoint(),
              createControlPoint()
            ]
          })
        },
        selectedControlPoints: {}
      })

      stubAll(store, ['setGroupSelectionState'])
    })

    it('should not select the control points for a connection that does not exist', () => {
      const originalSelection = { ...store.selectedControlPoints }

      store.setControlPointSelectionState('non-existent-connection', 0, true)

      expect(store.selectedControlPoints).toEqual(expect.objectContaining(originalSelection))
      expect(store.setGroupSelectionState).not.toHaveBeenCalled()
    })

    it('should select the control point', () => {
      store.setControlPointSelectionState(connectionId, 0, true)

      expect(store.selectedControlPoints[connectionId]).toContain(0)
      expect(store.connections[connectionId].controlPoints[0].isSelected).toBe(true)
    })

    it('should deselect the control point', () => {
      store.setControlPointSelectionState(connectionId, 0, true)
      store.setControlPointSelectionState(connectionId, 1, true) // keep one selected control point
      store.setControlPointSelectionState(connectionId, 0, false)

      expect(store.selectedControlPoints[connectionId]).not.toContain(0)
      expect(store.connections[connectionId].controlPoints[0].isSelected).toBe(false)
    })

    it('should remove the connection entry from the list if deselecting one of its control points clears the list', () => {
      store.setControlPointSelectionState(connectionId, 0, true)
      store.setControlPointSelectionState(connectionId, 0, false)

      expect(store.selectedControlPoints).not.toHaveProperty(connectionId)
    })

    it('should deselect the group that the control point is in when the selection state has changed', () => {
      store.setControlPointSelectionState(connectionId, 0, true)
      store.setControlPointSelectionState(connectionId, 0, false)

      expect(store.setGroupSelectionState).toHaveBeenCalledWith(store.connections[connectionId].groupId, false)
    })

    it('should select the group that the control point is in when the selection state has changed', () => {
      store.setControlPointSelectionState(connectionId, 0, false)
      store.setControlPointSelectionState(connectionId, 0, true)

      expect(store.setGroupSelectionState).toHaveBeenCalledWith(store.connections[connectionId].groupId, true)
    })
  })

  describe('setConnectionSelectionState', () => {
    const store = createDocumentStore('document')()

    beforeEach(() => {
      store.$reset()
      store.$patch({
        connections: {
          connection1: createConnection('connection1', 'port1', 'port2', {
            controlPoints: [
              createControlPoint(),
              createControlPoint()
            ]
          })
        }
      })

      stubAll(store, [
        'setGroupSelectionState',
        'setControlPointSelectionState'
      ])
    })

    it('should not select anything if the connection does not exist', () => {
      store.setConnectionSelectionState('non-existent-connection', true)

      expect(store.selectedConnectionIds).not.toContain('non-existent-connection')
    })

    it('should select the connection', () => {
      store.setConnectionSelectionState('connection1', true)

      expect(store.selectedConnectionIds).toContain('connection1')
      expect(store.connections.connection1.isSelected).toBe(true)
    })

    it('should select all control points of the connection', () => {
      store.setConnectionSelectionState('connection1', true)

      expect(store.setControlPointSelectionState).toHaveBeenCalledTimes(2)
      expect(store.setControlPointSelectionState).toHaveBeenCalledWith('connection1', 0, true)
      expect(store.setControlPointSelectionState).toHaveBeenCalledWith('connection1', 1, true)
    })

    it('should deselect the connection', () => {
      store.setConnectionSelectionState('connection1', false)

      expect(store.selectedConnectionIds).not.toContain('connection1')
      expect(store.connections.connection1.isSelected).toBe(false)
    })

    it('should set the group selection state', () => {
      store.setConnectionSelectionState('connection1', true)

      expect(store.setGroupSelectionState).toHaveBeenCalledWith(store.connections.connection1.groupId, true)
    })

    it('should not select anything if the connection does not exist', () => {
      store.setConnectionSelectionState('non-existent-connection', true)

      expect(store.selectedConnectionIds).not.toContain('non-existent-connection')
      expect(store.connections).not.toHaveProperty('non-existent-connection')
      expect(store.setGroupSelectionState).not.toHaveBeenCalled()
    })
  })

  describe('setItemSelectionState', () => {
    const store = createDocumentStore('document')()

    beforeEach(() => {
      store.$reset()
      store.$patch({
        items: {
          item1: createItem('item1', ItemType.InputNode)
        }
      })

      stubAll(store, ['setGroupSelectionState'])
    })

    it('should not select anything if the item does not exist', () => {
      store.setItemSelectionState('non-existent-item', true)

      expect(store.selectedItemIds).not.toContain('non-existent-item')
    })

    it('should select the item', () => {
      store.setItemSelectionState('item1', true)

      expect(store.selectedItemIds).toContain('item1')
      expect(store.items.item1.isSelected).toBe(true)
    })

    it('should deselect the item', () => {
      store.setItemSelectionState('item1', false)

      expect(store.selectedItemIds).not.toContain('item1')
      expect(store.items.item1.isSelected).toBe(false)
    })

    it('should set the group selection state', () => {
      store.setItemSelectionState('item1', true)

      expect(store.setGroupSelectionState).toHaveBeenCalledWith(store.items.item1.groupId, true)
    })

    it('should not select anything if the item does not exist', () => {
      store.setItemSelectionState('non-existent-item', true)

      expect(store.selectedItemIds).not.toContain('non-existent-item')
      expect(store.items).not.toHaveProperty('non-existent-item')
      expect(store.setGroupSelectionState).not.toHaveBeenCalled()
    })
  })

  describe('setGroupSelectionState', () => {
    const store = createDocumentStore('document')()
    const item1 = createItem('item1', ItemType.InputNode)
    const item2 = createItem('item2', ItemType.OutputNode)
    const connection = createConnection('connection', 'port1', 'port2')

    beforeEach(() => {
      store.$reset()
      store.$patch({
        items: { item1, item2 },
        connections: { connection },
        groups: {
          group1: createGroup('group1', ['item1', 'item2'], {
            connectionIds: ['connection']
          })
        }
      })

      stubAll(store, [
        'setItemSelectionState',
        'setConnectionSelectionState'
      ])
    })

    it('should not select anything if the group ID is null', () => {
      store.setGroupSelectionState(null, true)

      expect(store.setItemSelectionState).not.toHaveBeenCalled()
      expect(store.setConnectionSelectionState).not.toHaveBeenCalled()
    })

    it('should not select anything if the group does not exist', () => {
      store.setGroupSelectionState('non-existent-group', true)

      expect(store.setItemSelectionState).not.toHaveBeenCalled()
      expect(store.setConnectionSelectionState).not.toHaveBeenCalled()
    })

    it('should not select anything if the group is already selected', () => {
      store.setGroupSelectionState('group1', true)
      vi.resetAllMocks()
      store.setGroupSelectionState('group1', true)

      expect(store.setItemSelectionState).not.toHaveBeenCalled()
      expect(store.setConnectionSelectionState).not.toHaveBeenCalled()
    })

    it('should not deselect anything if the group is already not selected', () => {
      store.setGroupSelectionState('group1', false)
      vi.resetAllMocks()
      store.setGroupSelectionState('group1', false)

      expect(store.setItemSelectionState).not.toHaveBeenCalled()
      expect(store.setConnectionSelectionState).not.toHaveBeenCalled()
    })

    describe('when the group is selected', () => {
      beforeEach(() => store.setGroupSelectionState('group1', true))

      it('should select the items in the group', () => {
        expect(store.setItemSelectionState).toHaveBeenCalledTimes(2)
        expect(store.setItemSelectionState).toHaveBeenCalledWith(item1.id, true)
        expect(store.setItemSelectionState).toHaveBeenCalledWith(item2.id, true)
      })

      it('should select the connections in the group', () => {
        expect(store.setConnectionSelectionState).toHaveBeenCalledTimes(1)
        expect(store.setConnectionSelectionState).toHaveBeenCalledWith(connection.id, true)
      })

      it('should select the group', () => {
        expect(store.groups.group1.isSelected).toBe(true)
        expect(store.selectedGroupIds).toContain('group1')
      })
    })

    describe('when the group is deselected', () => {
      beforeEach(() => {
        store.setGroupSelectionState('group1', true)
        vi.resetAllMocks()
        store.setGroupSelectionState('group1', false)
      })

      it('should deselect the items in the group', () => {
        expect(store.setItemSelectionState).toHaveBeenCalledTimes(2)
        expect(store.setItemSelectionState).toHaveBeenCalledWith(item1.id, false)
        expect(store.setItemSelectionState).toHaveBeenCalledWith(item2.id, false)
      })

      it('should deselect the connections in the group', () => {
        expect(store.setConnectionSelectionState).toHaveBeenCalledTimes(1)
        expect(store.setConnectionSelectionState).toHaveBeenCalledWith(connection.id, false)
      })

      it('should deselect the group', () => {
        expect(store.groups.group1.isSelected).toBe(false)
        expect(store.selectedGroupIds).not.toContain('group1')
      })
    })
  })

  describe('setSelectionState', () => {
    const store = createDocumentStore('document')()

    beforeEach(() => {
      store.$reset()
      store.$patch({
        items: {
          item1: createItem('item1', ItemType.InputNode)
        },
        connections: {
          connection1: createConnection('connection1', 'port1', 'port2')
        },
        groups: {
          group1: createGroup('group1', ['item1'])
        }
      })

      stubAll(store, [
        'setItemSelectionState',
        'setConnectionSelectionState',
        'setGroupSelectionState'
      ])
    })

    it('should select the item if it is one', () => {
      store.setSelectionState('item1', true)

      expect(store.setItemSelectionState).toHaveBeenCalledWith('item1', true)
    })

    it('should select the connection if it is one', () => {
      store.setSelectionState('connection1', true)

      expect(store.setConnectionSelectionState).toHaveBeenCalledWith('connection1', true)
    })

    it('should select the group if it is one', () => {
      store.setSelectionState('group1', true)

      expect(store.setGroupSelectionState).toHaveBeenCalledWith('group1', true)
    })

    it('should not select anything if the element does not exist', () => {
      store.setSelectionState('non-existent-element', true)

      expect(store.setItemSelectionState).not.toHaveBeenCalled()
      expect(store.setConnectionSelectionState).not.toHaveBeenCalled()
      expect(store.setGroupSelectionState).not.toHaveBeenCalled()
    })
  })

  describe('deleteSelection', () => {
    const store = createDocumentStore('document')()

    beforeEach(() => {
      store.$reset()
      store.$patch({
        selectedControlPoints: {
          connection2: new Set([1])
        },
        connections: {
          'connection1': createConnection('connection1', 'port1', 'port2'),
          'connection2': createConnection('connection2', 'port3', 'port4', {
            controlPoints: [createControlPoint(), createControlPoint()]
          }),
          'connection3': createConnection('connection3', 'port5', 'port6', { isSelected: true })
        },
        ports: {
          'port1': createPort('port1', 'item1', PortType.Output),
          'port2': createPort('port2', 'item2', PortType.Input),
          'port3': createPort('port3', 'item3', PortType.Output),
          'port4': createPort('port4', 'item4', PortType.Input),
          'port5': createPort('port5', 'item5', PortType.Output),
          'port6': createPort('port6', 'item6', PortType.Input)
        },
        items: {
          'item1': createItem('item1', ItemType.InputNode, { portIds: ['port1'], isSelected: true }),
          'item2': createItem('item2', ItemType.OutputNode, { portIds: ['port2'] }),
          'item3': createItem('item3', ItemType.InputNode, { portIds: ['port3'] }),
          'item4': createItem('item4', ItemType.OutputNode, { portIds: ['port4'] }),
          'item5': createItem('item5', ItemType.OutputNode, { portIds: ['port5'] }),
          'item6': createItem('item6', ItemType.OutputNode, { portIds: ['port6'] }),
          'ic': createItem('ic', ItemType.IntegratedCircuit, {
            portIds: ['icPort'],
            isSelected: true,
            integratedCircuit: createIntegratedCircuit({
              items: {
                icNode: createItem('icNode', ItemType.InputNode)
              }
            })
          })
        },
        groups: {
          group1: createGroup('group1', ['item1', 'item2'], { isSelected: true })
        }
      })

      stubAll(store, [
        'commitState',
        'deselectAll',
        'disconnectById',
        'removeElement'
      ])
    })

    describe('when there are one or more items selected', () => {
      beforeEach(() => {
        store.selectedItemIds = new Set(['item1'])
        store.selectedConnectionIds = new Set(['connection3'])
        store.selectedGroupIds = new Set(['group1'])

        store.deleteSelection()
      })

      it('should commit the current state to the undo stack', () => {
        expect(store.commitState).toHaveBeenCalledTimes(1)
      })

      it('should disconnect selected connections', () => {
        expect(store.disconnectById).toHaveBeenCalledWith('connection1')
        expect(store.disconnectById).toHaveBeenCalledWith('connection3')
      })

      it('should not remove non-selected connections', () => {
        expect(store.disconnectById).not.toHaveBeenCalledWith('connection2')
      })

      it('should remove selected items', () => {
        expect(store.removeElement).toHaveBeenCalledWith('item1')
      })

      it('should remove selected groups', () => {
        expect(store.groups).not.toHaveProperty('group1')
        expect(store.selectedGroupIds).not.toContain('group1')
      })

      it('should not remove non-selected items', () => {
        expect(store.removeElement).not.toHaveBeenCalledWith('item2')
        expect(store.removeElement).not.toHaveBeenCalledWith('item3')
        expect(store.removeElement).not.toHaveBeenCalledWith('item4')
      })
    })

    it('should not change the state if nothing is selected', () => {
      vi.resetAllMocks()

      store.$reset()
      store.clearStatelessInfo()
      store.deleteSelection()

      expect(store.commitState).not.toHaveBeenCalled()
      expect(store.disconnectById).not.toHaveBeenCalled()
      expect(store.removeElement).not.toHaveBeenCalled()
      expect(store.deselectAll).not.toHaveBeenCalled()
    })
  })

  describe('clearStatelessInfo', () => {
    const store = createDocumentStore('document')()

    beforeEach(() => store.$reset())

    it('should clear the connectable port IDs', () => {
      store.connectablePortIds.add('port1')
      store.clearStatelessInfo()

      expect(store.connectablePortIds.size).toBe(0)
    })

    it('should clear the selected port index', () => {
      store.selectedPortIndex = 1
      store.clearStatelessInfo()

      expect(store.selectedPortIndex).toBe(-1)
    })

    it('should clear the active port ID', () => {
      store.activePortId = 'active-port-id'
      store.clearStatelessInfo()

      expect(store.activePortId).toBe(null)
    })

    it('should clear the connection preview ID', () => {
      store.connectionPreviewId = 'connection-preview-id'
      store.clearStatelessInfo()

      expect(store.connectionPreviewId).toBe(null)
    })

    it('should clear the connection experiment', () => {
      store.connectionExperiment = {
        sourceId: 'port-id',
        targetPosition: {
          x: 10,
          y: 20
        }
      }
      store.clearStatelessInfo()

      expect(store.connectionExperiment).toBe(null)
    })
  })
})

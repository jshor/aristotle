import { setActivePinia, createPinia } from 'pinia'
import PortType from '@/types/enums/PortType'
import {
  createConnection,
  createControlPoint,
  createPort,
  createSerializedState,
  stubAll
} from './__helpers__'
import { createDocumentStore } from '../..'
import CircuitNode from '../../circuit/CircuitNode'
import boundaries from '../../geometry/boundaries'

setActivePinia(createPinia())

describe('connection actions', () => {
  beforeEach(() => jest.restoreAllMocks())

  describe('connect', () => {
    const store = createDocumentStore('document')()
    const source = 'source-id'
    const target = 'target-id'
    const node1 = new CircuitNode(source)
    const node2 = new CircuitNode(target)

    beforeEach(() => {
      store.$reset()
      store.$patch({
        ports: {
          [source]: createPort(source, 'item1', PortType.Output),
          [target]: createPort(target, 'item2', PortType.Input)
        },
        nodes: {
          [source]: node1,
          [target]: node2
        }
      })

      jest
        .spyOn(store.circuit, 'addConnection')
        .mockImplementation(jest.fn())
    })

    it('should add the connection to the state if both the source and target are specified', () => {
      store.connect({ source, target })

      const connections = Object.keys(store.connections)

      expect(connections).toHaveLength(1)
      expect(store.connections[connections[0]]).toEqual({
        id: expect.any(String),
        controlPoints: [],
        source,
        target,
        groupId: null,
        zIndex: 2,
        isSelected: false
      })
      expect(store.circuit.addConnection).toHaveBeenCalledTimes(1)
      expect(store.circuit.addConnection).toHaveBeenCalledWith(node1, node2, target)
    })

    it('should not add the connection to the state if the source was not found', () => {
      store.connect({ source: 'some-undefined-id', target })

      const connections = Object.keys(store.connections)

      expect(connections).toHaveLength(0)
      expect(store.circuit.addConnection).not.toHaveBeenCalled()
    })

    // it('should set the connection preview ID if isPreview is true', () => {
    //   store.connect({ source, target, isPreview: true })

    //   expect(store.connectionPreviewId).toEqual(Object.keys(store.connections)[0])
    // })

    it('should add the connected port ids to each port\'s list', () => {
      store.connect({ source, target })

      expect(store.ports[source].connectedPortIds).toEqual([target])
      expect(store.ports[target].connectedPortIds).toEqual([source])
    })
  })

  describe('disconnect', () => {
    const store = createDocumentStore('document')()
    const source = 'source-id'
    const target = 'target-id'
    const node1 = new CircuitNode(source)
    const node2 = new CircuitNode(target)
    const connection = createConnection('connection', source, target)

    beforeEach(() => {
      store.$reset()
      store.$patch({
        connections: { connection },
        ports: {
          [source]: createPort(source, 'item1', PortType.Output, { connectedPortIds: [target] }),
          [target]: createPort(target, 'item2', PortType.Input, { connectedPortIds: [source] })
        },
        nodes: {
          [source]: node1,
          [target]: node2
        }
      })

      jest
        .spyOn(store.circuit, 'removeConnection')
        .mockImplementation(jest.fn())
    })

    it('should not remove the connection if the source was not found', () => {
      store.disconnect({ source: 'invalid-id', target })

      expect(store.connections).toHaveProperty('connection')
      expect(store.connections.connection).toEqual(connection)
    })

    it('should not remove the connection if the target was not found', () => {
      store.disconnect({ source, target: 'invalid-id' })

      expect(store.connections).toHaveProperty('connection')
      expect(store.connections.connection).toEqual(connection)
    })

    it('should remove the references to opposite connected ports whose connections were removed', () => {
      store.disconnect({ source, target })

      expect(store.ports[source].connectedPortIds).toHaveLength(0)
      expect(store.ports[target].connectedPortIds).toHaveLength(0)
    })

    it('should remove the connection from the state and the circuit', () => {
      store.disconnect({ source, target })

      expect(store.connections).not.toHaveProperty('connection')
      expect(store.circuit.removeConnection).toHaveBeenCalledTimes(1)
      expect(store.circuit.removeConnection).toHaveBeenCalledWith(node1, node2)
    })
  })

  describe('setConnectionPreview', () => {
    const store = createDocumentStore('document')()

    beforeEach(() => {
      store.$reset()

      stubAll(store, [
        'connect',
        'unsetConnectionPreview'
      ])
    })

    describe('when a port is active and a port ID is passed', () => {
      const activePortId = 'active-port-id'
      const portId = 'port-id'

      describe('when the port is an output port', () => {
        const port = createPort(activePortId, 'element-id', PortType.Output)

        it('should establish a preview connection if the port is not currently connected', () => {
          store.$patch({
            activePortId,
            ports: {
              [activePortId]: port
            }
          })
          store.setConnectionPreview(portId)

          expect(store.connect).toHaveBeenCalledTimes(1)
          expect(store.connect).toHaveBeenCalledWith({
            source: activePortId,
            target: portId,
            id: expect.any(String)
          })
        })
      })

      describe('when the port is an input port', () => {
        const port = createPort(activePortId, 'element-id', PortType.Input)

        it('should establish a preview connection if the port is not currently connected', () => {
          store.$patch({
            activePortId,
            ports: {
              [activePortId]: port
            }
          })
          store.setConnectionPreview(portId)

          expect(store.connect).toHaveBeenCalledTimes(1)
          expect(store.connect).toHaveBeenCalledWith({
            source: portId,
            target: activePortId,
            id: expect.any(String)
          })
        })
      })
    })

    it('should not connect or disconnect anything if the port ID is not defined', () => {
      store.setConnectionPreview(null)

      expect(store.connect).not.toHaveBeenCalled()
    })

    it('should not connect or disconnect anything if there is no active port', () => {
      store.setConnectionPreview('port-id')

      expect(store.connect).not.toHaveBeenCalled()
    })
  })

  describe('unsetConnectionPreview ', () => {
    const store = createDocumentStore('document')()

    describe('when there is a connection preview set', () => {
      const connection = createConnection('connection', 'source-id', 'target-id')

      beforeEach(() => {
        stubAll(store, [
          'disconnectById'
        ])

        store.$patch({
          connectionPreviewId: connection.id,
          connections: { connection }
        })
        store.unsetConnectionPreview()
      })

      it('should disconnect the active connection', () => {
        expect(store.disconnectById).toHaveBeenCalledTimes(1)
        expect(store.disconnectById).toHaveBeenCalledWith(connection.id)
      })

      it('should clear the connection preview id', () => {
        expect(store.connectionPreviewId).toBeNull()
      })
    })

    it('should clear the connection preview id', () => {
      store.unsetConnectionPreview()

      expect(store.connectionPreviewId).toBeNull()
    })
  })

  describe('commitPreviewedConnection ', () => {
    const store = createDocumentStore('document')()

    beforeEach(() => {
      stubAll(store, [
        'connect',
        'disconnectById',
        'commitState'
      ])
    })

    describe('when there is a connection preview set', () => {
      const source = createPort('source-id', 'item-id', PortType.Output)
      const target = createPort('target-id', 'item-id', PortType.Input)
      const connection = createConnection('connection', 'source-id', 'target-id')

      beforeEach(() => {
        store.$patch({
          connectionPreviewId: connection.id,
          connections: { connection },
          ports: {
            [source.id]: source,
            [target.id]: target
          }
        })
        store.commitPreviewedConnection()
      })

      it('should commit the cached state', () => {
        expect(store.commitState).toHaveBeenCalledTimes(1)
      })

      it('should disconnect the existing connection', () => {
        expect(store.disconnectById).toHaveBeenCalledTimes(1)
        expect(store.disconnectById).toHaveBeenCalledWith(connection.id)
      })

      it('should re-connect the connection without a preview ID set', () => {
        expect(store.connect).toHaveBeenCalledTimes(1)
        expect(store.connect).toHaveBeenCalledWith({ source: source.id, target: target.id })
      })

      it('should clear the connection preview id', () => {
        expect(store.connectionPreviewId).toBeNull()
      })
    })

    it('should clear the connection preview id', () => {
      store.commitPreviewedConnection()

      expect(store.connectionPreviewId).toBeNull()
    })
  })

  describe('cycleConnectionPreviews', () => {
    const store = createDocumentStore('document')()
    const portId = 'port1'
    const connectablePortIds = ['port1', 'port2', 'port3']

    beforeEach(() => {
      store.$reset()
      store.$patch({
        ports: {
          port1: createPort('port1', 'element-id', PortType.Input),
          port2: createPort('port2', 'element-id', PortType.Input),
          port3: createPort('port3', 'element-id', PortType.Input)
        }
      })

      jest
        .spyOn(window.api, 'beep')
        .mockImplementation(jest.fn())

      stubAll(store, [
        'setConnectionPreview',
        'unsetConnectionPreview',
        'setConnectablePortIds',
        'setActivePortId',
        'cacheState'
      ])
    })

    it('should set the active port ID to the one provided if not already active', () => {
      store.$patch({
        activePortId: 'port2',
        cachedState: createSerializedState()
      })
      store.cycleConnectionPreviews(portId)

      expect(store.setActivePortId).toHaveBeenCalledTimes(1)
      expect(store.setActivePortId).toHaveBeenCalledWith(portId)
    })

    it('should start cycling at index 0 if an index is not defined', () => {
      store.$patch({
        activePortId: portId,
        connectablePortIds: new Set(connectablePortIds),
        selectedPortIndex: -1
      })
      store.cycleConnectionPreviews(portId)

      expect(store.setConnectionPreview).toHaveBeenCalledTimes(1)
      expect(store.setConnectionPreview).toHaveBeenCalledWith(connectablePortIds[0])
    })

    it('should clear the connection preview if all possible connections are cycled through already', () => {
      store.$patch({
        activePortId: portId,
        connectablePortIds,
        selectedPortIndex: 2
      })
      store.cycleConnectionPreviews(portId)

      expect(store.unsetConnectionPreview).toHaveBeenCalledTimes(1)
    })

    it('should not cache the state if a state is already cached', () => {
      store.$patch({
        activePortId: portId,
        cachedState: createSerializedState()
      })
      store.cycleConnectionPreviews(portId)

      expect(store.cacheState).not.toHaveBeenCalled()
    })
  })

  describe('disconnectById', () => {
    const store = createDocumentStore('document')()
    const node1 = new CircuitNode('source-id')
    const node2 = new CircuitNode('target-id')
    const connection = createConnection('connection', 'source-id', 'target-id')

    beforeEach(() => {
      store.$reset()
      store.$patch({
        connections: { connection },
        nodes: {
          'source-id': node1,
          'target-id': node2
        }
      })

      stubAll(store, [
        'advanceSimulation',
        'destroyConnectionById'
      ])
      stubAll(store.circuit, ['removeConnection'])
    })

    it('should not do anything if the connection does not exist', () => {
      store.disconnectById('invalid-id')

      expect(store.circuit.removeConnection).not.toHaveBeenCalled()
      expect(store.advanceSimulation).not.toHaveBeenCalled()
      expect(store.destroyConnectionById).not.toHaveBeenCalled()
    })

    describe('when the connection exists', () => {
      beforeEach(() => store.disconnectById(connection.id))

      it('should remove the connection from the circuit', () => {
        expect(store.circuit.removeConnection).toHaveBeenCalledTimes(1)
        expect(store.circuit.removeConnection).toHaveBeenCalledWith(node1, node2)
      })

      it('should advance the simulation', () => {
        expect(store.advanceSimulation).toHaveBeenCalledTimes(1)
      })

      it('should destroy the connection', () => {
        expect(store.destroyConnectionById).toHaveBeenCalledTimes(1)
        expect(store.destroyConnectionById).toHaveBeenCalledWith(connection.id)
      })
    })
  })

  describe('addControlPoint', () => {
    const store = createDocumentStore('document')()
    const connectionId = 'connection-id'

    beforeEach(() => {
      store.$reset()

      stubAll(store, ['setControlPointSelectionState'])
    })

    it('should add a control point in the given index', () => {
      const connection = createConnection(connectionId, 'source-id', 'target-id', {
        controlPoints: [
          createControlPoint(),
          createControlPoint(),
          createControlPoint()
        ]
      })
      const position = { x: 20, y: 30 }
      const index = 2

      store.$patch({
        connections: {
          [connectionId]: connection
        }
      })
      store.addControlPoint(connection.id, position, index)

      expect(store.connections[connection.id].controlPoints[index]).toEqual(expect.objectContaining({
        position,
        orientation: 0,
        rotation: 0,
        canInflect: true
      }))
    })

    it('should select the newly-added control point', () => {
      const connection = createConnection(connectionId, 'source-id', 'target-id')
      const position = { x: 20, y: 30 }

      store.$patch({
        connections: {
          [connectionId]: connection
        }
      })
      store.addControlPoint(connection.id, position, 0)

      expect(store.setControlPointSelectionState).toHaveBeenCalledTimes(1)
      expect(store.setControlPointSelectionState).toHaveBeenCalledWith(connectionId, 0, true)
    })
  })

  describe('createConnectionExperiment', () => {
    const store = createDocumentStore('document')()
    const sourceId = 'source-id'

    beforeEach(() => {
      store.$reset()
      store.$patch({
        ports: {
          [sourceId]: createPort(sourceId, 'item-id', PortType.Output)
        }
      })

      stubAll(store, ['setConnectionExperimentSnapBoundaries'])

      store.createConnectionExperiment(sourceId)
    })

    it('should not create a new connection experiment if the source port does not exist', () => {
      store.$reset()
      store.createConnectionExperiment('invalid-id')

      expect(store.connectionExperiment).toBeNull()
    })

    it('should apply the new connection experiment', () => {
      expect(store.connectionExperiment).toEqual({
        sourceId,
        targetPosition: store.ports[sourceId].position
      })
    })

    it('should set the snap boundaries', () => {
      expect(store.setConnectionExperimentSnapBoundaries).toHaveBeenCalledTimes(1)
      expect(store.setConnectionExperimentSnapBoundaries).toHaveBeenCalledWith(sourceId)
    })
  })

  describe('updateConnectionExperiment', () => {
    const store = createDocumentStore('document')()

    beforeEach(() => store.$reset())

    it('should not do anything if there is no connection experiment', () => {
      stubAll(boundaries, [
        'getPointBoundary',
        'getRadialSnapOffset'
      ])

      store.updateConnectionExperiment({ x: 0, y: 0 })

      expect(boundaries.getPointBoundary).not.toHaveBeenCalled()
      expect(boundaries.getRadialSnapOffset).not.toHaveBeenCalled()
    })

    it('should move the experimental connection to the given target position', () => {
      const sourceId = 'source-id'
      const position = { x: 20, y: 30 }

      store.$patch({
        connectionExperiment: {
          sourceId,
          targetPosition: { x: 10, y: 20 }
        }
      })
      store.updateConnectionExperiment(position)

      expect(store.connectionExperiment!.targetPosition).toEqual(position)
    })

    it('should snap to the nearest available port', () => {
      const sourceId = 'source-id'
      const position = { x: 30, y: 40 }
      const snapPoisition = { x: 33, y: 44 }

      store.$patch({
        connectionExperiment: {
          sourceId,
          targetPosition: {
            x: 10,
            y: 20
          }
        },
        snapBoundaries: [
          boundaries.getPointBoundary({ x: 0, y: 0 }),
          boundaries.getPointBoundary({ x: 10, y: 10 }),
          boundaries.getPointBoundary(snapPoisition)
        ]
      })
      store.updateConnectionExperiment(position)

      expect(store.connectionExperiment!.targetPosition).toEqual(snapPoisition)
    })
  })

  describe('terminateConnectionExperiment', () => {
    const store = createDocumentStore('document')()
    const sourceId = 'source-id'
    const targetId = 'target-id'
    const source = createPort(sourceId, 'item-id', PortType.Output)
    const target = createPort(targetId, 'item-id', PortType.Input, {
      position: {
        x: 11,
        y: 21
      }
    })

    beforeEach(() => {
      store.$reset()

      stubAll(store, [
        'cacheState',
        'commitCachedState',
        'connect',
        'clearStatelessInfo'
      ])
    })

    it('should not do anything if there is no connection experiment', () => {

      store.terminateConnectionExperiment()

      expect(store.connect).not.toHaveBeenCalled()
      expect(store.cacheState).not.toHaveBeenCalled()
      expect(store.commitCachedState).not.toHaveBeenCalled()
      expect(store.clearStatelessInfo).not.toHaveBeenCalled()
    })

    describe('when the connection experiment is in the neighborhood of a connectable port', () => {
      beforeEach(() => {
        store.$patch({
          connectionExperiment: {
            sourceId,
            targetPosition: { x: 10, y: 20 }
          },
          ports: {
            [sourceId]: source,
            [targetId]: target
          },
          connectablePortIds: new Set([targetId])
        })

        store.terminateConnectionExperiment()
      })

      it('should connect the source and target ports', () => {
        expect(store.connect).toHaveBeenCalledTimes(1)
        expect(store.connect).toHaveBeenCalledWith({ source: sourceId, target: targetId })
      })

      it('should clear the connection experiment', () => {
        expect(store.connectionExperiment).toBeNull()
      })

      it('should commit the state', () => {
        expect(store.cacheState).toHaveBeenCalledTimes(1)
        expect(store.commitCachedState).toHaveBeenCalledTimes(1)
      })

      it('should clear the stateless info', () => {
        expect(store.clearStatelessInfo).toHaveBeenCalledTimes(1)
      })
    })

    it('should reverse the source and the target when the source is an input port', () => {
      store.$patch({
        connectionExperiment: {
          sourceId,
          targetPosition: { x: 10, y: 20 }
        },
        ports: {
          [sourceId]: target,
          [targetId]: source
        },
        connectablePortIds: new Set([targetId])
      })

      store.terminateConnectionExperiment()

      expect(store.connect).toHaveBeenCalledTimes(1)
      expect(store.connect).toHaveBeenCalledWith({ source: targetId, target: sourceId })
    })

    describe('when the connection experiment is not near a connectable port', () => {
      beforeEach(() => {
        store.$reset()
        store.$patch({
          connectionExperiment: {
            sourceId,
            targetPosition: { x: 100, y: 200 }
          },
          ports: {
            [targetId]: target
          }
        })

        stubAll(store, [
          'cacheState',
          'commitCachedState',
          'connect',
          'clearStatelessInfo'
        ])

        store.terminateConnectionExperiment()
      })

      it('should not connect anything', () => {
        expect(store.connect).not.toHaveBeenCalled()
      })

      it('should not commit the state', () => {
        expect(store.cacheState).not.toHaveBeenCalled()
        expect(store.commitCachedState).not.toHaveBeenCalled()
      })
    })
  })
})

import { setActivePinia, createPinia } from 'pinia'
import PortType from '@/types/enums/PortType'
import ItemType from '@/types/enums/ItemType'
import {
  createConnection,
  createItem,
  createPort,
  stubAll
} from './__helpers__'
import { createDocumentStore } from '../..'

setActivePinia(createPinia())

describe('port actions', () => {
  beforeEach(() => jest.restoreAllMocks())

  describe('removePort', () => {
    const store = createDocumentStore('document')()

    const item1 = createItem('item1', ItemType.InputNode, { portIds: ['startPort'] })
    const item2 = createItem('item2', ItemType.OutputNode, { portIds: ['endPort'] })
    const freeportItem = createItem('freeportItem', ItemType.Freeport, { portIds: ['inputPort', 'outputPort'] })
    const inputPort = createPort('inputPort', 'freeportItem', PortType.Input, { isFreeport: true })
    const outputPort = createPort('outputPort', 'freeportItem', PortType.Output, { isFreeport: true })
    const startPort = createPort('startPort', 'item1', PortType.Output)
    const endPort = createPort('endPort', 'item2', PortType.Input)
    const connectionPart1 = createConnection('connectionPart1', 'startPort', 'inputPort', { connectionChainId: 'connectionPart1' })
    const connectionPart2 = createConnection('connectionPart2', 'outputPort', 'endPort', { connectionChainId: 'connectionPart1' })

    function assertRemovePort (description: string, portId: string) {
      describe(description, () => {
        beforeEach(() => {
          store.$reset()
          store.$patch({
            items: { item1, item2, freeportItem },
            ports: { inputPort, outputPort, startPort, endPort },
            connections: { connectionPart1, connectionPart2 }
          })

          jest
            .spyOn(store.simulation, 'removeConnection')
            .mockImplementation(jest.fn())

          store.removePort(portId)
        })

        it('should remove the connections from the entire connection chain', () => {
          expect(store.connections).not.toHaveProperty('connectionPart1')
          expect(store.connections).not.toHaveProperty('connectionPart2')
        })

        it('should remove the connections from the circuit', () => {
          expect(store.simulation.removeConnection).toHaveBeenCalledTimes(2)
          expect(store.simulation.removeConnection).toHaveBeenCalledWith('startPort', 'inputPort')
          expect(store.simulation.removeConnection).toHaveBeenCalledWith('outputPort', 'endPort')
        })

        it('should remove the freeport item in the connection chain', () => {
          expect(store.items).not.toHaveProperty('freeportItem')
        })

        it('should remove all ports associated with the connection chain', () => {
          expect(store.ports).not.toHaveProperty('inputPort')
          expect(store.ports).not.toHaveProperty('outputPort')
        })
      })
    }

    assertRemovePort('when the start port of the chain is being removed', 'startPort')
    assertRemovePort('when the end port of the chain is being removed', 'endPort')
    // assertRemovePort('when the input port of the freeport item in the chain is being removed', 'inputPort')
    // assertRemovePort('when the output port of the freeport item in the chain is being removed', 'outputPort')
  })

  describe('setPortValue', () => {
    it('should set given the port value for the given node id', () => {
      const store = createDocumentStore('document')()
      const id = 'node1'
      const value = 1

      jest
        .spyOn(store.simulation, 'setPortValue')
        .mockImplementation(jest.fn())

      store.setPortValue({ id, value })

      expect(store.simulation.setPortValue).toHaveBeenCalledTimes(1)
      expect(store.simulation.setPortValue).toHaveBeenCalledWith(id, value)
    })
  })

  describe('setConnectablePortIds', () => {
    const store = createDocumentStore('document')()
    const patch = (sourcePort: Port, targetPort: Port, state = {}) => store.$patch({
      ports: {
        [sourcePort.id]: sourcePort,
        [targetPort.id]: targetPort
      },
      ...state
    })

    beforeEach(() => store.$reset())

    it('should include an input port if the source port is an output port', () => {
      const sourcePort = createPort('source-port', '1', PortType.Output)
      const targetPort = createPort('target-port', '2', PortType.Input)

      patch(sourcePort, targetPort)

      store.setConnectablePortIds({ portId: sourcePort.id, isDragging: true })

      expect(store.connectablePortIds).toEqual(['target-port'])
    })

    it('should not include an output port if the source port is also an output port', () => {
      const sourcePort = createPort('source-port', '1', PortType.Output)
      const targetPort = createPort('target-port', '2', PortType.Output)

      patch(sourcePort, targetPort)

      store.setConnectablePortIds({ portId: sourcePort.id, isDragging: true })

      expect(store.connectablePortIds).toEqual([])
    })

    it('should not include a target port that is already connected', () => {
      const connectedTargetPort = createPort('conn-port', '0', PortType.Output)
      const connectedSourcePort = createPort('conn-port-2', '3', PortType.Input)
      const sourcePort = createPort('source-port', '1', PortType.Output)
      const targetPort = createPort('target-port', '2', PortType.Input)
      const connection1 = createConnection('conn1', connectedSourcePort.id, connectedTargetPort.id)
      const connection2 = createConnection('conn2', connectedSourcePort.id, targetPort.id)

      patch(sourcePort, targetPort, {
        connections: {
          [connection2.id]: connection2,
          [connection1.id]: connection1
        },
        ports: {
          [sourcePort.id]: sourcePort,
          [targetPort.id]: targetPort,
          [connectedSourcePort.id]: connectedSourcePort,
          [connectedTargetPort.id]: connectedTargetPort
        }
      })

      store.setConnectablePortIds({ portId: sourcePort.id, isDragging: true })

      expect(store.connectablePortIds).toEqual([])
    })

    it('should not include a target port that is already connected', () => {
      const connectedTargetPort = createPort('conn-port', '0', PortType.Output)
      const connectedSourcePort = createPort('conn-port-2', '3', PortType.Input)
      const sourcePort = createPort('source-port', '1', PortType.Output)
      const targetPort = createPort('target-port', '2', PortType.Input)
      const connection1 = createConnection('conn1', connectedSourcePort.id, connectedTargetPort.id)
      const connection2 = createConnection('conn2', connectedSourcePort.id, targetPort.id)

      patch(sourcePort, targetPort, {
        connections: {
          [connection2.id]: connection2,
          [connection1.id]: connection1
        },
        ports: {
          [sourcePort.id]: sourcePort,
          [targetPort.id]: targetPort,
          [connectedSourcePort.id]: connectedSourcePort,
          [connectedTargetPort.id]: connectedTargetPort
        }
      })

      store.setConnectablePortIds({ portId: sourcePort.id, isDragging: true })

      expect(store.connectablePortIds).toEqual([])
    })

    it('should not include a target port that is a freeport', () => {
      const sourcePort = createPort('source-port', '1', PortType.Output)
      const targetPort = createPort('target-port', '2', PortType.Input, { isFreeport: true })

      patch(sourcePort, targetPort)

      store.setConnectablePortIds({ portId: sourcePort.id, isDragging: true })

      expect(store.connectablePortIds).toEqual([])
    })

    it('should not allow a source port to connect to anything if it is a freeport', () => {
      const sourcePort = createPort('source-port', '1', PortType.Output, { isFreeport: true })
      const targetPort = createPort('target-port', '2', PortType.Input)

      patch(sourcePort, targetPort)

      store.setConnectablePortIds({ portId: sourcePort.id, isDragging: true })

      expect(store.connectablePortIds).toEqual([])
    })

    it('should include an output port if the source port is an input port', () => {
      const sourcePort = createPort('source-port', '1', PortType.Input)
      const targetPort = createPort('target-port', '2', PortType.Output)

      patch(sourcePort, targetPort)

      store.setConnectablePortIds({ portId: sourcePort.id, isDragging: true })

      expect(store.connectablePortIds).toEqual(['target-port'])
    })

    it('should not include an output port if the source port is also an output port', () => {
      const sourcePort = createPort('source-port', '1', PortType.Output)
      const targetPort = createPort('target-port', '2', PortType.Output)

      patch(sourcePort, targetPort)

      store.setConnectablePortIds({ portId: sourcePort.id, isDragging: true })

      expect(store.connectablePortIds).toEqual([])
    })
  })

  describe('setActivePortId', () => {
    const store = createDocumentStore('document')()

    beforeEach(() => {
      store.$reset()

      stubAll(store, ['setConnectablePortIds'])
    })

    describe('when the port ID differs from the currently-active one', () => {
      beforeEach(() => {
        store.$patch({
          activePortId: 'active-port-id'
        })
      })

      it('should define the connectable port IDs if the port ID is defined', () => {
        const portId = 'port-id'

        store.setActivePortId(portId)

        expect(store.setConnectablePortIds).toHaveBeenCalledWith({ portId })
        expect(store.activePortId).toEqual(portId)
        expect(store.selectedPortIndex).toEqual(-1)
      })

      it('should clear the connectable port IDs if the port ID provided is not defined', () => {
        store.setActivePortId(null)

        expect(store.connectablePortIds).toEqual([])
        expect(store.activePortId).toEqual(null)
        expect(store.selectedPortIndex).toEqual(-1)
      })
    })

    it('should not make any changes if the given port ID is already active', () => {
      const activePortId = 'active-port-id'

      store.$patch({ activePortId })
      store.setActivePortId(activePortId)

      expect(store.setConnectablePortIds).not.toHaveBeenCalled()
      expect(store.connectablePortIds).toEqual([])
      expect(store.activePortId).toEqual(activePortId)
      expect(store.selectedPortIndex).toEqual(-1)
    })
  })
})

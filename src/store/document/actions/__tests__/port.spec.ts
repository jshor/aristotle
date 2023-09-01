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
import { CircuitNode, LogicValue } from '@/circuit'
import BinaryWaveService from '@/services/BinaryWaveService'

setActivePinia(createPinia())

describe('port actions', () => {
  beforeEach(() => jest.restoreAllMocks())

  describe('addPort()', () => {
    const store = createDocumentStore('document')()
    const port = createPort('port', 'item', PortType.Input)
    const item = createItem('item', ItemType.InputNode)

    beforeEach(() => {
      store.$reset()
      store.$patch({
        items: { item }
      })

      stubAll(store, ['addVirtualNode'])
    })

    it('should add the port to the state', () => {
      store.addPort(item.id, port)

      expect(store.ports).toHaveProperty(port.id)
      expect(store.ports[port.id]).toEqual(port)
      expect(store.items[item.id].portIds).toContain(port.id)
    })

    it('should add the virtual node if the node is not present on the circuit', () => {
      store.nodes = {}
      store.addPort(item.id, port)

      expect(store.addVirtualNode).toHaveBeenCalledTimes(1)
      expect(store.addVirtualNode).toHaveBeenCalledWith(item)
    })

    it('should bind the reference of the port to the existing circuit node, if present', () => {
      const node = new CircuitNode(port.id)

      store.nodes = { [port.id]: node }
      store.addPort(item.id, port)

      expect(store.addVirtualNode).not.toHaveBeenCalled()
      expect(store.nodes[port.id]).toEqual(node)
    })
  })

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

    beforeEach(() => {
      store.$reset()
      store.$patch({
        items: { item1, item2, freeportItem },
        ports: { inputPort, outputPort, startPort, endPort },
        connections: { connectionPart1, connectionPart2 }
      })

      stubAll(store, [
        'disconnect',
        'unmonitorPort'
      ])
    })

    it('should not do anything if the port does not exist', () => {
      store.removePort('non-existent-port')

      expect(store.disconnect).not.toHaveBeenCalled()
      expect(store.unmonitorPort).not.toHaveBeenCalled()
    })

    function assertRemovePort (description: string, portId: string) {
      describe(description, () => {
        beforeEach(() => store.removePort(portId))

        it('should remove all connections associated to the connection chain', () => {
          expect(store.disconnect).toHaveBeenCalledTimes(2)
          expect(store.disconnect).toHaveBeenCalledWith(connectionPart1)
          expect(store.disconnect).toHaveBeenCalledWith(connectionPart2)
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
  })

  describe('setPortValue', () => {
    const store = createDocumentStore('document')()
    const wave = new BinaryWaveService('port2', 'item1 port2', 0, 0)
    const port1 = createPort('port1', 'item1', PortType.Input)
    const port2 = createPort('port2', 'item1', PortType.Output, { wave })
    const node1 = new CircuitNode('node1')
    const node2 = new CircuitNode('node2')

    beforeEach(() => {
      store.$reset()
      store.$patch({
        ports: { port1, port2 },
        nodes: {
          port1: node1,
          port2: node2
        },
        isCircuitEvaluated: true
      })

      stubAll(node1, ['setValue'])
      stubAll(node2, ['setValue'])
      stubAll(port2.wave!, ['drawPulseChange'])
      stubAll(store, ['advanceSimulation'])
      stubAll(store.circuit, ['enqueue'])
    })

    it('should not change the state if the virtual node does not exist', () => {
      store.setPortValue({ id: null!, value: LogicValue.TRUE })

      expect(store.isCircuitEvaluated).toEqual(true)
      expect(store.circuit.enqueue).not.toHaveBeenCalled()
      expect(store.advanceSimulation).not.toHaveBeenCalled()
    })

    it('should not change the state if the virtual node has not changed its value', () => {
      store.setPortValue({ id: port1.id, value: port1.value })

      expect(node1.setValue).not.toHaveBeenCalled()
      expect(store.isCircuitEvaluated).toEqual(true)
      expect(store.circuit.enqueue).not.toHaveBeenCalled()
      expect(store.advanceSimulation).not.toHaveBeenCalled()
    })

    describe('when the port value has changed', () => {
      const value = LogicValue.TRUE

      beforeEach(() => store.setPortValue({ id: port1.id, value }))

      it('should set the virtual node\'s value to the one provided', () => {
        expect(node1.setValue).toHaveBeenCalledTimes(1)
        expect(node1.setValue).toHaveBeenCalledWith(value)
      })

      it('should push the node into the circuit\'s queue', () => {
        expect(store.circuit.enqueue).toHaveBeenCalledTimes(1)
        expect(store.circuit.enqueue).toHaveBeenCalledWith(node1)
      })

      it('should set isCircuitEvaluated to false', () => {
        expect(store.isCircuitEvaluated).toEqual(false)
      })

      it('should advance the simulation', () => {
        expect(store.advanceSimulation).toHaveBeenCalledTimes(1)
      })

      it('should not advance the simulation when in debugging mode', () => {
        jest.resetAllMocks()

        store.isDebugging = true
        store.setPortValue({ id: port1.id, value })

        expect(store.advanceSimulation).not.toHaveBeenCalled()
      })
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

  describe('togglePortMonitoring', () => {
    const store = createDocumentStore('document')()

    beforeEach(() => store.$reset())

    it('should unmonitor the port if `isMonitored` is true', () => {
      const port = createPort('port', 'item', PortType.Input, {
        isMonitored: true
      })

      stubAll(store, ['unmonitorPort'])
      store.$patch({
        ports: { port }
      })
      store.togglePortMonitoring(port.id)

      expect(store.unmonitorPort).toHaveBeenCalledTimes(1)
      expect(store.unmonitorPort).toHaveBeenCalledWith(port.id)
    })

    it('should monitor the port if `isMonitored` is false', () => {
      const port = createPort('port', 'item', PortType.Input, {
        isMonitored: false
      })

      stubAll(store, ['monitorPort'])
      store.$patch({
        ports: { port }
      })
      store.togglePortMonitoring(port.id)

      expect(store.monitorPort).toHaveBeenCalledTimes(1)
      expect(store.monitorPort).toHaveBeenCalledWith(port.id)
    })
  })

  describe('monitorPort', () => {
    const store = createDocumentStore('document')()
    const portId = 'port-id'
    const itemId = 'item-id'

    beforeEach(() => {
      store.$reset()
      store.$patch({
        items: {
          [itemId]: createItem(itemId, ItemType.InputNode, { portIds: [portId] })
        },
        ports: {
          [portId]: createPort(portId, itemId, PortType.Input)
        },
        isOscilloscopeOpen: false
      })

      stubAll(store.oscillator, ['add'])

      store.monitorPort(portId)
    })

    it('should create a new wave instance on the port', () => {
      const port = store.ports[portId]

      expect(port.wave).toBeInstanceOf(BinaryWaveService)
      expect(port.wave!.name).toEqual(`${store.items[itemId].name} ${port.name}`)
      expect(port.wave!.hue).toEqual(port.hue)
    })

    it('should set `isMonitored` to true', () => {
      expect(store.ports[portId].isMonitored).toBe(true)
    })

    it('should add the port\'s wave to the oscillator', () => {
      const port = store.ports[portId]

      expect(store.oscillator.add).toHaveBeenCalledTimes(1)
      expect(store.oscillator.add).toHaveBeenCalledWith(port.wave)
    })

    it('should open the oscilloscope', () => {
      expect(store.isOscilloscopeOpen).toEqual(true)
    })
  })

  describe('unmonitorPort', () => {
    const store = createDocumentStore('document')()
    const portId = 'port-id'

    beforeEach(() => {
      store.$reset()
      store.$patch({
        ports: {
          [portId]: createPort(portId, 'item-id', PortType.Input)
        },
        isOscilloscopeOpen: false
      })

      stubAll(store.oscillator, ['remove'])

      store.unmonitorPort(portId)
    })

    it('should remove the wave instance from the port', () => {
      expect(store.ports[portId].wave).toBeUndefined()
    })

    it('should set `isMonitored` to false', () => {
      expect(store.ports[portId].isMonitored).toBe(false)
    })

    it('should remove the port\'s wave from the oscillator', () => {
      expect(store.oscillator.remove).toHaveBeenCalledTimes(1)
      expect(store.oscillator.remove).toHaveBeenCalledWith(store.ports[portId].wave)
    })

    it('should remove the port\'s geometry from the oscillogram', () => {
      expect(store.oscillogram).not.toHaveProperty(portId)
    })

    it('should close the oscilloscope when no other waves are visible', () => {
      expect(store.isOscilloscopeOpen).toEqual(false)
    })

    it('should keep the oscilloscope open when other waves are still present', () => {
      store.$patch({
        oscillogram: {
          wave1: {}
        }
      })
      store.unmonitorPort(portId)

      expect(store.isOscilloscopeOpen).toEqual(true)
    })
  })
})

import { setActivePinia, createPinia } from 'pinia'
import PortType from '@/types/enums/PortType'
import ItemType from '@/types/enums/ItemType'
import {
  createConnection,
  createIntegratedCircuit,
  createItem,
  createPort,
  stubAll
} from './__helpers__'
import { createDocumentStore } from '../..'
import { CircuitNode, LogicValue } from '@/circuit'
import circuitNodeMapper from '@/utils/circuitNodeMapper'
import ItemSubtype from '@/types/enums/ItemSubtype'
import ClockService from '@/services/ClockService'
import BinaryWaveService from '@/services/BinaryWaveService'

setActivePinia(createPinia())

describe('simulation actions', () => {
  beforeEach(() => jest.restoreAllMocks())

  describe('toggleClocks()', () => {
    const store = createDocumentStore('document')()
    const item = createItem('item', ItemType.InputNode, {
      clock: new ClockService('clock', 1000, LogicValue.TRUE)
    })

    beforeEach(() => {
      store.$reset()
      store.$patch({
        items: { item }
      })
    })

    it('should start all clocks when the action is "start"', () => {
      jest
        .spyOn(item.clock, 'start')
        .mockImplementation(jest.fn())

      store.toggleClocks('start')

      expect(item.clock.start).toHaveBeenCalledTimes(1)
    })

    it('should stop all clocks when the action is "stop"', () => {
      jest
        .spyOn(item.clock, 'stop')
        .mockImplementation(jest.fn())

      store.toggleClocks('stop')

      expect(item.clock.stop).toHaveBeenCalledTimes(1)
    })
  })

  describe('startSimulation()', () => {
    const store = createDocumentStore('document')()

    beforeEach(() => {
      store.$reset()

      jest
        .spyOn(store.oscillator, 'start')
        .mockImplementation(jest.fn())

      stubAll(store, ['toggleClocks'])
    })

    it('should start the clocks when the debugger is off', () => {
      store.isDebugging = false
      store.startSimulation()

      expect(store.toggleClocks).toHaveBeenCalledTimes(1)
      expect(store.toggleClocks).toHaveBeenCalledWith('start')
    })

    it('should not start the clocks when the debugger is on', () => {
      store.isDebugging = true
      store.startSimulation()

      expect(store.toggleClocks).not.toHaveBeenCalled()
    })

    it('should start the oscillator', () => {
      store.startSimulation()

      expect(store.oscillator.start).toHaveBeenCalledTimes(1)
    })
  })

  describe('stopSimulation()', () => {
    const store = createDocumentStore('document')()

    beforeEach(() => {
      store.$reset()

      jest
        .spyOn(store.oscillator, 'stop')
        .mockImplementation(jest.fn())

      stubAll(store, ['toggleClocks'])

      store.stopSimulation()
    })

    it('should stop the clocks', () => {
      expect(store.toggleClocks).toHaveBeenCalledTimes(1)
      expect(store.toggleClocks).toHaveBeenCalledWith('stop')
    })

    it('should stop the oscillator', () => {
      expect(store.oscillator.stop).toHaveBeenCalledTimes(1)
    })
  })

  describe('advanceSimulation()', () => {
    const store = createDocumentStore('document')()

    beforeEach(() => {
      store.$reset()
      stubAll(store, ['evaluateCircuitStep'])
      store.advanceSimulation()
    })

    it('should set`isCircuitEvaluated` to true', () => {
      expect(store.isCircuitEvaluated).toBe(true)
    })

    it('should invoke evaluateCircuitStep()', () => {
      expect(store.evaluateCircuitStep).toHaveBeenCalledTimes(1)
    })
  })

  describe('toggleDebugger()', () => {
    const store = createDocumentStore('document')()

    beforeEach(() => {
      store.$reset()
      stubAll(store, [
        'stopSimulation',
        'startSimulation',
        'advanceSimulation'
      ])
    })

    it('should trigger the debugger when forced to', () => {
      store.isDebugging = true
      store.toggleDebugger(true)

      expect(store.stopSimulation).toHaveBeenCalledTimes(1)
      expect(store.isDebugging).toBe(true)
    })

    describe('when the debugger is on', () => {
      beforeEach(() => {
        store.isDebugging = true
        store.toggleDebugger()
      })

      it('should restart the simulation', () => {
        expect(store.startSimulation).toHaveBeenCalledTimes(1)
      })

      it('should advance the simulation by one step', () => {
        expect(store.advanceSimulation).toHaveBeenCalledTimes(1)
      })

      it('should flip isDebugging to false', () => {
        expect(store.isDebugging).toBe(false)
      })
    })

    describe('when the debugger is off', () => {
      beforeEach(() => {
        store.isDebugging = false
        store.toggleDebugger()
      })

      it('should stop the simulation', () => {
        expect(store.stopSimulation).toHaveBeenCalledTimes(1)
      })

      it('should flip isDebugging to true', () => {
        expect(store.isDebugging).toBe(true)
      })
    })
  })

  describe('flushCircuit()', () => {
    const store = createDocumentStore('document')()

    beforeEach(() => {
      store.$reset()
      stubAll(store, ['advanceSimulation'])
    })

    it('should advance the simulation', () => {
      store.flushCircuit()
      expect(store.advanceSimulation).toHaveBeenCalledTimes(1)
    })

    it('should restore the debugger value after advancement', () => {
      store.isDebugging = true
      store.flushCircuit()

      expect(store.isDebugging).toBe(true)
    })

    it('should set isCircuitEvaluated to true', () => {
      store.flushCircuit()
      expect(store.isCircuitEvaluated).toBe(true)
    })
  })

  describe('evaluateCircuitStep()', () => {
    const store = createDocumentStore('document')()

    beforeEach(() => {
      store.$reset()

      jest
        .spyOn(store.circuit, 'advance')
        .mockImplementation(() => store.circuit.queue.pop())

      jest.spyOn(store, 'evaluateCircuitStep')
    })

    it('should invoke advance() on the circuit', () => {
      store.evaluateCircuitStep()

      expect(store.circuit.advance).toHaveBeenCalledTimes(1)
    })

    it('should trigger the debugger if an infinite loop is detected', () => {
      stubAll(store, ['toggleDebugger'])

      store.evaluateCircuitStep(1001)

      expect(store.evaluateCircuitStep).toHaveBeenCalledTimes(1)
      expect(store.evaluateCircuitStep).toHaveBeenNthCalledWith(1, 1001)
      expect(store.toggleDebugger).toHaveBeenCalledTimes(1)
    })

    it('should not invoke evaluateCircuitStep() again when the circuit queue is empty', () => {
      store.circuit.queue = []
      store.evaluateCircuitStep()

      expect(store.evaluateCircuitStep).toHaveBeenCalledTimes(1)
      expect(store.evaluateCircuitStep).toHaveBeenNthCalledWith(1)
    })

    describe('when the circuit queue is not empty', () => {
      beforeEach(() => {
        store.circuit.queue = [
          new CircuitNode('test'),
          new CircuitNode('test')
        ]
      })

      it('should invoke evaluateCircuitStep() again when not debugging', () => {
        store.isDebugging = false
        store.evaluateCircuitStep()

        expect(store.evaluateCircuitStep).toHaveBeenCalledTimes(2)
        expect(store.evaluateCircuitStep).toHaveBeenNthCalledWith(1)
        expect(store.evaluateCircuitStep).toHaveBeenNthCalledWith(2, 1)
      })

      describe('when isDebugging is true', () => {
        it('should not invoke evaluateCircuitStep() again when the circuit is not yet finished evaluating', () => {
          store.isDebugging = true
          store.isCircuitEvaluated = false
          store.evaluateCircuitStep()

          expect(store.evaluateCircuitStep).toHaveBeenCalledTimes(1)
          expect(store.evaluateCircuitStep).toHaveBeenNthCalledWith(1)
        })

        it('should invoke evaluateCircuitStep() again when the circuit is evaluated', () => {
          store.isDebugging = true
          store.isCircuitEvaluated = true
          store.evaluateCircuitStep()

          expect(store.evaluateCircuitStep).toHaveBeenCalledTimes(2)
          expect(store.evaluateCircuitStep).toHaveBeenNthCalledWith(1)
          expect(store.evaluateCircuitStep).toHaveBeenNthCalledWith(2, 1)
        })
      })
    })
  })

  describe('resetCircuit()', () => {
    const store = createDocumentStore('document')()
    const item1 = createItem('item1', ItemType.InputNode, {
      portIds: ['port1'],
      properties: {
        startValue: {
          label: 'Start value',
          value: LogicValue.TRUE,
          type: 'number'
        }
      }
    })
    const item2 = createItem('item2', ItemType.InputNode, { portIds: ['port2'] })
    const item3 = createItem('item2', ItemType.OutputNode, { portIds: ['port3'] })
    const port1 = createPort('port1', 'item1', PortType.Output)
    const port2 = createPort('port2', 'item2', PortType.Output)
    const port3 = createPort('port3', 'item3', PortType.Input)

    beforeEach(() => {
      store.$reset()
      store.$patch({
        items: { item1, item2, item3 },
        ports: { port1, port2, port3 }
      })

      stubAll(store, [
        'flushCircuit',
        'setPortValue'
      ])

      store.resetCircuit()
    })

    it('should apply Hi-Z and then low values to all input nodes', () => {
      expect(store.setPortValue).toHaveBeenCalledTimes(5)
      expect(store.setPortValue).toHaveBeenNthCalledWith(1, {
        id: 'port1',
        value: LogicValue.UNKNOWN
      })
      expect(store.setPortValue).toHaveBeenNthCalledWith(2, {
        id: 'port1',
        value: LogicValue.FALSE
      })
      expect(store.setPortValue).toHaveBeenNthCalledWith(3, {
        id: 'port1',
        value: LogicValue.TRUE
      })
      expect(store.setPortValue).toHaveBeenNthCalledWith(4, {
        id: 'port2',
        value: LogicValue.UNKNOWN
      })
      expect(store.setPortValue).toHaveBeenNthCalledWith(5, {
        id: 'port2',
        value: LogicValue.FALSE
      })
    })

    it('should re-evaluate the circuit after each port value change', () => {
      expect(store.flushCircuit).toHaveBeenCalledTimes(5)
    })

    it('should not change the port value for non-input items', () => {
      expect(store.setPortValue).not.toHaveBeenCalledWith({
        id: 'port3',
        value: expect.any(Number)
      })
    })
  })

  describe('addVirtualNode()', () => {
    const store = createDocumentStore('document')()
    const circuitNode = new CircuitNode('test')
    const inputPort = createPort('inputPort', 'item-id', PortType.Input)
    const outputPort = createPort('outputPort', 'item-id', PortType.Output)
    const ports = { inputPort, outputPort }

    beforeEach(() => {
      store.$reset()

      stubAll(store, [
        'addIntegratedCircuitNode',
        'setPortValue',
        'monitorPort'
      ])

      jest
        .spyOn(store.circuit, 'addNode')
        .mockImplementation(jest.fn())
      jest
        .spyOn(store.oscillator, 'add')
        .mockImplementation(jest.fn())
      jest
        .spyOn(circuitNodeMapper, 'getCircuitNode')
        .mockReturnValue(circuitNode)
    })

    it('should not add any nodes if no ports are present on the item', () => {
      const item = createItem('item-id', ItemType.InputNode)

      store.addVirtualNode(item, ports)

      expect(store.circuit.addNode).not.toHaveBeenCalled()
    })

    it('should add the item as an integrated circuit if it contains one', () => {
      const item = createItem('ic', ItemType.IntegratedCircuit, {
        integratedCircuit: createIntegratedCircuit({
          items: {},
          ports: {},
          connections: {}
        }),
        portIds: [inputPort.id]
      })

      store.addVirtualNode(item, ports)

      expect(store.addIntegratedCircuitNode).toHaveBeenCalledTimes(1)
      expect(store.addIntegratedCircuitNode).toHaveBeenCalledWith(item)
    })

    it('should add all input and output ports referenced to this virtual node to the state', () => {
      const item = createItem('item-id', ItemType.InputNode, { portIds: [inputPort.id, outputPort.id] })

      store.addVirtualNode(item, ports)

      expect(store.nodes[inputPort.id]).toEqual(circuitNode)
      expect(store.nodes[outputPort.id]).toEqual(circuitNode)
    })

    it('should add the node to the circuit', () => {
      const item = createItem('item-id', ItemType.InputNode, { portIds: [inputPort.id, outputPort.id] })

      store.addVirtualNode(item, ports)

      expect(store.circuit.addNode).toHaveBeenCalledTimes(1)
      expect(store.circuit.addNode).toHaveBeenCalledWith(circuitNode)
    })

    describe('when the item is a clock', () => {
      const item = createItem('item-id', ItemType.InputNode, {
        subtype: ItemSubtype.Clock,
        portIds: [inputPort.id, outputPort.id],
        properties: {
          interval: {
            type: 'number',
            value: 1500,
            label: 'Interval'
          }
        }
      })

      beforeEach(() => {
        store.addVirtualNode(item, ports)
      })

      it('should add a clock element using the first output port', () => {
        expect(item.clock).toBeInstanceOf(ClockService)
        expect(item.clock.interval).toEqual(item.properties.interval.value)
        // expect(item.clock.value).toEqual(LogicValue.TRUE) // TODO
        expect(store.oscillator.add).toHaveBeenCalledTimes(1)
        expect(store.oscillator.add).toHaveBeenCalledWith(item.clock)
      })

      it('should invoke setPortValue() when the clock value changes', () => {
        item.clock.update(1500)

        expect(store.setPortValue).toHaveBeenCalledTimes(1)
        expect(store.setPortValue).toHaveBeenCalledWith({
          id: outputPort.id,
          value: LogicValue.FALSE // opposite of the start value (TRUE)
        })
      })
    })

    describe('port monitoring', () => {
      const inputPort = createPort('inputPort', 'item-id', PortType.Input, { isMonitored: true })
      const outputPort = createPort('outputPort', 'item-id', PortType.Output)
      const item = createItem('item-id', ItemType.InputNode, {
        portIds: [inputPort.id, outputPort.id]
      })

      beforeEach(() => store.addVirtualNode(item, { inputPort, outputPort }))

      it('should monitor ports that are marked to be monitored', () => {
        expect(store.monitorPort).toHaveBeenCalledTimes(1)
        expect(store.monitorPort).toHaveBeenCalledWith(inputPort.id)
      })

      it('should not monitor ports that are not marked to be monitored', () => {
        expect(store.monitorPort).not.toHaveBeenCalledWith(outputPort.id)
      })
    })
  })

  describe('removeVirtualNode()', () => {
    const store = createDocumentStore('document')()
    const port1 = createPort('port1', 'icItem', PortType.Input)
    const port2 = createPort('port2', 'icItem', PortType.Output)
    const port3 = createPort('port3', 'icEmbeddedItem', PortType.Input)
    const port4 = createPort('port4', 'icEmbeddedItem', PortType.Output)
    const port5 = createPort('port5', 'icItem', PortType.Output)
    const circuitNode1 = new CircuitNode('port1')
    const circuitNode2 = new CircuitNode('port2')
    const icEmbeddedItem = createItem('icEmbeddedItem', ItemType.IntegratedCircuit, {
      integratedCircuit: createIntegratedCircuit({
        items: {
          item: createItem('item', ItemType.InputNode)
        },
        ports: { port3, port4 }
      }),
      portIds: ['port3', 'port4']
    })
    const icItem = createItem('icItem', ItemType.IntegratedCircuit, {
      integratedCircuit: createIntegratedCircuit({
        items: { icEmbeddedItem },
        ports: { port1, port2 }
      }),
      portIds: ['port1', 'port2']
    })
    const item = createItem('item', ItemType.InputNode, { portIds: ['port5'] })

    beforeEach(() => {
      store.$reset()
      store.$patch({
        items: { icItem, item },
        ports: { port1, port2, port3, port4, port5 },
        nodes: {
          port1: circuitNode1,
          port2: circuitNode1,
          port3: circuitNode1,
          port4: circuitNode2,
          port5: circuitNode2
        }
      })

      stubAll(store, ['removePort'])

      jest
        .spyOn(store.circuit, 'removeNode')
        .mockImplementation(jest.fn())
    })

    describe('when the item is an integrated circuit', () => {
      beforeEach(() => store.removeVirtualNode(icItem.id))

      it('should remove all nodes that are referenced to port IDs of the given item', () => {
        expect(store.circuit.removeNode).toHaveBeenCalledTimes(4)
        expect(store.circuit.removeNode).toHaveBeenCalledWith(store.nodes[port1.id])
        expect(store.circuit.removeNode).toHaveBeenCalledWith(store.nodes[port2.id])
        expect(store.circuit.removeNode).toHaveBeenCalledWith(store.nodes[port3.id])
        expect(store.circuit.removeNode).toHaveBeenCalledWith(store.nodes[port4.id])
      })

      it('should remove all ports that are referenced to port IDs of the given item', () => {
        expect(store.removePort).toHaveBeenCalledTimes(4)
        expect(store.removePort).toHaveBeenCalledWith(port1.id)
        expect(store.removePort).toHaveBeenCalledWith(port2.id)
        expect(store.removePort).toHaveBeenCalledWith(port3.id)
        expect(store.removePort).toHaveBeenCalledWith(port4.id)
      })
    })

    describe('when the item is a non-integrated circuit', () => {
      beforeEach(() => store.removeVirtualNode(item.id))

      it('should remove all nodes that are referenced to port IDs of the given item', () => {
        expect(store.circuit.removeNode).toHaveBeenCalledTimes(1)
        expect(store.circuit.removeNode).toHaveBeenCalledWith(store.nodes[port5.id])
      })

      it('should remove all ports that are referenced to port IDs of the given item', () => {
        expect(store.removePort).toHaveBeenCalledTimes(1)
        expect(store.removePort).toHaveBeenCalledWith(port5.id)
      })
    })
  })

  describe('onVirtualNodeChange()', () => {
    const store = createDocumentStore('document')()
    const wave = new BinaryWaveService('wave', 'wave', 1000, 1)
    const port1 = createPort('port1', 'item', PortType.Input, { value: LogicValue.FALSE })
    const port2 = createPort('port2', 'item', PortType.Input, { value: LogicValue.FALSE, wave })
    const node1 = new CircuitNode('port1')
    const node2 = new CircuitNode('port2')
    const item = createItem('item', ItemType.InputNode, { portIds: ['port'] })

    beforeEach(() => {
      store.$reset()
      store.$patch({
        items: { item },
        ports: { port1, port2 },
        nodes: { node1, node2 },
        isCircuitEvaluated: true
      })
    })

    describe('when a port value changes', () => {
      it('should set isCircuitEvaluated to false', () => {
        store.onVirtualNodeChange(node1, ['port1'], LogicValue.TRUE, ['port1'])

        expect(store.isCircuitEvaluated).toBe(false)
      })

      it('should not change isCircuitEvaluated if the node is forced to continue', () => {
        node2.forceContinue = true
        store.onVirtualNodeChange(node2, ['port2'], LogicValue.TRUE, ['port2'])

        expect(store.isCircuitEvaluated).toBe(true)
      })
    })

    it('should set the port value to the new value provided', () => {
      store.onVirtualNodeChange(node1, ['port1'], LogicValue.TRUE, ['port1'])

      expect(store.ports[port1.id].value).toEqual(LogicValue.TRUE)
    })

    it('should invoke drawPulseChange() on a port that contains a wave', () => {
      jest
        .spyOn(wave, 'drawPulseChange')
        .mockImplementation(jest.fn())

      store.onVirtualNodeChange(node2, ['port2'], LogicValue.TRUE, ['port2'])

      // expect(wave.drawPulseChange).toHaveBeenCalledTimes(1)
      expect(wave.drawPulseChange).toHaveBeenCalledWith(LogicValue.TRUE)
    })
  })

  describe('addIntegratedCircuitNode()', () => {
    const store = createDocumentStore('document')()
    const port1 = createPort('port1', 'ic', PortType.Output)
    const port2 = createPort('port2', 'ic', PortType.Input)
    const node1 = new CircuitNode('port1')
    const node2 = new CircuitNode('port2')
    const item = createItem('item', ItemType.OutputNode)
    const connection = createConnection('connection', 'port1', 'port2')
    const ports = { port1, port2 }
    const ic = createItem('ic', ItemType.IntegratedCircuit, {
      integratedCircuit: createIntegratedCircuit({
        ports,
        items: { item },
        connections: { connection }
      })
    })

    beforeEach(() => {
      store.$reset()
      store.$patch({
        items: { item },
        nodes: {
          port1: node1,
          port2: node2
        }
      })
      jest
        .spyOn(store, 'addVirtualNode')
        .mockImplementation(jest.fn())
      jest
        .spyOn(store.circuit, 'addConnection')
        .mockImplementation(jest.fn())
    })

    describe('when the item is a valid integrated circuit', () => {
      beforeEach(() => {
        store.addIntegratedCircuitNode(ic)
      })

      it('should add the connections', () => {
        expect(store.circuit.addConnection).toHaveBeenCalledTimes(1)
        expect(store.circuit.addConnection).toHaveBeenCalledWith(node1, node2, connection.target)
      })

      it('should add the embedded items with all of their ports passed in', () => {
        expect(store.addVirtualNode).toHaveBeenCalledTimes(1)
        expect(store.addVirtualNode).toHaveBeenCalledWith(item, ports)
      })
    })

    it('should not add nodes or connections when no integrated circuit specification is provided', () => {
      store.addIntegratedCircuitNode(item)

      expect(store.addVirtualNode).not.toHaveBeenCalled()
      expect(store.circuit.addConnection).not.toHaveBeenCalled()
    })
  })
})

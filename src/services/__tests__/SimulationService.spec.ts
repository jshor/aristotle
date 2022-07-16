import { createConnection, createIntegratedCircuit, createItem, createPort } from '@/store/document/actions/__tests__/__helpers__'
import ItemSubtype from '@/types/enums/ItemSubtype'
import ItemType from '@/types/enums/ItemType'
import PortType from '@/types/enums/PortType'
import circuitNodeMapper from '@/utils/circuitNodeMapper'
import { CircuitNode } from '@/circuit'
import BinaryWaveService from '../BinaryWaveService'
import ClockService from '../ClockService'
import SimulationService from '../SimulationService'

describe('Simulation Service', () => {
  let service: SimulationService

  beforeEach(() => {
    service = new SimulationService([], [], {})
  })

  afterEach(() => jest.resetAllMocks())

  describe('event emission', () => {
    it('should broadcast when the oscillator broadcasts a change event', () => {
      jest
        .spyOn(service, 'emit')
        .mockImplementation(jest.fn())

      service.oscillator.broadcast()

      expect(service.emit).toHaveBeenCalledTimes(1)
    })

    it('should emit a change event when broadcast', () => {
      const spy = jest.fn()

      service.onChange(spy)
      service.emit()

      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy).toHaveBeenCalledWith(service.valueMap, service.oscillogram)
    })
  })

  describe('addElements()', () => {
    const port1 = createPort('port1', 'ic', PortType.Output)
    const port2 = createPort('port2', 'ic', PortType.Input)
    const item = createItem('item', ItemType.OutputNode)
    const connection = createConnection('connection', 'port1', 'port2')
    const ports = { port1, port2 }

    beforeEach(() => {
      jest
        .spyOn(service, 'addNode')
        .mockImplementation(jest.fn())
      jest
        .spyOn(service, 'addConnection')
        .mockImplementation(jest.fn())

      service.addElements([item], [connection], ports)
    })

    it('should add the connections', () => {
      expect(service.addConnection).toHaveBeenCalledTimes(1)
      expect(service.addConnection).toHaveBeenCalledWith(connection.source, connection.target)
    })

    it('should add the items with both embedded and IC-specified ports passed in', () => {
      expect(service.addNode).toHaveBeenCalledTimes(1)
      expect(service.addNode).toHaveBeenCalledWith(item, ports)
    })
  })

  describe('step()', () => {
    beforeEach(() => {
      jest
        .spyOn(service.circuit, 'next')
        .mockImplementation(jest.fn())
      jest
        .spyOn(service, 'emit')
        .mockImplementation(jest.fn())
    })

    describe('during normal execution', () => {
      beforeEach(() => service.step())

      it('should invoke the next() method on the circuit', () => {
        expect(service.circuit.next).toHaveBeenCalledTimes(1)
      })

      it('should invoke the callback function', () => {
        expect(service.emit).toHaveBeenCalledTimes(1)
      })
    })

    it('should emit an error if the maximum number of iterations has been reached', () => {
      jest.spyOn(service.emitter, 'emit')

      service.step(1000 + 1)

      expect(service.emitter.emit).toHaveBeenCalledTimes(1)
      expect(service.emitter.emit).toHaveBeenCalledWith('error', 'INFINITE_LOOP')
    })

    it('should step through the circuit again with its iteration count incremented if the circuit queue is not empty', () => {
      const spy = jest.spyOn(service, 'step')
      const queue = [new CircuitNode('test')]

      service.circuit = {
        ...service.circuit,
        get queue () {
          return queue.splice(0, 1)
        }
      }
      service.step(0)

      expect(spy).toHaveBeenCalledTimes(2)
      expect(spy).toHaveBeenNthCalledWith(1, 0)
      expect(spy).toHaveBeenNthCalledWith(2, 1)
    })
  })

  describe('setPortValue()', () => {
    const portId = 'port-id'
    const node = new CircuitNode(portId)
    const wave = new BinaryWaveService(portId, portId, 1, 0)

    beforeEach(() => {
      jest
        .spyOn(node, 'setValue')
        .mockImplementation(jest.fn())
      jest
        .spyOn(wave, 'drawPulseChange')
        .mockImplementation(jest.fn())
      jest
        .spyOn(service, 'step')
        .mockImplementation(jest.fn())
      jest
        .spyOn(service.circuit, 'enqueue')
        .mockImplementation(jest.fn())

      service.waves[portId] = wave
      service.nodes[portId] = node
      service.nodes[portId].value = 0
    })

    describe('when the node value has changed', () => {
      const value = 1

      beforeEach(() => {
        service.setPortValue(portId, value)
      })

      it('should set the value of the circuit node to the new one provided', () => {
        expect(node.setValue).toHaveBeenCalledTimes(1)
        expect(node.setValue).toHaveBeenCalledWith(value)
      })

      it('should enqueue the circuit node', () => {
        expect(service.circuit.enqueue).toHaveBeenCalledTimes(1)
        expect(service.circuit.enqueue).toHaveBeenCalledWith(node)
      })

      it('should draw a pulse change on the wave according to the new value', () => {
        expect(wave.drawPulseChange).toHaveBeenCalledTimes(1)
        expect(wave.drawPulseChange).toHaveBeenCalledWith(value)
      })

      it('should trigger a circuit evaluation step', () => {
        expect(service.step).toHaveBeenCalledTimes(1)
      })
    })

    it('should not draw any pulse changes when the value changes and no wave is defined', () => {
      delete service.waves[portId]

      service.setPortValue(portId, 1)

      expect(wave.drawPulseChange).not.toHaveBeenCalled()
    })

    it('should not invoke a node\'s value change method when the value has not changed', () => {
      service.setPortValue(portId, service.nodes[portId].value)

      expect(node.setValue).not.toHaveBeenCalled()
    })

    it('should not trigger a circuit step if the node is not defined', () => {
      delete service.nodes[portId]

      service.setPortValue(portId, 1)

      expect(service.step).not.toHaveBeenCalled()
    })
  })

  describe('addIntegratedCircuit()', () => {
    const port1 = createPort('port1', 'ic', PortType.Output)
    const port2 = createPort('port2', 'ic', PortType.Input)
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
      jest
        .spyOn(service, 'addNode')
        .mockImplementation(jest.fn())
      jest
        .spyOn(service, 'addConnection')
        .mockImplementation(jest.fn())
    })

    describe('when the item is a valid integrated circuit', () => {
      beforeEach(() => {
        service.addIntegratedCircuit(ic)
      })

      it('should add the connections', () => {
        expect(service.addConnection).toHaveBeenCalledTimes(1)
        expect(service.addConnection).toHaveBeenCalledWith(connection.source, connection.target)
      })

      it('should add the embedded items with all of their ports passed in', () => {
        expect(service.addNode).toHaveBeenCalledTimes(1)
        expect(service.addNode).toHaveBeenCalledWith(item, ports, true)
      })
    })

    it('should not add nodes or connections when no integrated circuit specification is provided', () => {
      service.addIntegratedCircuit(item)

      expect(service.addNode).not.toHaveBeenCalled()
      expect(service.addConnection).not.toHaveBeenCalled()
    })
  })

  describe('addNode()', () => {
    const circuitNode = new CircuitNode('test')
    const inputPort = createPort('inputPort', 'item-id', PortType.Input)
    const outputPort = createPort('outputPort', 'item-id', PortType.Output)
    const ports = { inputPort, outputPort }

    beforeEach(() => {
      jest
        .spyOn(service, 'addIntegratedCircuit')
        .mockImplementation(jest.fn())
      jest
        .spyOn(service, 'addPort')
        .mockImplementation(jest.fn())
      jest
        .spyOn(service, 'addClock')
        .mockImplementation(jest.fn())
      jest
        .spyOn(service.circuit, 'addNode')
        .mockImplementation(jest.fn())
      jest
        .spyOn(circuitNodeMapper, 'getCircuitNode')
        .mockReturnValue(circuitNode)
    })

    it('should not add any nodes if no ports are present on the item', () => {
      const item = createItem('item-id', ItemType.InputNode)

      service.addNode(item, ports)

      expect(service.addPort).not.toHaveBeenCalled()
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

      service.addNode(item, ports)

      expect(service.addIntegratedCircuit).toHaveBeenCalledTimes(1)
      expect(service.addIntegratedCircuit).toHaveBeenCalledWith(item)
    })

    it('should add all input and output ports', () => {
      const item = createItem('item-id', ItemType.InputNode, { portIds: [inputPort.id, outputPort.id] })

      service.addNode(item, ports)

      expect(service.addPort).toHaveBeenCalledTimes(2)
      expect(service.addPort).toHaveBeenCalledWith(inputPort.id, circuitNode)
      expect(service.addPort).toHaveBeenCalledWith(outputPort.id, circuitNode)
    })

    it('should add a clock element using the first output port if its subtype is a clock input', () => {
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

      service.addNode(item, ports)

      expect(service.addClock).toHaveBeenCalledTimes(1)
      expect(service.addClock).toHaveBeenCalledWith(outputPort.id, 1500)
    })

    it('should add the node to the circuit', () => {
      const item = createItem('item-id', ItemType.InputNode, { portIds: [inputPort.id, outputPort.id] })

      service.addNode(item, ports)

      expect(service.circuit.addNode).toHaveBeenCalledTimes(1)
      expect(service.circuit.addNode).toHaveBeenCalledWith(circuitNode)
    })
  })

  describe('addClock()', () => {
    const portId = 'port-id'

    beforeEach(() => {
      jest
        .spyOn(service, 'setPortValue')
        .mockImplementation(jest.fn())
      jest
        .spyOn(service.oscillator, 'add')
        .mockImplementation(jest.fn())

      service.addClock(portId)
    })

    it('should change the port value on the clock\'s update callback invocation', () => {
      service.clocks[portId].update(1000)

      expect(service.setPortValue).toHaveBeenCalledTimes(1)
      expect(service.setPortValue).toHaveBeenCalledWith(portId, -1)
    })

    it('should add the new clock to the oscillator', () => {
      expect(service.oscillator.add).toHaveBeenCalledTimes(1)
      expect(service.oscillator.add).toHaveBeenCalledWith(service.clocks[portId])
    })
  })

  describe('addPort()', () => {
    const circuitNode = new CircuitNode('test-node')
    const portId = 'port-id'

    it('should add the given circuit node', () => {

    })

    describe('when the circuit node value changes', () => {
      const value = 1

      beforeEach(() => {
        jest
          .spyOn(circuitNode, 'on')
          .mockImplementation((a, fn) => fn(value))
      })

      it('should draw a pulse change if a wave is associated with it', () => {
        const wave = new BinaryWaveService('test', 'test', 1, 0)

        jest
          .spyOn(wave, 'drawPulseChange')
          .mockImplementation(jest.fn())

        service.waves[portId] = wave
        service.addPort(portId, circuitNode)

        expect(wave.drawPulseChange).toHaveBeenCalledTimes(1)
        expect(wave.drawPulseChange).toHaveBeenCalledWith(value)
      })
    })
  })

  describe('removePort()', () => {
    const portId = 'port-id'

    beforeEach(() => {
      jest
        .spyOn(service, 'unmonitorPort')
        .mockImplementation(jest.fn())
    })

    it('should remove the clock from the oscillator if one exists', () => {
      const clock = new ClockService('test', 1000, 1)

      jest
        .spyOn(service.oscillator, 'remove')
        .mockImplementation(jest.fn())

      service.clocks[portId] = clock
      service.removePort(portId)

      expect(service.oscillator.remove).toHaveBeenCalledTimes(1)
      expect(service.oscillator.remove).toHaveBeenCalledWith(clock)
    })

    it('should remove the node associated with the port', () => {
      service.nodes[portId] = new CircuitNode('test')
      service.removePort(portId)

      expect(service.nodes).not.toHaveProperty(portId)
    })

    it('should remove the node associated with the port', () => {
      service.valueMap[portId] = 1
      service.removePort(portId)

      expect(service.valueMap).not.toHaveProperty(portId)
    })

    it('should remove the node associated with the port', () => {
      service.clocks[portId] = new ClockService('test', 1000, 1)
      service.removePort(portId)

      expect(service.clocks).not.toHaveProperty(portId)
    })
  })

  describe('addConnection()', () => {
    const sourceId = 'source-id'
    const targetId = 'target-id'

    beforeEach(() => {
      jest
        .spyOn(console, 'log')
        .mockImplementation(jest.fn()) // TODO: only temporary
      jest
        .spyOn(service.circuit, 'addConnection')
        .mockImplementation(jest.fn())
    })

    it('should add a new connection if both source and target circuit nodes are defined', () => {
      service.nodes[sourceId] = new CircuitNode('source')
      service.nodes[targetId] = new CircuitNode('target')

      service.addConnection(sourceId, targetId)

      expect(service.circuit.addConnection).toHaveBeenCalledTimes(1)
      expect(service.circuit.addConnection).toHaveBeenCalledWith(service.nodes[sourceId], service.nodes[targetId], targetId)
    })

    it('should not add a new connection if the target node does not exist', () => {
      service.nodes[sourceId] = new CircuitNode('source')

      service.addConnection(sourceId, targetId)

      expect(service.circuit.addConnection).not.toHaveBeenCalled()
    })

    it('should not add a new connection if the source node does not exist', () => {
      service.nodes[targetId] = new CircuitNode('target')

      service.addConnection(sourceId, targetId)

      expect(service.circuit.addConnection).not.toHaveBeenCalled()
    })
  })

  describe('removeConnection()', () => {
    const sourceId = 'source-id'
    const targetId = 'target-id'

    beforeEach(() => {
      jest
        .spyOn(console, 'log')
        .mockImplementation(jest.fn()) // TODO: only temporary
      jest
        .spyOn(service.circuit, 'removeConnection')
        .mockImplementation(jest.fn())
    })

    it('should remove the connection if both source and target circuit nodes are defined', () => {
      service.nodes[sourceId] = new CircuitNode('source')
      service.nodes[targetId] = new CircuitNode('target')

      service.removeConnection(sourceId, targetId)

      expect(service.circuit.removeConnection).toHaveBeenCalledTimes(1)
      expect(service.circuit.removeConnection).toHaveBeenCalledWith(service.nodes[sourceId], service.nodes[targetId])
    })

    it('should not remove any connections if the target node does not exist', () => {
      service.nodes[sourceId] = new CircuitNode('source')

      service.removeConnection(sourceId, targetId)

      expect(service.circuit.removeConnection).not.toHaveBeenCalled()
    })

    it('should not remove any connections if the source node does not exist', () => {
      service.nodes[targetId] = new CircuitNode('target')

      service.removeConnection(sourceId, targetId)

      expect(service.circuit.removeConnection).not.toHaveBeenCalled()
    })
  })

  describe('monitorPort()', () => {
    const portId = 'port-id'

    beforeEach(() => {
      jest
        .spyOn(service.oscillator, 'add')
        .mockImplementation(jest.fn())
    })

    it('should add the wave to the oscillator if it does not already exist', () => {
      service.monitorPort(portId, 1, 0)

      expect(service.waves).toHaveProperty(portId)
      expect(service.oscillator.add).toHaveBeenCalledTimes(1)
      expect(service.oscillator.add).toHaveBeenCalledWith(service.waves[portId])
    })

    it('should not add the wave to the oscillator if it already exists', () => {
      service.waves[portId] = new BinaryWaveService(portId, portId, 1, 0)
      service.monitorPort(portId, 1, 0)

      expect(service.oscillator.add).not.toHaveBeenCalled()
    })
  })

  describe('unmonitorPort()', () => {
    const portId = 'port-id'

    beforeEach(() => {
      jest
        .spyOn(service.oscillator, 'remove')
        .mockImplementation(jest.fn())
      jest
        .spyOn(service.oscillator, 'broadcast')
        .mockImplementation(jest.fn())
    })

    describe('when the wave exists', () => {
      const wave = new BinaryWaveService(portId, portId, 1, 0)

      beforeEach(() => {
        service.waves[portId] = wave
        service.unmonitorPort(portId)
      })

      it('should remove the wave from the oscillator', () => {
        expect(service.oscillator.remove).toHaveBeenCalledTimes(1)
        expect(service.oscillator.remove).toHaveBeenCalledWith(wave)
      })

      it('should broadcast the signals', () => {
        expect(service.oscillator.broadcast).toHaveBeenCalledTimes(1)
      })

      it('should remove the wave from the simulation', () => {
        expect(service.waves).not.toHaveProperty(portId)
      })
    })

    it('should not remove or broadcast anything if the wave does not exist', () => {
      service.unmonitorPort(portId)

      expect(service.oscillator.remove).not.toHaveBeenCalled()
      expect(service.oscillator.broadcast).not.toHaveBeenCalled()
    })
  })
})

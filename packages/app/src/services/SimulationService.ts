import { Circuit, CircuitNode, Nor, InputNode, OutputNode, Buffer } from '@aristotle/logic-circuit'
import BinaryWaveService from './BinaryWaveService'
import ClockService from './ClockService'
import OscillationService from './OscillationService'
import ItemType from '@/types/enums/ItemType'
import ItemSubtype from '@/types/enums/ItemSubtype'
import PortType from '@/types/enums/PortType'

/**
 * The SimulationService ties together all aspects of a running simulation, including clock pulses, oscilloscope
 * wave management, and circuit component I/O. Effectively serves as an oracle for all circuit computations.
 */
export default class SimulationService {
  nodes: { [id: string]: CircuitNode } = {}

  waves: { [id: string]: BinaryWaveService } = {}

  clocks: { [id: string]: ClockService } = {}

  valueMap: { [id: string]: number } = {}

  circuit: Circuit = new Circuit()

  oscillator: OscillationService = new OscillationService()

  fn: Function = () => {}

  isPaused: boolean = false

  payload: OscilloscopeInfo = {
    waves: {},
    secondsElapsed: 0,
    secondsOffset: 0
  }

  constructor (items: Item[], connections: Connection[], ports: { [i: string]: Port }) {
    items.forEach(item => this.addNode(item, ports))
    connections.forEach(c => this.addConnection(c.source, c.target))

    this.oscillator.onChange(payload => {
      this.payload = payload
      this.fn(this.valueMap, payload)
    })
    this.oscillator.start()
  }

  onChange = (fn: Function) => {
    this.fn = fn
  }

  debugMode: boolean = false

  pause = () => {
    this.oscillator.stop()
    this.isPaused = true
  }

  unpause = () => {
    this.isPaused = false
    this.oscillator.start()
    this.fn(this.valueMap, this.payload)
  }

  step = (iteration: number = 0) => {
    if (this.isPaused) return

    this.circuit.next()

    const shouldContinue = this.circuit.queue.length > 0

    if (iteration > 10000) {
      // TODO: configure this to detect infinite loops...
      throw new Error('An infinite loop detected!')
    }

    if (shouldContinue) {
      this.step(++iteration)
    }

    this.fn(this.valueMap, this.payload)
  }

  setOutputValue = (id: string, value: number) => {
    this.valueMap[id] = value
    this.fn(this.valueMap)
  }

  setPortValue = (portId: string, value: number) => {
    if (this.nodes[portId].value !== value) {
      this.nodes[portId].setValue(value)
      this.circuit.enqueue(this.nodes[portId])
      this.waves[portId]?.drawPulseChange(value)
      this.step()
    }
  }

  getLogicGateNode = (subtype: string, id: string, inputIds: string[]): CircuitNode => {
    switch (subtype) {
      case ItemSubtype.And:
        return new Nor(id, inputIds)
      default:
        return new Nor(id, inputIds)
    }
  }

  getCircuitNode = ({ id, type, subtype }: Item, inputIds: string[]): CircuitNode => {
    switch (type) {
      case ItemType.CircuitNode:
        return new CircuitNode(id, inputIds)
      case ItemType.InputNode:
        return new InputNode(id, inputIds)
      case ItemType.LogicGate:
        return this.getLogicGateNode(subtype, id, inputIds)
      case ItemType.Buffer:
      case ItemType.Freeport:
        return new Buffer(id, inputIds)
      default:
        return new OutputNode(id, inputIds) // TODO: use generic CircuitNode instead?
    }
  }

  addIntegratedCircuit = (item: Item, embeddedPorts: { [id: string]: Port }) => {
    if (!item.integratedCircuit) return

    const { items, connections, ports } = item.integratedCircuit

    Object
      .values(items)
      .forEach(item => this.addNode(item, { ...ports, ...embeddedPorts }, true))

    Object
      .values(connections)
      .forEach(c => this.addConnection(c.source, c.target))

    // this.monitorNode(item, ports)
  }

  addNode = (item: Item, ports: { [id: string]: Port }, forceContinue: boolean = false) => {
    if (item.portIds.length === 0) return // if there are no ports, then there is nothing to add

    if (item.integratedCircuit) {
      return this.addIntegratedCircuit(item, ports)
    }

    const inputIds = item.portIds.filter(portId => ports[portId].type === PortType.Input)
    const outputIds = item.portIds.filter(portId => ports[portId].type === PortType.Output)
    const node = this.getCircuitNode(item, inputIds)

    node.forceContinue = forceContinue

    inputIds.forEach(portId => this.addPort(portId, node))
    outputIds.forEach(portId => this.addPort(portId, node))

    if (item.type === ItemType.InputNode && item.subtype === ItemSubtype.Clock) {
      this.addClock(outputIds[0])
    }

    this.circuit.addNode(node)

    if (!forceContinue) {
      this.monitorNode(item, ports) // TODO: comment back in to get initial oscilloscope
    }
  }

  removeNode = (portIds: string[] = []) => {
    const node = this.nodes[portIds[0]]

    if (node) {
      this.circuit.removeNode(node)

      portIds.forEach(this.removePort)
    }
  }

  monitorNode = (item: Item, ports: Record<string, Port>) => {
    if (item.properties?.showInOscilloscope?.value) {
      const inputIds = item.portIds.filter(portId => ports[portId].type === PortType.Input)
      const outputIds = item.portIds.filter(portId => ports[portId].type === PortType.Output)
      const portIds = item.type == ItemType.OutputNode
      ? inputIds // for output nodes, all incoming signals should be monitored
      : outputIds // for all other nodes, only its output signal should be monitored

      portIds.forEach(portId => {
        this.monitorPort(portId, this.nodes[portId].value)
      })
    }
  }

  addClock = (portId: string) => {
    this.clocks[portId] = new ClockService(portId, 1000)
    this.clocks[portId].onUpdate((value: number) => {
      this.setPortValue(portId, value)
    })
    this.oscillator.add(this.clocks[portId])
  }

  addSiblingPort = (portId: string, siblingPortId: string) => {
    this.addPort(portId, this.nodes[siblingPortId])
  }

  addPort = (portId: string, node: CircuitNode) => {
    this.nodes[portId] = node

    node.on('change', (value: number) => {
      this.setOutputValue(portId, value)
      this.waves[portId]?.drawPulseChange(value)
    })
  }

  removePort = (portId: string) => { // TODO: need to remove wave from oscillation
    if (this.clocks[portId]) {
      this.oscillator.remove(this.clocks[portId])
    }

    this.unmonitorPort(portId)

    delete this.nodes[portId]
    delete this.valueMap[portId]
    delete this.clocks[portId]
  }

  addConnection = (sourceId: string, targetId: string) => {
    if (this.nodes[sourceId] && this.nodes[targetId]) {
      this.circuit.addConnection(this.nodes[sourceId], this.nodes[targetId], targetId)
    } else {
      console.log('MISSING NODE FOR ADDING CONNECTION: ', this.nodes[sourceId], this.nodes[targetId], sourceId, targetId)
    }
  }

  removeConnection = (sourceId: string, targetId: string) => {
    if (this.nodes[sourceId] && this.nodes[targetId]) {
      this.circuit.removeConnection(this.nodes[sourceId], this.nodes[targetId])
    } else {
      console.log('MISSING NODE FOR REMOVING CONNECTION: ', this.nodes[sourceId], this.nodes[targetId], sourceId, targetId)
    }
  }

  monitorPort = (portId: string, value: number) => {
    if (!this.waves[portId]) {
      this.waves[portId] = new BinaryWaveService(portId, value)
      this.oscillator.add(this.waves[portId])
    }
  }

  unmonitorPort = (portId: string) => {
    if (this.waves[portId]) {
      this.oscillator.remove(this.waves[portId])
      this.oscillator.broadcast()

      delete this.waves[portId]
    }
  }
}

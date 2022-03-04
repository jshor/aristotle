import PortType from '@/types/enums/PortType'
import { Circuit, CircuitNode, Nor, InputNode, OutputNode, ProxyNode, Buffer } from '@aristotle/logic-circuit'
import BinaryWaveService from './BinaryWaveService'
import OscillationService from './OscillationService'

export default class CircuitService {
  nodes: { [id: string]: CircuitNode } = {}

  waves: { [id: string]: BinaryWaveService } = {}

  valueMap: { [id: string]: number } = {}

  circuit: Circuit = new Circuit()

  oscillator: OscillationService = new OscillationService()

  fn: Function = () => {}

  isPaused: boolean = false

  payload: any = {
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
  }

  onChange = (fn: Function) => {
    this.fn = fn
  }

  debugMode: boolean = false

  pause = () => {
    this.isPaused = true
  }

  unpause = () => {
    this.isPaused = false
    this.fn(this.valueMap, this.payload)
  }

  step = (force = false) => {
    if (this.isPaused) return

    if (!this.circuit.isComplete() || force) {
      this.circuit.next()

      if (!this.debugMode) { // TODO: check for infinite loops
        return this.step()
      }
    }
    this.fn(this.valueMap, this.payload)
  }

  setOutputValue = (id: string, value: number) => {
    this.valueMap[id] = value
    // console.log('map: ', this.valueMap)
    this.fn(this.valueMap)
  }

  setPortValue = (portId: string, value: number) => {
    this.nodes[portId].setValue(value)
    this.circuit.enqueue(this.nodes[portId])
    this.waves[portId]?.drawPulseChange(value)
    this.step()
  }

  getCircuitNode = (type: string, id: string, inputIds: string[]): CircuitNode => {
    switch (type) {
      case 'InputNode':
        return new InputNode(id, inputIds)
      case 'LogicGate':
        return new Nor(id, inputIds)
      case 'Freeport':
        return new Buffer(id, inputIds)
      default:
        return new OutputNode(id, inputIds) // TODO: use generic CircuitNode instead?
    }
  }

  addIntegratedCircuit = (item: Item) => {
    if (!item.integratedCircuit) return

    const { items, connections, ports } = item.integratedCircuit

    Object
      .values(items)
      .forEach(item => this.addNode(item, ports, true))
    Object
      .values(connections)
      .forEach(c => this.addConnection(c.source, c.target))
  }

  addNode = (item: Item, ports: { [id: string]: Port }, forceContinue: boolean = false) => {
    if (item.portIds.length === 0) return // if there are no ports, then there is nothing to add

    if (item.type === 'IntegratedCircuit') {
      return this.addIntegratedCircuit(item)
    }

    const inputIds = item.portIds.filter(portId => ports[portId].type === PortType.Input)
    const outputIds = item.portIds.filter(portId => ports[portId].type === PortType.Output)
    const node = this.getCircuitNode(item.type, item.id, inputIds)
    const subscribe = (portId: string) => {
      this.nodes[portId] = node

      node.on('change', (value: number) => {
        this.setOutputValue(portId, value)
        this.waves[portId]?.drawPulseChange(value)
      })
    }

    node.forceContinue = forceContinue

    inputIds.forEach(subscribe)
    outputIds.forEach(subscribe)

    this.circuit.addNode(node)
  }

  monitorPort = (portId: string, value: number) => {
    this.waves[portId] = new BinaryWaveService(portId, value)
    this.oscillator.add(this.waves[portId])
  }

  unmonitorPort = (portId: string) => {
    if (this.waves[portId]) {
      this.oscillator.remove(this.waves[portId])
      this.oscillator.broadcast()
    }
  }

  removeNode = (portIds: string[] = []) => {
    const node = portIds
      .map(portId => this.nodes[portId])
      .find(node => !!node)

    if (node) {
      this.circuit.removeNode(node)

      portIds.forEach(portId => {
        delete this.nodes[portId]
        delete this.valueMap[portId]

        this.unmonitorPort(portId)
      })
    } else {
      console.log('DID NOT FIND NODE FOR: ', portIds)
    }
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
}

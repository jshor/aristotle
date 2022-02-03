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
    // this.oscillator.start() // TODO: uncomment to allow oscilloscope
  }

  onChange = (fn: Function) => {
    this.fn = fn
  }

  debugMode: boolean = false

  step = (force = false) => {
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

  setPortValue2 = (portId: string, value: number) => {
    this.nodes[portId].value = value
    this.nodes[portId].newValue = value
    // this.nodes[portId].updateOutputs(value)
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
      .forEach(item => this.addNode(item, ports, true, false))
    Object
      .values(connections)
      .forEach(c => this.addConnection(c.source, c.target))
  }

  addNode = (item: Item, ports: { [id: string]: Port }, forceContinue: boolean = false, showInOscilloscope: boolean = true) => {
    if (item.portIds.length === 0) return // if there are no ports, then there is nothing to add

    if (item.type === 'IntegratedCircuit') {
      return this.addIntegratedCircuit(item)
    }

    const inputIds = item.portIds.filter(portId => ports[portId].type === PortType.Input)
    const outputIds = item.portIds.filter(portId => ports[portId].type === PortType.Output)
    const node = this.getCircuitNode(item.type, item.id, inputIds)

    node.forceContinue = forceContinue
    // node.value = 1

    inputIds.forEach(inputId => {
      // this.setOutputValue(inputId, 0)
      this.nodes[inputId] = node
      node.on('change', (value: number) => {
        this.setOutputValue(inputId, value)
      })
    })

    outputIds.forEach(outputId => {
      // this.setOutputValue(outputId, ports[outputId].value)
      this.nodes[outputId] = node

      if (showInOscilloscope) {
        this.waves[outputId] = new BinaryWaveService(outputId)
        this.oscillator.add(this.waves[outputId])
      }

      node.on('change', (value: number) => {
        this.setOutputValue(outputId, value)
        this.waves[outputId]?.drawPulseChange(value)
      })
    })

    this.circuit.addNode(node)
  }

  removeNode = (portIds: string[] = []) => {
    const node = portIds
      .map(portId => this.nodes[portId])
      .find(node => !!node)

    if (node) {
      this.circuit.removeNode(node)
      // this.oscillator.remove(this.waves)

      portIds.forEach(portId => {
        delete this.nodes[portId]
        delete this.valueMap[portId]
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
      // this.next()
    } else {
      console.log('MISSING NODE FOR REMOVING CONNECTION: ', this.nodes[sourceId], this.nodes[targetId], sourceId, targetId)
    }
  }
}

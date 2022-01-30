import PortType from '@/types/enums/PortType'
import { Circuit, CircuitNode, Nor, InputNode, OutputNode, ProxyNode } from '@aristotle/logic-circuit'
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
      default:
        return new OutputNode(id, inputIds)
    }
  }

  addNode = (item: Item, ports: { [id: string]: Port }) => {
    if (item.portIds.length === 0) return // if there are no ports, then there is nothing to add

    const inputIds = item.portIds.filter(portId => ports[portId].type === PortType.Input)
    const outputId = item.portIds.find(portId => ports[portId].type === PortType.Output)
    const node = this.getCircuitNode(item.type, item.id, inputIds)

    inputIds.forEach(inputId => {
      this.nodes[inputId] = node
      node.on('change', (value: number) => {
        this.setOutputValue(inputId, value)
      })
    })

    if (outputId) {
      this.nodes[outputId] = node
      this.waves[outputId] = new BinaryWaveService(outputId)
      this.oscillator.add(this.waves[outputId])

      node.on('change', (value: number) => {
        this.setOutputValue(outputId, value)
        this.waves[outputId].drawPulseChange(value)
      })
    }

    this.circuit.addNode(node)
  }

  addConnection = (sourceId: string, targetId: string) => {
    this.circuit.addConnection(this.nodes[sourceId], this.nodes[targetId], targetId)
  }

  removeConnection = (sourceId: string, targetId: string) => {
    this.circuit.removeConnection(this.nodes[sourceId], this.nodes[targetId])
  }
}

import { Circuit, CircuitNode } from '@/circuit'
import { TinyEmitter } from 'tiny-emitter'
import BinaryWaveService from './BinaryWaveService'
import ClockService from './ClockService'
import OscillationService from './OscillationService'
import ItemType from '@/types/enums/ItemType'
import ItemSubtype from '@/types/enums/ItemSubtype'
import PortType from '@/types/enums/PortType'
import circuitNodeMapper from '@/utils/circuitNodeMapper'

/**
 * The SimulationService ties together all aspects of a running simulation, including clock pulses, oscilloscope
 * wave management, and circuit component I/O. Effectively serves as an oracle for all circuit computations.
 *
 * It is important that the simulation maintains the state of the circuit separately from the editor state, as
 * components may be removed/added/changed in the editor by the user at any time. Maintaining them separate allows
 * the state of components present in the editor to be persisted.
 *
 * There is a one-to-one relationship between SimulationService instances and Document instances.
 */
export default class SimulationService {
  /** Mapping of port IDs to their respective circuit nodes. */
  nodes: Record<string, CircuitNode> = {}

  /** Mapping of port IDs to their respective nodes' binary wave instances. */
  waves: Record<string, BinaryWaveService> = {}

  /** Mapping of port IDs to their respective nodes' clock instances. */
  clocks: Record<string, ClockService> = {}

  /** Mapping of port IDs to their respective current values. */
  valueMap: Record<string, number> = {}

  /** Logical circuit instance. */
  circuit: Circuit = new Circuit()

  /** Circuit oscillator. */
  oscillator: OscillationService = new OscillationService()

  /** Event emitter. */
  emitter: TinyEmitter = new TinyEmitter()

  /** Whether or not the simulation is paused. */
  isPaused: boolean = true

  /** Oscillogram data, containing each BinaryWave instance observed in the oscilloscope. */
  oscillogram: Oscillogram = {}

  /**
   * Constructor.
   *
   * @param items
   * @param connections
   * @param ports
   */
  constructor (items: Item[], connections: Connection[], ports: Record<string, Port>) {
    this.addElements(items, connections, ports)
    this.oscillator.on('change', oscillogram => {
      this.oscillogram = oscillogram
      this.emit()
    })
  }

  /**
   * Adds the given items and connections with the given ports to the simulation.
   *
   * @param items
   * @param connections
   * @param ports
   */
  addElements = (items: Item[], connections: Connection[], ports: Record<string, Port>) => {
    items.forEach(item => this.addNode(item, ports))
    connections.forEach(c => this.addConnection(c.source, c.target))
  }

  /**
   * Event listener.
   *
   * @param event - available values: `change`
   * @param fn - callback function, taking the port-value mapping as the first argument and oscillogram data as the second
   */
  on = (event: 'change', fn: (valueMap: Record<string, number>, oscillogram: Oscillogram) => void) => {
    this.emitter.on(event, fn)
  }

  /**
   * Emits a change event.
   *
   * @emits change when the oscillogram or any value changes changes
   */
  emit = () => {
    this.emitter.emit('change', this.valueMap, this.oscillogram)
  }

  /**
   * Pauses the simulation.
   */
  pause = () => {
    this.oscillator.stop()
    this.isPaused = true
  }

  /**
   * Continues the simulation.
   */
  unpause = () => {
    this.isPaused = false
    this.oscillator.start()
    this.emit()
  }

  /**
   * Advances the simulation by one step.
   *
   * @param [iteration = 0] - internal iteration count (should always invoke using `0` or undefined)
   */
  step = (iteration: number = 0) => {
    if (this.isPaused) return

    this.circuit.next()

    const shouldContinue = this.circuit.queue.length > 0 // TODO: use circuit.isComplete()?

    if (iteration > 10000) {
      // TODO: configure this to detect infinite loops...
      throw new Error('An infinite loop detected!')
    }

    if (shouldContinue) {
      this.step(++iteration)
    }

    this.emit()
  }

  canContinue: boolean = false

  nextState: string | null = null

  isDebug: boolean = false

  nextValueMap: Record<string, number> = {}

  startDebugging = () => {
    this.isDebug = true
    this.pause()
    this.computeNextState()
  }

  stopDebugging = () => {
    this.isDebug = false
    this.nextState = null
    this.unpause()
  }

  advance = () => {
    const nextValues = Object.keys(this.nextValueMap)

    if (nextValues.length > 0) {
      // at least one value change was triggered by the editor since last advance
      nextValues.forEach(portId => this.updatePortValue(portId, this.nextValueMap[portId]))
    } else if (this.nextState) {
      // no inputs are pending updates, and there is a new state to advance to
      this.valueMap = JSON.parse(this.nextState) as Record<string, number>
    }

    this.nextValueMap = {}
    this.computeNextState()
    this.emit()
  }

  computeNextState = () => {
    const currentState = JSON.stringify(this.valueMap)

    this.circuit.next()

    const nextState = JSON.stringify(this.valueMap)

    if (currentState !== nextState) {
      this.nextState = nextState
    } else {
      this.nextState = null
    }

    this.canContinue = this.nextState !== null
  }

  /**
   * Sets the output value of a given target node.
   *
   * @param id - ID of the port with new value
   * @param value - new value to set
   */
  setOutputValue = (id: string, value: number) => {
    this.valueMap[id] = value
    this.emit()
  }

  updatePortValue = (portId: string, value: number) => {
    this.nodes[portId].setValue(value)
    this.circuit.enqueue(this.nodes[portId])
    this.waves[portId]?.drawPulseChange(value)
  }

  enqueuePortValueChange = (portId: string, value: number) => {
    this.nextValueMap[portId] = value

    // circuit can continue only if one or more port values have changed
    this.canContinue = Object
      .keys(this.nextValueMap)
      .reduce((anyValueChanged: boolean, portId) => {
        return anyValueChanged || this.valueMap[portId] !== this.nextValueMap[portId]
      }, false)

    this.emit()
  }

  /**
   * Sets a port's value logical value, performing all necessary simulation operations that result from such an action.
   *
   * This should be invoked by the document.
   *
   * @param portId
   * @param value - new logical value
   */
  setPortValue = (portId: string, value: number) => {
    if (this.isDebug) {
      return this.enqueuePortValueChange(portId, value)
    }

    if (this.nodes[portId] && this.nodes[portId].value !== value) {
      this.updatePortValue(portId, value)
      this.step()
    }
  }

  /**
   * Adds an integrated circuit to the simulation.
   *
   * @param item - the high-level integrated circuit item
   */
  addIntegratedCircuit = (icItem: Item) => {
    if (!icItem.integratedCircuit) return

    const { items, connections, ports } = icItem.integratedCircuit

    Object
      .values(items)
      .forEach(item => {
        this.addNode(item, ports, true)
      })

    Object
      .values(connections)
      .forEach(c => {
        this.addConnection(c.source, c.target)
      })
  }

  /**
   * Adds new a node to the simulation.
   *
   * @param item - item to add
   * @param ports - port mapping to reference (if an IC, then use the ports within the document itself)
   * @param [forceContinue] - if true, forces the circuit node to evaluate immediately
   */
  addNode = (item: Item, ports: Record<string, Port>, forceContinue: boolean = false) => {
    if (item.portIds.length === 0) return // if there are no ports, then there is nothing to add

    if (item.integratedCircuit) {
      return this.addIntegratedCircuit(item)
    }

    const inputIds = item.portIds.filter(portId => ports[portId].type === PortType.Input)
    const outputIds = item.portIds.filter(portId => ports[portId].type === PortType.Output)
    const node = circuitNodeMapper.getCircuitNode(item, inputIds)

    if (forceContinue) {
      node.forceContinue = true
    }

    item.portIds.forEach(portId => this.addPort(portId, node))

    if (item.type === ItemType.InputNode && item.subtype === ItemSubtype.Clock) {
      this.addClock(outputIds[0])
    }

    this.circuit.addNode(node)

    item.portIds.forEach(portId => {
      const port = ports[portId]

      if (port.isMonitored) {
        this.monitorPort(portId, port.value, port.hue)
      }
    })
  }

  /**
   * Removes a node and all of its ports from the simulation.
   *
   * @param portIds - list of IDs of ports associated with the node (at least one matching is required)
   */
  removeNode = (item: Item) => {
    /** returns the port IDs of all ports that are related to the given integrated circuit */
    const getIntegratedCircuitPortIds = (ic: Item): string[] => {
      if (!ic.integratedCircuit) return []

      return Object
        .values(ic.integratedCircuit.items)
        .reduce((portIds, i) => {
          if (i.integratedCircuit) {
            return portIds
              .concat(getIntegratedCircuitPortIds(i))
              .concat(i.portIds)
          }
          return portIds.concat(i.portIds)
        }, [] as string[])
    }

    // remove all nodes that are referenced to port IDs of the given item
    item
      .portIds
      .concat(getIntegratedCircuitPortIds(item)) // ...including IC ports
      .forEach(portId => {
        const node = this.nodes[portId]

        if (node) {
          this.circuit.removeNode(node)
          this.removePort(portId)
        }
      })

    this.emit()
  }

  /**
   * Adds an interval clock to the circuit.
   *
   * @param portId
   */
  addClock = (portId: string) => {
    this.clocks[portId] = new ClockService(portId, 1000, 1) // TODO: make 1000 configurable by the item
    this.clocks[portId].on('change', (signal: number) => {
      this.setPortValue(portId, signal)
    })
    this.oscillator.add(this.clocks[portId])
  }

  /**
   * Adds a port to the simulation.
   *
   * @param portId - ID of the port associated with the node
   * @param node - circuit node
   */
  addPort = (portId: string, node: CircuitNode) => {
    this.nodes[portId] = node

    node.on('change', (value: number) => {
      this.setOutputValue(portId, value)
      this.waves[portId]?.drawPulseChange(value)
    })
  }

  /**
   * Removes a port from the simulation and all associations of it.
   * Associations include circuit nodes, value mappings, and any active clocks and waves.
   *
   * @param portId
   */
  removePort = (portId: string) => { // TODO: need to remove wave from oscillation
    if (this.clocks[portId]) {
      this.oscillator.remove(this.clocks[portId])
    }

    this.unmonitorPort(portId)

    delete this.nodes[portId]
    delete this.valueMap[portId]
    delete this.clocks[portId]
    delete this.waves[portId]
  }

  /**
   * Adds a new connection between the given source and target ports.
   * This requires that the circuit nodes for both the source and target have been added to the simulation.
   *
   * @param sourceId
   * @param targetId
   */
  addConnection = (sourceId: string, targetId: string) => {
    if (this.nodes[sourceId] && this.nodes[targetId]) {
      this.circuit.addConnection(this.nodes[sourceId], this.nodes[targetId], targetId)
    }
  }

  /**
   * Removes a connection that exists between the given source and target ports.
   *
   * @param sourceId
   * @param targetId
   */
  removeConnection = (sourceId: string, targetId: string) => {
    if (this.nodes[sourceId] && this.nodes[targetId]) {
      this.circuit.removeConnection(this.nodes[sourceId], this.nodes[targetId])
    }
  }

  /**
   * Begins monitoring an individual port in the oscilloscope.
   *
   * @param portId
   * @param value - current port value
   */
  monitorPort = (portId: string, value: number, hue: number) => {
    if (!this.waves[portId]) {
      this.waves[portId] = new BinaryWaveService(portId, portId, value, hue)
      this.oscillator.add(this.waves[portId])
    }
  }

  /**
   * Removes a port from being monitored in the oscilloscope.
   *
   * @param portId
   */
  unmonitorPort = (portId: string) => {
    if (this.waves[portId]) {
      this.oscillator.remove(this.waves[portId])
      this.oscillator.broadcast()
    }

    delete this.waves[portId]
    delete this.oscillator.waves[portId]
    delete this.oscillogram[portId]
  }
}
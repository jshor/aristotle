import { Circuit, CircuitNode } from '@aristotle/logic-circuit'
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

  integratedCircuits: Record<string, Circuit> = {}

  /** Circuit oscillator. */
  oscillator: OscillationService = new OscillationService()

  /** Event emitter. */
  emitter: TinyEmitter = new TinyEmitter()

  /** Whether or not the simulation is paused. */
  isPaused: boolean = false

  /** Oscillogram data, containing each BinaryWave instance observed in the oscilloscope. */
  oscillogram: Oscillogram = {}

  integratedCircuitGroups: Record<string, string[]> = {}

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
  on = (event: string, fn: (valueMap: Record<string, number>, oscillogram: Oscillogram) => void) => {
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

  /**
   * Sets a port's value logical value.
   * This performs all necessary operations that result from such an action.
   *
   * @param portId
   * @param value - new logical value
   */
  setPortValue = (portId: string, value: number) => {
    if (this.nodes[portId] && this.nodes[portId].value !== value) {
      this.nodes[portId].setValue(value)
      this.circuit.enqueue(this.nodes[portId])
      this.waves[portId]?.drawPulseChange(value)
      this.step()
    }
  }

  /**
   * Adds an integrated circuit to the simulation.
   *
   * This will add all embedded circuit components to the circuit to be force-evaluated
   * (i.e., the node will immediately evaluate, even if the debugger is on).
   *
   * This will provide the experience of the entire embedded circuit evaluating completely on any debugging step.
   *
   * @param item - the high-level integrated circuit item
   * @param embeddedPorts - the high-level ports associated with the item (ones visible to the user)
   */
  addIntegratedCircuit = (icItem: Item, e: Record<string, Port>) => {
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

    // this.monitorNode(icItem, ports)
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
      return this.addIntegratedCircuit(item, ports)
    }

    const inputIds = item.portIds.filter(portId => ports[portId].type === PortType.Input)
    const outputIds = item.portIds.filter(portId => ports[portId].type === PortType.Output)
    const node = circuitNodeMapper.getCircuitNode(item, inputIds)

    node.forceContinue = forceContinue

    item.portIds.forEach(portId => this.addPort(portId, node))

    if (item.type === ItemType.InputNode && item.subtype === ItemSubtype.Clock) {
      this.addClock(outputIds[0])
    }

    this.circuit.addNode(node)

    if (!forceContinue) {
      this.monitorNode(item, ports)
    }
  }

  /**
   * Removes a node and all of its ports from the simulation.
   *
   * @param portIds - list of IDs of ports associated with the node (at least one matching is required)
   */
  removeNode = (item: Item) => {
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

    item
      .portIds
      .concat(getIntegratedCircuitPortIds(item))
      .forEach(portId => {
        const node = this.nodes[portId]

        if (node) {
          this.circuit.removeNode(node)
          this.removePort(portId)
        }
      })
  }

  /**
   * Monitors a node in the oscilloscope.
   *
   * @param item - item to observe
   * @param ports - ID-to-Port mapping of all related ports
   */
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
   * Adds a given port ID as a sibling to the node having the given port ID.
   *
   * @param portId
   * @param siblingPortId
   */
  addSiblingPort = (portId: string, siblingPortId: string) => {
    this.addPort(portId, this.nodes[siblingPortId])
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
    } else {
      if (!this.nodes[sourceId]) {
        console.log('MISSING SOURCE: ', sourceId, ' TRIED TO CONNECT TO ---', targetId)
      } else {
        console.log('MISSING TARGET: ', targetId, ' TRIED TO CONNECT TO ---', sourceId)
      }
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
    } else {
      console.log('MISSING NODE FOR REMOVING CONNECTION: ', this.nodes[sourceId], this.nodes[targetId], sourceId, targetId)
    }
  }

  /**
   * Begins monitoring an individual port in the oscilloscope.
   *
   * @param portId
   * @param value - current port value
   */
  monitorPort = (portId: string, value: number) => {
    if (!this.waves[portId]) {
      this.waves[portId] = new BinaryWaveService(portId, portId, value)
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

import { DocumentStoreInstance } from '..'

import LogicValue from '@/types/enums/LogicValue'
import CircuitNode from '../circuit/CircuitNode'
import ClockPulse from '../oscillator/ClockPulse'
import ItemType from '@/types/enums/ItemType'
import ItemSubtype from '@/types/enums/ItemSubtype'
import PortType from '@/types/enums/PortType'
import circuitNodeMapper from '@/utils/circuitNodeMapper'
import Port from '@/types/interfaces/Port'
import Item from '@/types/interfaces/Item'

/**
 * Toggles all item clocks on or off.
 */
export function toggleClocks (this: DocumentStoreInstance, fn: 'start' | 'stop') {
  Object
    .values(this.items)
    .forEach(item => item.clock?.[fn]())
}

/**
 * Starts the simulation.
 * This will not start clocks if the debugger is on.
 */
export function startSimulation (this: DocumentStoreInstance) {
  if (!this.isDebugging) {
    this.toggleClocks('start')
    this.oscillator.start()
  }
}

/**
 * Stops the simulation.
 */
export function stopSimulation (this: DocumentStoreInstance) {
  this.toggleClocks('stop')
  this.oscillator.stop()
}

/**
 * Advances the circuit simulation by one visual step.
 */
export function advanceSimulation (this: DocumentStoreInstance) {
  this.isCircuitEvaluated = true
  this.evaluateCircuitStep()
}

/**
 * Toggles the debugger to the opposite of its current state.
 * If `force` is provided as `true`, then the debugger will be forced to turn on.
 */
export function toggleDebugger (this: DocumentStoreInstance, force = false) {
  this.isDebugging = !this.isDebugging

  if (this.isDebugging || force) {
    this.stopSimulation()
    this.isDebugging = true
  } else {
    this.startSimulation()
    this.advanceSimulation()
  }
}

/**
 * Flushes all circuit values such that no values are "trapped" in any circuits.
 * This is useful to flush stored values out of flip-flops or other memory items.
 */
export function flushCircuit (this: DocumentStoreInstance) {
  // force the evaluation of the entire circuit with the new initialized values
  const isDebugging = this.isDebugging

  this.isDebugging = false
  this.advanceSimulation()
  this.isDebugging = isDebugging // if the circuit was in debugging mode before, then re-enable it
  this.isCircuitEvaluated = true
}

/**
 * Advances the circuit by one visual iteration step.
 *
 * When the debugger is on, this will continue advancing until either the circuit is fully evaluated,
 * or until some visual value change has occurred.
 *
 * When the debugger is off, this will continue advancing until the circuit is fully evaluated.
 */
export function evaluateCircuitStep (this: DocumentStoreInstance, iteration: number = 0) {
  this.circuit.advance()

  if (iteration > 1000) { // TODO: make this number configurable in settings
    // TODO: show a dialog to the user to warn them
    return this.toggleDebugger()
  }

  if (this.circuit.queue.length > 0 && !(this.isDebugging && !this.isCircuitEvaluated)) {
    this.evaluateCircuitStep(++iteration)
  }
}

/**
 * Resets the virtual circuit back to its original state.
 */
export function resetCircuit (this: DocumentStoreInstance) {
  this.oscillator.clear()
  this.circuit.reset()

  // apply the initial port values
  Object
    .values(this.items)
    .forEach(({ type, properties, portIds }) => {
      if (type === ItemType.InputNode) {
        portIds.forEach(portId => {
          // if this is an input node, initialize all values to false
          // this is to propagate the initial value to all connected nodes
          // TODO: this really ought to be user-configurable - some users may prefer to start with high impedance
          this.setPortValue({
            id: portId,
            value: LogicValue.UNKNOWN
          })
          this.flushCircuit()
          this.setPortValue({
            id: portId,
            value: LogicValue.FALSE // TODO: if they start with hi-Z, then don't do this part
          })
          this.flushCircuit()

          if (properties?.startValue) {
            // if a default start value is defined, apply that value
            this.setPortValue({
              id: portId,
              value: properties.startValue.value as number
            })
          }
        })
      }
    })

  this.flushCircuit()
}

/**
 * Adds an integrated circuit to the simulation.
 *
 * @param item - the high-level integrated circuit item
 */
export function addIntegratedCircuitNode (this: DocumentStoreInstance, icItem: Item) {
  if (!icItem.integratedCircuit) return

  const { items, connections, ports } = icItem.integratedCircuit

  Object
    .values(items)
    .forEach(item => {
      this.addVirtualNode(item, ports)
    })

  Object
    .values(connections)
    .forEach(c => {
      this
        .circuit
        .addConnection(this.nodes[c.source], this.nodes[c.target], c.target)
    })
}

/**
 * Given an Item, adds a virtual node and related simulation references to the circuit.
 */
export function addVirtualNode (this: DocumentStoreInstance, item: Item, ports: Record<string, Port> = this.ports) {
  if (item.portIds.length === 0) return // if there are no ports, then there is nothing to add to the simulation

    if (item.integratedCircuit) {
      return this.addIntegratedCircuitNode(item)
    }

    const inputIds = item.portIds.filter(portId => ports[portId].type === PortType.Input)
    const outputIds = item.portIds.filter(portId => ports[portId].type === PortType.Output)
    const node = circuitNodeMapper.getCircuitNode(item, inputIds)

    node.forceContinue = item.type === ItemType.Freeport // freeport value changes are immaterial to the debugger, so always allow it to advance
    node.on('change', this.onVirtualNodeChange.bind(this, node, outputIds))

    item.portIds.forEach(portId => {
      this.nodes[portId] = node
    })

    if (item.type === ItemType.InputNode && item.subtype === ItemSubtype.Clock) {
      const interval = item.properties.interval?.value as number


      item.clock = new ClockPulse(outputIds[0], interval, 1) // TODO: should clock start at 1? should be configurable in properties?
      item.clock.on('change', (value: number) => this.setPortValue({ id: outputIds[0], value }))

      this.oscillator.add(item.clock)
    }

    this.circuit.addNode(node)

    item
      .portIds
      .forEach(portId => {
        const port = ports[portId]

        if (port.isMonitored) {
          this.monitorPort(portId)
        }
      })
}

/**
 * Removes the Item having the given ID and all its virtual references from the simulation.
 */
export function removeVirtualNode (this: DocumentStoreInstance, itemId: string) {
  const item = this.items[itemId]

  /**
   * Returns the port IDs of all ports that are related to the given integrated circuit.
   */
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
}

/**
 * Updates the state for the given virtual node value change.
 */
export function onVirtualNodeChange (this: DocumentStoreInstance, node: CircuitNode, outputIds: string[], value: number, outputs: string[]) {
  outputs
    .concat(outputIds) // include all output ports
    .forEach(portId => {
      if (this.ports[portId]) {
        const port = this.ports[portId]
        const item = this.items[port.elementId]

        if (item && port.value !== value) {
          // only accept that the circuit has changed if the value of a port that's visible on the canvas has changed
          if (!node.forceContinue) {
            // if a node is not marked to be forceContinue, then it's either internal to an IC, or it's a freeport and its change is immaterial
            // if the value of a material port that's visible on the canvas has changed, then the circuit has not been fully evaluated
            this.isCircuitEvaluated = false
          }
        }

        port.value = value
        port.wave?.drawPulseChange(value)
      }
    })
}

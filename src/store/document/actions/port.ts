import { DocumentStoreInstance } from '..'
import PortType from '@/types/enums/PortType'
import BinaryWavePulse from '../oscillator/BinaryWavePulse'
import Port from '@/types/interfaces/Port'
import Connection from '@/types/interfaces/Connection'

/**
 * Attaches the given port to an item.
 */
export function addPort (this: DocumentStoreInstance, itemId: string, port: Port) {
  const { portIds } = this.items[itemId]

  const node = Object
    .values(this.nodes)
    .find(({ name }) => portIds.includes(name))

  this.ports[port.id] = port

  if (!portIds.includes(port.id)) {
    portIds.push(port.id)
  }

  if (node) {
    this.nodes[port.id] = node
  }

  if (port.isMonitored) {
    this.monitorPort(port.id)
  }

  this.setPortValue({ id: port.id, value: port.value })
}

/**
 * Removes a port from the state.
 * This will destroy the entire connection chain that it is a part of (if any).
 */
export function removePort (this: DocumentStoreInstance, portId: string) {
  // check to make sure that the element this port is attached to exists in the editor
  // (note: some ports may be embedded in ICs and therefore not in the editor directly)
  if (!this.items[this.ports[portId]?.elementId]) return

  this.unmonitorPort(portId)

  // remove all connections associated with this port
  Object
    .values(this.connections)
    .filter(({ source, target }) => source === portId || target === portId)
    .forEach(({ id }) => this.disconnectById(id))

  const itemId = this.ports[portId].elementId
  const portIndex = this.items[itemId].portIds.indexOf(portId)

  if (portIndex !== -1) {
    this.items[itemId].portIds.splice(portIndex, 1)
  }

  delete this.nodes[portId]
  delete this.ports[portId]
}

/**
 * Sets the ID of the active (i.e., 'previewed'/'enlarged') port.
 */
export function setActivePortId (this: DocumentStoreInstance, portId: string) {
  if (this.activePortId !== portId) {
    if (portId) {
      this.setConnectablePortIds({ portId })
    }

    this.activePortId = portId
    this.selectedPortIndex = -1
  }
}

/**
 * Deactivates the port having the given ID if it is active.
 */
export function unsetActivePortId (this: DocumentStoreInstance, portId: string) {
  if (this.activePortId === portId) {
    this.activePortId = null
    this.connectablePortIds.clear()
  }
}

/**
 * Sets the list of port IDs that the given port is eligible to be connected to.
 * This should be invoked whenever a user starts dragging a port or tabbed into one.
 */
export function setConnectablePortIds (this: DocumentStoreInstance, { portId, isDragging }: { portId: string, isDragging?: boolean }) {
  const port = this.ports[portId]

  const filter = port.type === PortType.Output
    ? (p: Port) => p.type === PortType.Input && p.connectedPortIds.length === 0
    : (p: Port) => p.type === PortType.Output && port.connectedPortIds.length === 0

  const connectablePortIds = Object
    .values(this.ports)
    .filter(p => filter(p) && !p.connectedPortIds.includes(port.id))
    .map(({ id }) => id)

  this.connectablePortIds = new Set(connectablePortIds)
}

/**
 * Sets the value of the port in the circuit.
 *
 * @param payload.id - ID of the port
 * @param payload.value - new port value
 */
export function setPortValue (this: DocumentStoreInstance, { id, value }: { id: string, value: number }) {
  if (this.ports[id] && this.nodes[id] && this.nodes[id].value !== value) {
    this.nodes[id].setValue(value)
    this.ports[id].wave?.drawPulseChange(value)
    this.circuit.enqueue(this.nodes[id])
    this.isCircuitEvaluated = false

    if (!this.isDebugging) {
      this.advanceSimulation()
    }
  }
}

/**
 * Toggles the monitoring of a port in the oscilloscope.
 */
export function togglePortMonitoring (this: DocumentStoreInstance, portId: string) {
  if (this.ports[portId].isMonitored) {
    this.unmonitorPort(portId)
  } else {
    this.monitorPort(portId)
  }
}

/**
 * Monitors a port in the oscolloscope.
 */
export function monitorPort (this: DocumentStoreInstance, portId: string) {
  const port = this.ports[portId]
  const name = this.items[port.elementId]?.name

  port.hue = port.hue ||  ~~(360 * Math.random())
  port.isMonitored = true
  port.wave = new BinaryWavePulse(portId, `${name} ${port.name}`, port.value, port.hue)

  this.oscillator.add(port.wave)
  this.isOscilloscopeOpen = true
}

/**
 * Removes a port from being monitored from the oscolloscope.
 */
export function unmonitorPort (this: DocumentStoreInstance, portId: string) {
  const port = this.ports[portId]

  port.isMonitored = false

  this.oscillator.remove(port.wave)

  delete this.oscillogram[portId]
  delete port.wave

  this.isOscilloscopeOpen = Object.keys(this.oscillogram).length > 0
}

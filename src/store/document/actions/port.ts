import { DocumentStoreInstance } from '..'
import getConnectionChain from '@/utils/getConnectionChain'
import PortType from '@/types/enums/PortType'
import BinaryWavePulse from '../oscillator/BinaryWavePulse'
import Port from '@/types/interfaces/Port'
import Connection from '@/types/interfaces/Connection'

/**
 * Attaches the given port to an item.
 */
export function addPort (this: DocumentStoreInstance, itemId: string, port: Port) {
  const node = Object
    .values(this.nodes)
    .find(({ name }) => this.items[itemId].portIds.includes(name))

  this.ports[port.id] = port
  this.items[itemId].portIds.push(port.id)

  if (node) {
    this.nodes[port.id] = node
  } else {
    this.addVirtualNode(this.items[itemId])
  }
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
    .forEach(c => {
      // find all segments and freeports of this connection and remove them
      const {
        connectionIds,
        freeportIds
      } = getConnectionChain(this.connections, this.ports, c.connectionChainId)

      connectionIds.forEach(id => this.disconnectById(id))

      freeportIds.forEach(id => {
        // delete all freeports associated with the chain
        this.items[id].portIds.forEach(portId => {
          delete this.ports[portId]
          delete this.nodes[portId]
        })

        delete this.items[id]
      })
    })

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
 *
 * @param portId - ID of the port to activate, or null to remove it
 */
export function setActivePortId (this: DocumentStoreInstance, portId: string | null) {
  if (this.activePortId !== portId) {
    if (portId) {
      this.setConnectablePortIds({ portId })
    } else {
      this.connectablePortIds = []
    }

    this.activePortId = portId
    this.selectedPortIndex = -1
  }
}

/**
 * Sets the list of connectable port IDs.
 * This should be invoked whenever a user starts dragging a port.
 */
export function setConnectablePortIds (this: DocumentStoreInstance, { portId, isDragging }: { portId: string, isDragging?: boolean }) {
  const port = this.ports[portId]

  if (port.isFreeport) return // freeports cannot connect to anything

  // generate a list of all port IDs that have at least one connection to/from it
  const connectedPortIds = Object
    .values(this.connections)
    .reduce((portIds: string[], connection: Connection) => {
      return portIds.concat([connection.source, connection.target])
    }, [])

  if (isDragging) {
    // if this port is being dragged, then the user intends to establish a new connection with it
    // remove the last two ports (the two ports on opposite ends of the "preview" connection)
    connectedPortIds.splice(-2)
  }

  const filter = port.type === PortType.Output
    ? (p: Port) => p.type === PortType.Input && !p.isFreeport && !connectedPortIds.includes(p.id) && p.elementId !== port.elementId
    : (p: Port) => p.type === PortType.Output && !p.isFreeport && !connectedPortIds.includes(port.id) && p.elementId !== port.elementId

  this.connectablePortIds = Object
    .values(this.ports)
    .filter(filter)
    .map(({ id }) => id)
}

/**
 * Sets the value of the port in the circuit.
 *
 * @param payload.id - ID of the port
 * @param payload.value - new port value
 */
export function setPortValue (this: DocumentStoreInstance, { id, value }: { id: string, value: number }) {
  if (this.nodes[id] && this.nodes[id].value !== value) {
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

import { CircuitNode } from '@/circuit'
import { DocumentStoreInstance } from '..'
import getConnectionChain from '@/utils/getConnectionChain'
import PortType from '@/types/enums/PortType'

export function addPort (this: DocumentStoreInstance, itemId: string, port: Port) {
  const node = Object
    .values(this.simulation.nodes)
    .find(({ name }) => this.items[itemId].portIds.includes(name))

  this.ports[port.id] = port
  this.items[itemId].portIds.push(port.id)

  if (node) {
    this.simulation.addPort(port.id, node as CircuitNode)
  } else {
    this.simulation.addNode(this.items[itemId], this.ports)
  }
}

/**
 * Removes a port from the state.
 * This will destroy the entire connection chain that it is a part of (if any).
 *
 * @param portId - ID of the port to destroy
 */
export function removePort (this: DocumentStoreInstance, portId: string) {
  // remove all connections associated with this port
  Object
    .values(this.connections)
    .filter(({ source, target }) => source === portId || target === portId)
    .forEach(c => {
      // find all segments and freeports of this connection and remove them
      const {
        connectionIds,
        freeportIds
      } = getConnectionChain(Object.values(this.connections), this.ports, c.connectionChainId)

      connectionIds.forEach(id => {
        // delete all connections associated with the chain
        const { source, target } = this.connections[id]

        this
          .simulation
          .removeConnection(source, target)

        delete this.connections[id]
      })

      freeportIds.forEach(id => {
        // delete all freeports associated with the chain
        this.items[id].portIds.forEach(portId => {
          delete this.ports[portId]
          this.simulation.removePort(portId)
        })

        delete this.items[id]
      })
    })

  delete this.ports[portId]
  this.simulation.removePort(portId)
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
 *
 * @param portId - the ID of the port being dragged
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
  this
    .simulation
    .setPortValue(id, value)
}

export function togglePortMonitoring (this: DocumentStoreInstance, portId: string) {
  if (this.ports[portId].isMonitored) {
    this.unmonitorPort(portId)
  } else {
    this.monitorPort(portId)
  }
}

export function monitorPort (this: DocumentStoreInstance, portId: string) {
  const port = this.ports[portId]

  port.hue = port.hue ||  ~~(360 * Math.random())
  port.isMonitored = true

  this
    .simulation
    .monitorPort(portId, port.value, port.hue)

  this.isOscilloscopeOpen = true
}

export function unmonitorPort (this: DocumentStoreInstance, portId: string) {
  const port = this.ports[portId]

  port.isMonitored = false

  this
    .simulation
    .unmonitorPort(portId)

  this.isOscilloscopeOpen = Object.keys(this.oscillogram).length > 0
}

/**
 * Assigns values to the ports in the this according to the given map.
 *
 * @param valueMap - Port-ID-to-value mapping
 */
export function setPortValues (this: DocumentStoreInstance, valueMap: Record<string, number>) {
  for (const portId in valueMap) {
    if (this.ports[portId]) {
      this.ports[portId].value = valueMap[portId]
    }
  }
}

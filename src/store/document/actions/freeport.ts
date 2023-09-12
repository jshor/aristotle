import boundaries from '../geometry/boundaries'
import { DocumentStoreInstance } from '..'
import itemFactory from '@/factories/itemFactory'
import portFactory from '@/factories/portFactory'
import Direction from '@/types/enums/Direction'
import ItemType from '@/types/enums/ItemType'
import ItemSubtype from '@/types/enums/ItemSubtype'
import PortType from '@/types/enums/PortType'
import { usePreferencesStore } from '@/store/preferences'
import Port from '@/types/interfaces/Port'
import Freeport from '@/types/types/Freeport'

/**
 * Adds a new freeport element. This can be used in either of two scenarios:
 *
 *  1. when a user is dragging a port to establish a connection to another port
 *  2. when a user drags on a connection to create a new "pivot point" on the wire
 *
 * @param payload
 * @param payload.itemId - desired ID for the new freeport
 * @param payload.inputPortId - the ID of the input port (omit for a wire drag from an output port)
 * @param payload.outputPortId - the ID of the output port (omit for a wire drag from an input port)
 * @param payload.position - the initial position of this port
 * @param payload.value - optional value of the port
 */
export function addFreeportItem (this: DocumentStoreInstance, { itemId, inputPortId, outputPortId, value = 0 }: {
  itemId: string
  outputPortId?: string
  inputPortId?: string
  value?: number
}) {
  const ports: Record<Direction, Port[]> = {
    [Direction.Left]: [],
    [Direction.Top]: [],
    [Direction.Right]: [],
    [Direction.Bottom]: []
  }

  if (outputPortId) {
    this.ports[outputPortId] = portFactory(itemId, outputPortId, Direction.Left, PortType.Output, outputPortId)
    this.ports[outputPortId].value = value
    this.ports[outputPortId].isFreeport = true

    ports[Direction.Left].push(this.ports[outputPortId])
  }

  if (inputPortId) {
    this.ports[inputPortId] = portFactory(itemId, inputPortId, Direction.Right, PortType.Input, inputPortId)
    this.ports[inputPortId].value = value
    this.ports[inputPortId].isFreeport = true

    ports[Direction.Right].push(this.ports[inputPortId])
  }

  this.items[itemId] = itemFactory(itemId, ItemType.Freeport, ItemSubtype.None, 1, 1, ports)
  this.items[itemId].zIndex = this.zIndex++

  this.addVirtualNode(this.items[itemId])
}

/**
 * Removes a Freeport from the document.
 * This can remove either a dragged freeport or a connector between two wire segments.
 *
 * @param id - ID of the freeport item
 */
export function disconnectFreeport (this: DocumentStoreInstance, id: string) {
  const item = this.items[id]

  let originalSourceId = ''
  let originalTargetId = ''

  // find the true source and target port ids
  Object
    .values(this.connections)
    .forEach(c => {
      if (c.target === item.portIds[1]) originalSourceId = c.source
      if (c.source === item.portIds[0]) originalTargetId = c.target
    })

  if (originalSourceId) this.disconnect({ source: originalSourceId, target: item.portIds[1] })
  if (originalTargetId) this.disconnect({ source: item.portIds[0], target: originalTargetId })
  if (originalSourceId && originalTargetId) {
    // reconnect the true source and target
    this.connect({ source: originalSourceId, target: originalTargetId })
  }
}

/**
 * Creates a new freeport item with the given set of IDs in the payload.
 * This can either be a dragged port (to connect a port) or a joint between two connection segments.
 *
 * For a joint, include all required params, including the IDs of the destination ports and the freeport ports.
 * For a dragged port, include the source IDs (if dragged from an output) or the target IDs (if dragged from an input).
 *
 * @param data - IDs for apply the new freeport
 */
export function createFreeport (this: DocumentStoreInstance, data: Freeport, createCircuitConnection: boolean = true) {
  if (this.items[data.itemId]) return

  if (data.sourceId && data.targetId) {
    this.commitState()
  }

  this.deselectAll()
  this.addFreeportItem(data)
  this.setItemBoundingBox(data.itemId)
  this.activeFreeportId = data.itemId

  let connections: { source: string, target: string }[] = []

  if (data.sourceId && data.inputPortId) {
    connections.push({
      source: data.sourceId,
      target: data.inputPortId
    })
  }

  if (data.targetId && data.outputPortId) {
    connections.push({
      source: data.outputPortId,
      target: data.targetId
    })
  }

  connections.forEach(connection => {
    this.createConnection({
      ...connection,
      connectionChainId: data.connectionChainId
    })

    if (createCircuitConnection) {
      this
        .circuit
        .addConnection(this.nodes[connection.source], this.nodes[connection.target], connection.target, this.ports[connection.source].value)
    }
  })

  if (data.sourceId && data.targetId) {
    // only remove the circuit connection (not the store connection), as its component may still be in action (i.e., handling dragging)
    // once the dragging operation is complete, it will be the responsibility of the connection component to destroy itself
    this
      .circuit
      .removeConnection(this.nodes[data.sourceId], this.nodes[data.targetId], this.ports[data.sourceId].value)
  }

  if (data.sourceId && data.targetId) {
    // bring forward the freeport item so that it is between the two new connections
    this.deselectAll()
    this.setSelectionState({
      id: data.itemId,
      value: true
    })
    this.incrementZIndex(1)
  }

  this.advanceSimulation()
}

/**
 * Establishes a connection after a user drags a port to connect it to an item.
 * This will disconnect the temporary wire and port being dragged, and establish a new connection between the two items.
 *
 * @param payload
 * @param payload.sourceId - the ID of the source port (if being dragged from one)
 * @param payload.targetId - the ID of the target port (if being dragged from one)
 * @param payload.portId - the ID of the temporary freeport being dragged
 */
export function connectFreeport (this: DocumentStoreInstance, { sourceId, targetId, portId }: { sourceId?: string, targetId?: string, portId: string }) {
  const port = this.ports[portId]
  const snap = usePreferencesStore().snapping.snapTolerance.value as number
  const newPort = Object
    .values(this.ports)
    .find((p: Port) => {
      return p.id !== portId && this.connectablePortIds.includes(p.id) && boundaries.isInNeighborhood(p.position, port.position, snap)
    })

  if (newPort) {
    if (sourceId) {
      this.disconnect({
        source: sourceId,
        target: portId
      })
      this.connect({
        source: sourceId,
        target: newPort.id
      })
    } else if (targetId) {
      this.disconnect({
        source: portId,
        target: targetId
      })
      this.connect({
        source: newPort.id,
        target: targetId
      })
    }
  } else {
    // no port can be connected, so disconnect the temporary dragged wire
    this.disconnect({
      source: sourceId || portId,
      target: targetId || portId
    })
  }

  const item = Object
    .values(this.items)
    .find(({ portIds }) => portIds.includes(portId))

  if (item) {
    this.removeElement(item.id)
  }

  this.clearStatelessInfo()
}

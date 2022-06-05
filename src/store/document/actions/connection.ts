import PortType from '@/types/enums/PortType'
import { v4 as uuid } from 'uuid'
import { DocumentStoreInstance } from '..'

/**
 * Establishes a 'preview' of a connection (i.e., not saved in the current document this).
 * This is so that the user can press a keyboard shortcut to quickly navigate/preview possible connections.
 *
 * @param portId - the ID of the port previewing connections for
 */
export function setConnectionPreview (this: DocumentStoreInstance, portId: string | null) {
  if (this.activePortId && portId) {
    let source = this.activePortId
    let target = portId

    if (this.ports[this.activePortId].type === PortType.Input) {
      source = portId
      target = this.activePortId
    }

    const id = uuid()

    this.unsetConnectionPreview()
    this.connect({ source, target, id })
    this.connectionPreviewId = id
  }
}

/**
 * Clears the active connection preview.
 */
export function unsetConnectionPreview (this: DocumentStoreInstance) {
  if (this.connectionPreviewId) {
    this.disconnect(this.connections[this.connectionPreviewId])
  }
  this.connectionPreviewId = null
}

/**
 * Commits the previewed connection action as an undo-able state.
 */
export function commitPreviewedConnection (this: DocumentStoreInstance) {
  if (this.connectionPreviewId) {
    const { source, target } = this.connections[this.connectionPreviewId]

    this.disconnect({ source, target })
    this.commitState()
    this.connect({ source, target })
    this.connectionPreviewId = null
  }
}

/**
 * Establishes a 'preview' of a connection (i.e., not saved in the current document this).
 * This is so that the user can press a keyboard shortcut to quickly navigate/preview possible connections.
 *
 * @param portId - the ID of the port previewing connections for
 */
export function cycleConnectionPreviews (this: DocumentStoreInstance, portId: string) {
  if (portId && portId !== this.activePortId) {
    this.setActivePortId(portId)
  }

  let index = this.selectedPortIndex + 1

  if (index <= 0) index = 0
  if (index >= this.connectablePortIds.length) index = -1

  const previewPortId = this.connectablePortIds[index]

  if (previewPortId && !this.ports[portId]?.connectedPortIds.includes(previewPortId)) {
    this.setConnectionPreview(previewPortId)
  } else {
    if (this.connectablePortIds.length === 0) {
      window.api.beep() // audibly inform the user they can't connect to anything
    }
    this.unsetConnectionPreview()
  }
  this.selectedPortIndex = index
}

/**
 * Establishes a new connection between two ports.
 *
 * @param payload
 * @param payload.source - source port ID
 * @param payload.target - target port ID
 * @param payload.connectionChainId - optional connection chain ID to add the connection segment to
 */
export function createConnection (this: DocumentStoreInstance, data: { source: string, target: string, id?: string, connectionChainId?: string }) {
  const id = data.id || uuid()

  this.connections[id] = {
    ...data,
    id,
    connectionChainId: data.connectionChainId || id,
    groupId: null,
    zIndex: ++this.zIndex,
    isSelected: false
  }

  this.ports[data.source].connectedPortIds.push(data.target)
  this.ports[data.target].connectedPortIds.push(data.source)
}

export function connect (this: DocumentStoreInstance, data: { source: string, target: string, id?: string, connectionChainId?: string }) {
  this.createConnection(data)

  this
    .simulation
    .addConnection(data.source, data.target)

  this.simulation.circuit.next()
}

/**
 * Disconnects two ports.
 *
 * @param payload
 * @param payload.source - source port ID
 * @param payload.target - target port ID
 */
export function destroyConnection (this: DocumentStoreInstance, { source, target }: { source: string, target: string }) {
  const connection = Object
    .values(this.connections)
    .find(c => c.source === source && c.target === target)

  if (connection) {
    const sourceIndex = this.ports[source].connectedPortIds.findIndex(id => id === target)
    const targetIndex = this.ports[target].connectedPortIds.findIndex(id => id === source)

    this.ports[source].connectedPortIds.splice(sourceIndex, 1)
    this.ports[target].connectedPortIds.splice(targetIndex, 1)

    delete this.connections[connection.id]
  }
}

export function disconnect (this: DocumentStoreInstance, { source, target }: { source: string, target: string }) {
  this
    .simulation
    .removeConnection(source, target)

  this.simulation.circuit.next()

  this.destroyConnection({ source, target })
}

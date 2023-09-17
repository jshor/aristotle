import PortType from '@/types/enums/PortType'
import { v4 as uuid } from 'uuid'
import { DocumentStoreInstance } from '..'
import ItemType from '@/types/enums/ItemType'
import LogicValue from '@/types/enums/LogicValue'
import Point from '@/types/interfaces/Point'
import BoundingBox from '@/types/types/BoundingBox'
import boundaries from '../geometry/boundaries'
import fromDocumentToEditorCoordinates from '@/utils/fromDocumentToEditorCoordinates'
import Connection from '@/types/interfaces/Connection'
import { usePreferencesStore } from '@/store/preferences'

/**
 * Establishes a 'preview' of a connection (i.e., not saved in the current document state).
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
    this.disconnectById(this.connectionPreviewId)
  }
  this.connectionPreviewId = null
}

/**
 * Commits the previewed connection action as an undo-able state.
 */
export function commitPreviewedConnection (this: DocumentStoreInstance) {
  if (this.connectionPreviewId) {
    const { source, target } = this.connections[this.connectionPreviewId]

    this.disconnectById(this.connectionPreviewId)
    this.commitState()
    this.connect({ source, target })
    this.connectionPreviewId = null
  }
}

/**
 * Establishes a 'preview' of a connection (i.e., not saved in the current document state).
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
  if (index >= this.connectablePortIds.size) index = -1

  const previewPortId = [...this.connectablePortIds.values()][index]

  if (previewPortId && !this.ports[portId]?.connectedPortIds.includes(previewPortId)) {
    this.setConnectionPreview(previewPortId)
  } else {
    if (this.connectablePortIds.size === 0) {
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
 */
export function createConnection (this: DocumentStoreInstance, data: Partial<Connection> & { source: string, target: string }) {
  const id = data.id || uuid()

  this.connections[id] = {
    controlPoints: [],
    groupId: null,
    id,
    ...data,
    zIndex: ++this.zIndex,
    isSelected: false
  }

  this.ports[data.source].connectedPortIds.push(data.target)
  this.ports[data.target].connectedPortIds.push(data.source)
}

export function connect (this: DocumentStoreInstance, data: Partial<Connection> & { source: string, target: string }) {
  if (!this.ports[data.source] || !this.ports[data.target]) return

  this.createConnection(data)

  this
    .circuit
    .addConnection(this.nodes[data.source], this.nodes[data.target], data.target)

  this.advanceSimulation()
}

/**
 * Removes the given connection from the document.
 */
export function destroyConnection (this: DocumentStoreInstance, { source, target }: { source: string, target: string }) {
  const connection = Object
    .values(this.connections)
    .find(c => c.source === source && c.target === target)

  if (connection) {
    this.destroyConnectionById(connection.id)
  }
}

/**
 * Removes a connection from the document by its connection ID.
 */
export function destroyConnectionById (this: DocumentStoreInstance, id: string) {
  const { source, target } = this.connections[id]
  const sourceIndex = this.ports[source].connectedPortIds.findIndex(id => id === target)
  const targetIndex = this.ports[target].connectedPortIds.findIndex(id => id === source)

  this.ports[source].connectedPortIds.splice(sourceIndex, 1)
  this.ports[target].connectedPortIds.splice(targetIndex, 1)

  this.ports[target].value = LogicValue.UNKNOWN
  this.ports[target].wave?.drawPulseChange(LogicValue.UNKNOWN)

  delete this.connections[id]
}

/**
 * Disconnects the given ports in the simulation.
 */
export function disconnect (this: DocumentStoreInstance, { source, target }: { source: string, target: string }) {
  this
    .circuit
    .removeConnection(this.nodes[source], this.nodes[target])

  this.advanceSimulation()
  this.destroyConnection({ source, target })
}

/**
 * Disconnects two ports for the given connection ID in the simulation.
 */
export function disconnectById (this: DocumentStoreInstance, id: string) {
  if (!this.connections[id]) return

  const { source, target } = this.connections[id]

  this
    .circuit
    .removeConnection(this.nodes[source], this.nodes[target])

  this.advanceSimulation()
  this.selectedItemIds.delete(id)
  this.destroyConnectionById(id)
}

/**
 * Adds a control point to a connection.
 */
export function addControlPoint (this: DocumentStoreInstance, id: string, position: Point, index: number) {
  this
    .connections[id]
    .controlPoints
    .splice(index, 0, {
      position,
      orientation: 0,
      rotation: 0,
      canInflect: true
    })

  this.setControlPointSelectionState(id, index, true)
}

/**
 * Creates a new connection experiment.
 */
export function createConnectionExperiment (this: DocumentStoreInstance, sourceId: string) {
  if (!this.ports[sourceId]) return

  this.connectionExperiment = {
    sourceId,
    targetPosition: this.ports[sourceId].position
  }

  this.setConnectablePortIds({ portId: sourceId, isDragging: true })
  this.setConnectionExperimentSnapBoundaries(sourceId)
}

/**
 * Moves the target of the active connection experiment.
 *
 * @param position - the new position of the target, in editor coordinates
 * @param offset - the offset of the target, in editor coordinates
 */
export function updateConnectionExperiment (this: DocumentStoreInstance, position: Point, offset: Point) {
  if (!this.connectionExperiment) return

  const { x, y } = fromDocumentToEditorCoordinates(this.canvas, this.viewport, {
    x: position.x - offset.x,
    y: position.y - offset.y
  }, this.zoom)
  const boundingBox = boundaries.getPointBoundary({ x, y })
  const { snapping } = usePreferencesStore()
  const tolerance = snapping.snapTolerance.value
  const snap = boundaries.getRadialSnapOffset(this.snapBoundaries, boundingBox, tolerance)

  this.connectionExperiment.targetPosition = {
    x: x + snap.x,
    y: y + snap.y
  }
}

/**
 * Terminates the active connection experiment.
 */
export function terminateConnectionExperiment (this: DocumentStoreInstance) {
  if (!this.connectionExperiment) return

  const { sourceId, targetPosition } = this.connectionExperiment
  const { snapping } = usePreferencesStore()
  const tolerance = snapping.snapTolerance.value

  this.connectionExperiment = null

  const target = Object
    .values(this.ports)
    .find(p => this.connectablePortIds.has(p.id) && boundaries.isInNeighborhood(p.position, targetPosition, tolerance))

  if (target) {
    this.cacheState()
    this.connect({ source: sourceId, target: target.id })
    this.commitCachedState()
  }

  this.clearStatelessInfo()
}

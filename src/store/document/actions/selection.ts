import BoundingBox from '@/types/types/BoundingBox'
import { DocumentStoreInstance } from '..'
import boundaries from '../geometry/boundaries'
import BaseItem from '@/types/interfaces/BaseItem'

/**
 * Selects all items and connections.
 */
export function selectAll (this: DocumentStoreInstance) {
  this.clearStatelessInfo()

  for (let id in this.connections) {
    this.setConnectionSelectionState(id, true)
  }

  for (let id in this.items) {
    this.setItemSelectionState(id, true)
  }
}

/**
 * Deselects all elements.
 */
export function deselectAll (this: DocumentStoreInstance) {
  this.clearStatelessInfo()

  this.selectedConnectionIds.forEach(id => {
    if (this.connections[id]) {
      this.connections[id].isSelected = false
    }
  })

  for (const id in this.selectedControlPoints) {
    this.selectedControlPoints[id]?.forEach(index => {
      if (this.connections[id]?.controlPoints?.[index]) {
        this.connections[id].controlPoints[index].isSelected = false
      }
    })
  }

  this.selectedItemIds.forEach(id => {
    if (this.items[id]) {
      this.items[id].isSelected = false
    }
  })

  for (const id in this.groups) {
    this.groups[id].isSelected = false
  }

  this.selectedControlPoints = {}
  this.selectedGroupIds.clear()
  this.selectedConnectionIds.clear()
  this.selectedItemIds.clear()
}

/**
 * Selects all connections and items (and its connections) that live within the given boundary.
 *
 * @param boundingBox - two-dimensional boundary
 */
export function createSelection (this: DocumentStoreInstance, selection: BoundingBox) {
  if (!boundaries.isOneOrTwoDimensional(selection)) return // omit selection lines or points

  const portIds = new Set<string>()

  // add all items and their ports that overlap within the selection rectange
  Object
    .keys(this.items)
    .forEach(id => {
      if (boundaries.hasIntersection(selection, this.items[id].boundingBox)) {
        this.setItemSelectionState(id, true)
        this
          .items[id]
          .portIds
          .forEach(portId => portIds.add(portId))
      }
    })

  Object
    .keys(this.connections)
    .forEach(id => {
      const c = this.connections[id]
      const source = this.ports[c.source]
      const target = this.ports[c.target]
      const points = [source, ...c.controlPoints, target]

      // connection has at least one segment that overlaps the selection rectangle
      const hasIntersection = boundaries.areLinesIntersectingRectangle(points.map(p => p.position), selection)

      // connection is connected to selected items at both its source and target
      const isConnectedToSelectedItems = portIds.has(c.source) && portIds.has(c.target)

      // add the connection ID if the connection overlaps any segment within the selection rectange
      if (hasIntersection || isConnectedToSelectedItems) {
        this.setConnectionSelectionState(id, true)
      }
    })
}

/**
 * Sets the selection state of a control point.
 */
export function setControlPointSelectionState (this: DocumentStoreInstance, id: string, index: number, isSelected: boolean) {
  if (!this.connections[id]?.controlPoints) return

  const controlPoint = this.connections[id]?.controlPoints[index]
  const hasSelectionChanged = controlPoint?.isSelected !== isSelected

  controlPoint.isSelected = isSelected

  if (this.selectedControlPoints[id]) {
    isSelected
      ? this.selectedControlPoints[id].add(index)
      : this.selectedControlPoints[id].delete(index)
  } else if (isSelected) {
    this.selectedControlPoints[id] = new Set([index])
  }

  if (this.selectedControlPoints[id]?.size === 0) {
    delete this.selectedControlPoints[id]
  }

  if (hasSelectionChanged) {
    this.setGroupSelectionState(this.connections[id].groupId, isSelected)
  }
}

/**
 * Sets the selection state of a connection.
 */
export function setConnectionSelectionState (this: DocumentStoreInstance, id: string, isSelected: boolean) {
  if (!this.connections[id]) return

  this.connections[id].isSelected = isSelected
  this.connections[id].controlPoints.forEach((_, index) => this.setControlPointSelectionState(id, index, isSelected))

  isSelected
    ? this.selectedConnectionIds.add(id)
    : this.selectedConnectionIds.delete(id)

  this.setGroupSelectionState(this.connections[id].groupId, isSelected)
}

/**
 * Sets the selection state of an item.
 */
export function setItemSelectionState (this: DocumentStoreInstance, id: string, isSelected: boolean) {
  if (!this.items[id]) return

  this.items[id].isSelected = isSelected

  isSelected
    ? this.selectedItemIds.add(id)
    : this.selectedItemIds.delete(id)

  this.setGroupSelectionState(this.items[id].groupId, isSelected)
}

/**
 * Sets the selection state of a group.
 */
export function setGroupSelectionState (this: DocumentStoreInstance, id: string | null, isSelected: boolean) {
  if (id === null) return

  const group = this.groups[id]

  if (!this.groups[id] || this.groups[id].isSelected === isSelected) return

  this.groups[id].isSelected = isSelected

  group
    .connectionIds
    .forEach(id => this.setConnectionSelectionState(id, isSelected))

  group
    .itemIds
    .forEach(id => this.setItemSelectionState(id, isSelected))

  isSelected
    ? this.selectedGroupIds.add(id)
    : this.selectedGroupIds.delete(id)
}

/**
 * Sets the selection this of the given element to the value provided.
 * If the item is a connection segment, then its entire connection chain will take on the same value.
 *
 * @param payload
 * @param payload.id - ID of the item, group, or connection to select
 * @param payload.isSelected - selection this to change to
 */
export function setSelectionState (this: DocumentStoreInstance, id: string, isSelected: boolean) {
  if (this.items[id]) {
    this.setItemSelectionState(id, isSelected)
  } else if (this.connections[id]) {
    this.setConnectionSelectionState(id, isSelected)
  } else if (this.groups[id]) {
    this.setGroupSelectionState(id, isSelected)
  }
}

/**
 * Deletes all selected items and connections.
 */
export function deleteSelection (this: DocumentStoreInstance) {
  if (!this.canDelete) return

  this.commitState()

  // any connection that is connected to any selected item will become disconnected once the item is removed
  // select all connections belonging to removed items so that they can be removed as well
  Object
    .values(this.connections)
    .forEach(({ source, target, id }) => {
      // returns true if the given port ID is connected to any selected item
      const isConnected = (i: string) => this.items[this.ports[i].elementId].isSelected

      if (isConnected(source) || isConnected(target)) {
        this.selectedConnectionIds.add(id)
      }
    })

  // remove all selected connection control points
  // there is the possibility that the user has selected a control point without selecting the connection
  // or any item associated to the connection
  for (const id in this.selectedControlPoints) {
    this.connections[id].controlPoints = Array
      .from(this.connections[id].controlPoints)
      .map((point, index) => {
        // set each selected control point to null to be removed
        return this.selectedControlPoints[id].has(index)
          ? null!
          : point
      })
      .filter(p => p !== null)
  }

  // first, remove all connections that should be removed
  this
    .selectedConnectionIds
    .forEach(id => this.disconnectById(id))

  // then remove the items
  this
    .selectedItemIds
    .forEach(id => this.removeElement(id))

  // then remove the selected groups
  this
    .selectedGroupIds
    .forEach(id => {
      delete this.groups[id]
      this.selectedGroupIds.delete(id)
    })

  this.deselectAll()
}

/**
 * Clears all temporary information (i.e., momentary UI interactions) from the state.
 */
export function clearStatelessInfo (this: DocumentStoreInstance) {
  this.unsetConnectionPreview()
  this.connectablePortIds.clear()
  this.selectedPortIndex = -1
  this.activePortId = null
  this.connectionPreviewId = null
  this.connectionExperiment = null
}

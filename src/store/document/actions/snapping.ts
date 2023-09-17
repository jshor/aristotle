import ItemType from '@/types/enums/ItemType'
import boundaries from '../geometry/boundaries'
import { DocumentStoreInstance } from '..'
import BoundingBox from '@/types/types/BoundingBox'
import Connection from '@/types/interfaces/Connection'
import Point from '@/types/interfaces/Point'

/**
 * Sets the computed boundaries that an actively-dragged item to snap to.
 *
 * @param id - ID of the item or port being dragged
 */
export function setSnapBoundaries (this: DocumentStoreInstance, id: string) {
  this.snapBoundaries = ((): BoundingBox[] => {
    const item = this.items[id]

    if (item && !item.groupId) {
      // the item with the given id is an item that does not belong to a group
      // this an item that can snap to align with the outer edge of any other item
      return Object
        .values(this.items)
        .filter(e => e.id !== id && !e.isSelected)
        .map(e => e.boundingBox)
    }
    return []
  })()
}

export function setControlPointSnapBoundaries (
  this: DocumentStoreInstance,
  id: string,
  entries: { portPosition: Point }[],
  excludeIndex: number
) {
  const { source, target } = this.connections[id]

  this.snapBoundaries = entries
    .reduce((b, { portPosition }, index) => {
      return excludeIndex !== index
        ? b.concat(boundaries.getLinearBoundaries(portPosition))
        : b
    }, [] as BoundingBox[])
    .concat(boundaries.getLinearBoundaries(this.ports[source].position))
    .concat(boundaries.getLinearBoundaries(this.ports[target].position))
}

export function setConnectionExperimentSnapBoundaries (this: DocumentStoreInstance, sourceId: string) {
  this.setConnectablePortIds({ portId: sourceId, isDragging: true })
  this.snapBoundaries = []
  this
    .connectablePortIds
    .forEach(portId => {
      this
        .snapBoundaries
        .push(boundaries.getPointBoundary(this.ports[portId].position))
    })
}

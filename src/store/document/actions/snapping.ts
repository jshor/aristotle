import ItemType from '@/types/enums/ItemType'
import boundaries from '../geometry/boundaries'
import { DocumentStoreInstance } from '..'

/**
 * Sets the computed boundaries that an actively-dragged item to snap to.
 *
 * @param id - ID of the item or port being dragged
 */
  export function setSnapBoundaries (this: DocumentStoreInstance, id: string) {
  this.snapBoundaries = ((): BoundingBox[] => {
    if (this.connectablePortIds.length) {
      // if there are connectable port ids, then use those for boundaries
      return this
        .connectablePortIds
        .filter(portId => portId !== id)
        .map(portId => boundaries.getPointBoundary(this.ports[portId].position))
    }

    const item = this.items[id]

    if (item && !item.groupId) {
      // the item with the given id is an item that does not belong to a group
      if (item.type === ItemType.Freeport) {
        if (item.portIds.length > 1) {
          // if only one port exists on the freeport, then it is a port being dragged by the user and does not apply
          // freeports should snap to "straighten out" wires
          return Object
            .values(this.connections)
            .reduce((boundingBoxes: BoundingBox[], connection: Connection) => {
              if (item.portIds.includes(connection.source)) {
                return boundingBoxes.concat(boundaries.getLinearBoundaries(this.ports[connection.target].position))
              }

              if (item.portIds.includes(connection.target)) {
                return boundingBoxes.concat(boundaries.getLinearBoundaries(this.ports[connection.source].position))
              }

              return boundingBoxes
            }, [])
        }
      } else {
        // this an item that can snap to align with the outer edge of any non-freeport item
        return Object
          .values(this.items)
          .filter(e => e.id !== id && e.type !== ItemType.Freeport)
          .map(e => e.boundingBox)
      }
    }
    return []
  })()
}

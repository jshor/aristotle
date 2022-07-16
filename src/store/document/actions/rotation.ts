import { DocumentStoreInstance } from '..'
import boundaries from '../geometry/boundaries'
import rotation from '../geometry/rotation'

/**
 * Rotates all selected elements by 90 degrees.
 * If multiple items are selected, this will rotate them as if they are all part of a group.
 *
 * @param direction - direction of rotation (1 = CW, -1 = CCW)
 */
export function rotate (this: DocumentStoreInstance, direction: number) {
  this.commitState()

  const selectedItems = Object
    .values(this.items)
    .filter(({ isSelected }) => isSelected)
  const boundingBoxes = selectedItems.map(({ boundingBox }) => boundingBox)
  const boundingBox = boundaries.getGroupBoundingBox(boundingBoxes)
  const groupIds = new Set<string>()

  selectedItems.forEach(item => {
    const newRotation = rotation.rotate(item.rotation + direction)

    if (item.groupId) {
      groupIds.add(item.groupId)
    }

    this.items[item.id].rotation = newRotation
    this
      .items[item.id]
      .portIds
      .forEach(portId => {
        this.ports[portId].rotation = newRotation
      })

    this.setItemPosition({
      id: item.id,
      position: rotation.getGroupedItemRotatedPosition(boundingBox, item, direction)
    })
  })

  groupIds.forEach(groupId => {
    this.setGroupBoundingBox(groupId)
  })
}

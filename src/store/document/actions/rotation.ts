import BoundingBox from '@/types/types/BoundingBox'
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

  const boundingBoxes: BoundingBox[] = []

  this
    .selectedItemIds
    .forEach(id => {
      boundingBoxes.push(this.items[id].boundingBox)
    })

  for (const id in this.selectedControlPoints) {
    this
      .selectedControlPoints[id]
      .forEach(index => {
        boundingBoxes.push(
          boundaries.getPointBoundary(this.connections[id].controlPoints[index].position)
        )
      })
  }

  const boundingBox = boundaries.getGroupBoundingBox(boundingBoxes)
  const groupIds = new Set<string>()

  this
    .selectedItemIds
    .forEach(id => {
      const item = this.items[id]
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
          this.ports[portId].position = rotation.getGroupedItemRotatedPosition(item.boundingBox, this.ports[portId].position, 1, 1, direction)
        })

      this.setItemPosition({
        id: item.id,
        position: rotation.getGroupedItemRotatedPosition(boundingBox, item.position, item.width, item.height, direction)
      })
    })


  for (const id in this.selectedControlPoints) {
    this
      .selectedControlPoints[id]
      .forEach(index => {
        const controlPoint = this.connections[id].controlPoints[index]

        controlPoint.rotation = rotation.rotate(controlPoint.rotation + direction)
        controlPoint.position = rotation.getGroupedItemRotatedPosition(boundingBox, controlPoint.position, 1, 1, direction)
      })
  }

  groupIds.forEach(groupId => {
    this.setGroupBoundingBox(groupId)
  })
}

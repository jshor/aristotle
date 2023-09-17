import { DocumentStoreInstance } from '..'
import boundaries from '../geometry/boundaries'
import SnapMode from '@/types/enums/SnapMode'
import ItemType from '@/types/enums/ItemType'
import fromDocumentToEditorCoordinates from '@/utils/fromDocumentToEditorCoordinates'
import { usePreferencesStore } from '@/store/preferences'
import Point from '@/types/interfaces/Point'
import BoundingBox from '@/types/types/BoundingBox'

/**
 * Centers all items (together as a group) to the center of the canvas.
 * All distances between items are maintained when this occurs.
 */
export function centerAll (this: DocumentStoreInstance) {
  const { grid } = usePreferencesStore()
  const gridSize = grid.gridSize.value
  const boundingBoxes = Object
    .values(this.items)
    .map(({ boundingBox }) => boundingBox)
  const boundingBox = boundaries.getGroupBoundingBox(boundingBoxes)
  const { x, y } = boundaries.getCenteredScreenPoint(this.canvas, boundingBox, gridSize)

  const deltaX = x - boundingBox.left
  const deltaY = y - boundingBox.top

  Object
    .values(this.items)
    .forEach(item => {
      this.setItemPosition({
        id: item.id,
        position: {
          x: item.position.x + deltaX,
          y: item.position.y + deltaY
        }
      })
    })
}

/**
 * Sets the position of a port.
 *
 * @param position - the new position of the port, in document coordinates
 */
export function setPortRelativePosition (this: DocumentStoreInstance, position: Point, portId: string) {
  const port = this.ports[portId]

  port.position = fromDocumentToEditorCoordinates(this.canvas, this.viewport, position, this.zoom)
}

/**
 * Sets the position of an item.
 *
 * @param position - the new position of the item, in editor coordinates
 */
export function setItemPosition (this: DocumentStoreInstance, { id, position }: { id: string, position: Point }) {
  const item = this.items[id]
  const delta: Point = {
    x: position.x - item.position.x,
    y: position.y - item.position.y
  }

  this.items[id].position = position
  this.setItemBoundingBox(id)

  item
    .portIds
    .forEach(portId => {
      const port = this.ports[portId]

      this.ports[portId].position = {
        x: port.position.x + delta.x,
        y: port.position.y + delta.y
      }
    })
}

/**
 * Drags the given target to the given position.
 * This handles snapping and grid alignment when applicable.
 *
 * @param originalPosition - the current position of the target, in editor coordinates
 * @param newPosition - the new position of the target, in editor coordinates
 */
export function dragTarget (this: DocumentStoreInstance, boundingBox: BoundingBox, originalPosition: Point, newPosition: Point, snapMode?: SnapMode) {
  const { snapping, grid } = usePreferencesStore()
  const snapPreference = (() => {
    if (snapMode) return snapMode
    if (snapping.snapToGrid.value) return SnapMode.Grid
    if (snapping.snapToAlign.value) return SnapMode.Outer
    return SnapMode.None
  })()
  const snapTolerance = (() => {
    switch (snapPreference) {
      case SnapMode.Grid:
        return grid.gridSize.value
      case SnapMode.Outer:
      case SnapMode.Radial:
        return snapping.snapTolerance.value
      default:
        return 0
    }
  })() as number
  const offset = boundaries.getSnapOffset(
    this.snapBoundaries,
    boundingBox,
    snapPreference,
    snapTolerance
  )

  this.setSelectionPosition({
    x: newPosition.x + offset.x - originalPosition.x,
    y: newPosition.y + offset.y - originalPosition.y
  })
}

/**
 * Drags selected item(s) to the given position.
 * This handles snapping and grid alignment when applicable.
 *
 * @param position - the new position of the item, in editor coordinates
 */
export function dragItem (this: DocumentStoreInstance, id: string, position: Point, snapMode?: SnapMode) {
  const { width, height, rotation } = this.items[id]
  const newPosition = fromDocumentToEditorCoordinates(this.canvas, this.viewport, position, this.zoom)
  const boundingBox = boundaries.getBoundingBox(newPosition, rotation, width, height)

  this.dragTarget(boundingBox, this.items[id].position, newPosition, snapMode)
}

/**
 * Drags a connnection control point to the given position.
 *
 * @param position - the new position of the control point, in editor coordinates
 */
export function dragControlPoint (this: DocumentStoreInstance, id: string, position: Point, offset: Point, index: number) {
  const controlPoint = this.connections[id].controlPoints[index]
  const newPosition = fromDocumentToEditorCoordinates(this.canvas, this.viewport, {
    x: position.x - offset.x,
    y: position.y - offset.y
  }, this.zoom)
  const boundingBox = boundaries.getPointBoundary(newPosition)
  const snapMode = this.totalSelectionCount > 1
    ? undefined // don't snap wires when multiple things are being dragged at the same time
    : SnapMode.Outer

  this.dragTarget(boundingBox, controlPoint.position, newPosition, snapMode)
}

/**
 * Moves all selected items and connection points by the given delta.
 */
export function setSelectionPosition (this: DocumentStoreInstance, delta: Point) {
  const groupIds = new Set<string>()

  // move all selected items
  this
    .selectedItemIds
    .forEach((itemId: string) => {
      const item = this.items[itemId]
      const position: Point = {
        x: item.position.x + delta.x,
        y: item.position.y + delta.y
      }

      if (item.groupId) {
        groupIds.add(item.groupId)
      }

      this.setItemPosition({ id: itemId, position })
    })

  // move the positions of all selected connection control points
  Object
    .keys(this.selectedControlPoints)
    .forEach(id => {
      const connection = this.connections[id]

      this
        .selectedControlPoints[id]
        .forEach(index => {
          const controlPoint = connection.controlPoints[index]

          controlPoint.position = {
            x: controlPoint.position.x + delta.x,
            y: controlPoint.position.y + delta.y
          }
        })
    })

  groupIds.forEach(this.setGroupBoundingBox)
}

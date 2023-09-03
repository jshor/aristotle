import { DocumentStoreInstance } from '..'
import boundaries from '../geometry/boundaries'
import rotation from '../geometry/rotation'
import Direction from '@/types/enums/Direction'
import SnapMode from '@/types/enums/SnapMode'
import ItemType from '@/types/enums/ItemType'
import fromDocumentToEditorCoordinates from '@/utils/fromDocumentToEditorCoordinates'
import { usePreferencesStore } from '@/store/preferences'

/**
 * Centers all items (together as a group) to the center of the canvas.
 * All distances between items are maintained when this occurs.
 */
export function centerAll (this: DocumentStoreInstance) {
  const { grid } = usePreferencesStore()
  const gridSize = grid.gridSize.value as number
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

export function setPortRelativePosition (this: DocumentStoreInstance, position: Point, portId: string) {
  const port = this.ports[portId]

  port.position = fromDocumentToEditorCoordinates(this.canvas, this.viewport, position, this.zoom)
}

/**
 * Sets the position of an item.
 *
 * @param payload
 * @param payload.id - ID of the item
 * @param payload.position - new position to move to
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
 * Drags selected item(s) to the given position.
 * This handles snapping and grid alignment when applicable.
 */
export function dragItem (this: DocumentStoreInstance, id: string, position: Point, snapMode?: SnapMode) {
  const { snapping, grid } = usePreferencesStore()
  const { x, y } = fromDocumentToEditorCoordinates(this.canvas, this.viewport, position, this.zoom)
  const { width, height, rotation } = this.items[id]
  const boundingBox = boundaries.getBoundingBox({ x, y }, rotation, width, height)
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
    id,
    position: {
      x: x + offset.x,
      y: y + offset.y
    }
  })
}

/**
 * Moves all selected items according to the delta provided.
 *
 * @param delta - delta to move the items by
 */
export function moveSelectionPosition (this: DocumentStoreInstance, delta: Point) {
  const id: string | undefined = this.selectedItemIds[0]

  if (id) {
    const item = this.items[id]
    const position: Point = {
      x: item.position.x + delta.x,
      y: item.position.y + delta.y
    }

    this.commitState()
    this.setSelectionPosition({ id, position })
  }
}

/**
 * Moves all selected items according to the delta that the given item has moved by.
 *
 * @param payload
 * @param payload.id - ID of the reference item moving
 * @param payload.position - new position that the reference item has moved to
 */
export function setSelectionPosition (this: DocumentStoreInstance, { id, position }: { id: string, position: Point }) {
  const referenceItem = this.items[id]
  const delta: Point = {
    x: position.x - referenceItem.position.x,
    y: position.y - referenceItem.position.y
  }
  const groupIds = new Set<string>()

  this.setSelectionState({ id, value: true })

  if (referenceItem.type === ItemType.Freeport) {
    // if this item is a freeport, drag only this and nothing else
    return this.setItemPosition({ id, position })
  }

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

  groupIds.forEach(this.setGroupBoundingBox)
}

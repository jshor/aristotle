import { DocumentStoreInstance } from '..'
import boundaries from '../geometry/boundaries'

const MIN_SCALE = 0.1
const MAX_SCALE = 2
const SCALE_STEP = 0.1

/**
 * Assigns the rects of the canvas and viewport according to the screen size and rect provided.
 *
 * @param {DOMRectReadOnly} payload.rect - the rect of the item's DOM element
 */
export function setViewerSize (this: DocumentStoreInstance, rect: DOMRect) {
  this.viewport = rect

  this.canvas.right = screen.width / MIN_SCALE
  this.canvas.bottom = screen.height / MIN_SCALE

  if (!this.hasLoaded && rect.width > 0 && rect.height > 0) {
    this.hasLoaded = true
    this.centerAll()
    this.panToCenter()
    // this.setZoom({ zoom: 1.4 }) // TODO: set the user-defined default zoom like this
  }
}

/**
 * Updates the size of the item.
 * This re-positions the item such that its centroid is in the same location as it was with its old size.
 *
 * @param {object} payload
 * @param {DOMRectReadOnly} payload.rect - the rect of the item's DOM element
 * @param {string} payload.id - ID of the item
 */
export function setItemSize (this: DocumentStoreInstance, { rect, id }: { rect: DOMRectReadOnly, id: string }) {
  const item = this.items[id]

  const width = rect.width / this.zoomLevel
  const height = rect.height / this.zoomLevel

  // reposition w.r.t. the centroid
  const centerX = item.position.x + (item.width / 2)
  const centerY = item.position.y + (item.height / 2)
  const newX = centerX - width / 2
  const newY = centerY - height / 2

  this.items[id].position = {
    x: newX,
    y: newY
  }
  this.items[id].width = width
  this.items[id].height = height

  this.setItemBoundingBox(id)
  this.setItemPortPositions(id)

  if (this.items[id].groupId) {
    this.setGroupBoundingBox(this.items[id].groupId as string)
  }
}

/**
 * Sets the bounding box of an item.
 *
 * @param {string} payload.id - ID of the item
 */
export function setItemBoundingBox (this: DocumentStoreInstance, id: string) {
  if (!this.items[id]) return

  const {
    position,
    rotation,
    width,
    height
  } = this.items[id]

  this.items[id].boundingBox = boundaries.getBoundingBox(position, rotation, width, height)
}

/**
 * Sets the bounding box of a group.
 *
 * @param {string} payload.id - ID of the group
 */
export function setGroupBoundingBox (this: DocumentStoreInstance, id: string) {
  if (!this.groups[id]) return

  const boundingBoxes = this
    .groups[id]
    .itemIds
    .map(id => this.items[id].boundingBox)

  this.groups[id].boundingBox = boundaries.getGroupBoundingBox(boundingBoxes)
}
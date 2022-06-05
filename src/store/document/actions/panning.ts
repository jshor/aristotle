import { DocumentStoreInstance } from '..'
import boundaries from '../geometry/boundaries'

/**
 * Pans to the given point.
 */
export function panTo (this: DocumentStoreInstance, pan: Point) {
  const deltaX = pan.x - this.canvas.left
  const deltaY = pan.y - this.canvas.top

  this.canvas.left += deltaX
  this.canvas.right += deltaX
  this.canvas.top += deltaY
  this.canvas.bottom += deltaY
}

/**
 * Pans to the center of the available canvas, such that its center is visible in the center of the viewport.
 */
export function panToCenter (this: DocumentStoreInstance) {
  const midpoint = boundaries.getBoundingBoxMidpoint(this.canvas)

  this.panTo({
    x: (this.viewport.width / 2) - midpoint.x,
    y: (this.viewport.height / 2) - midpoint.y
  })
}

import { DocumentStoreInstance } from '..'
import boundaries from '../geometry/boundaries'

/**
 * Pans to the given point.
 */
export function panTo (this: DocumentStoreInstance, pan: Point, animate = false) {
  this.panDelta({
    x: pan.x - this.canvas.left,
    y: pan.y - this.canvas.top
  }, animate)
}

export function panDelta (this: DocumentStoreInstance, delta: Point, animate = false) {
  this.animatePan = animate

  const from: BoundingBox = { ...this.canvas }

  const animatePan = (c = 0) => {
    const easeOut = (x: number) => 1 - (1 - x) * (1 - x)
    const percent = easeOut(c / 100)
    const deltaX = delta.x * percent
    const deltaY = delta.y * percent

    this.canvas.left = from.left + deltaX
    this.canvas.right = from.right + deltaX
    this.canvas.top = from.top + deltaY
    this.canvas.bottom = from.bottom + deltaY

    if (c < 100 && this.animatePan) {
      requestAnimationFrame(animatePan.bind(this, c + 5))
    } else {
      this.animatePan = false
    }
  }

  if (animate) {
    requestAnimationFrame(animatePan.bind(this, 0))
  } else {
    this.canvas.left += delta.x
    this.canvas.right += delta.x
    this.canvas.top += delta.y
    this.canvas.bottom += delta.y
  }
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

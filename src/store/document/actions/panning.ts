import BoundingBox from '@/types/types/BoundingBox'
import Point from '@/types/interfaces/Point'
import { DocumentStoreInstance } from '..'
import boundaries from '../geometry/boundaries'
import {
  PANNING_EASING_FUNCTION,
  PANNING_FRICTION,
  PANNING_SPEED
} from '@/constants'

/**
 * Pans to the given canvas point w.r.t. the top left of the viewport.
 */
export function panTo (this: DocumentStoreInstance, pan: Point, animate = false) {
  this.panDelta({
    x: pan.x - this.canvas.left,
    y: pan.y - this.canvas.top
  }, animate)
}

/**
 * Pans by the given amount.
 * Provide negative values to navigate down or to the right.
 * Provide positive values to navigate up or to the left.
 */
export function panDelta (this: DocumentStoreInstance, delta: Point, animate = false) {
  const from: BoundingBox = { ...this.canvas }
  const momentum = Math.max(Math.abs(delta.x), Math.abs(delta.y), 1) * PANNING_FRICTION
  const speed = PANNING_SPEED

  cancelAnimationFrame(this.panningAnimationFrameId)

  const animatePan = (c = 0) => {
    cancelAnimationFrame(this.panningAnimationFrameId)

    const percent = PANNING_EASING_FUNCTION(c / momentum)
    const deltaX = delta.x * percent
    const deltaY = delta.y * percent

    this.setCanvasBoundingBox({
      left: from.left + deltaX,
      right: from.right + deltaX,
      top: from.top + deltaY,
      bottom: from.bottom + deltaY
    })

    if (c < momentum) {
      this.panningAnimationFrameId = requestAnimationFrame(animatePan.bind(this, c + speed))
    }
  }

  if (animate && momentum >= PANNING_SPEED) { // TODO: make this configurable so that users can opt out of momentum
    animatePan()
  } else {
    this.setCanvasBoundingBox({
      left: this.canvas.left + delta.x,
      right: this.canvas.right + delta.x,
      top: this.canvas.top + delta.y,
      bottom: this.canvas.bottom + delta.y
    })
  }
}

/**
 * Pans to the center of the available canvas, such that its center is visible in the center of the viewport.
 */
export function panToCenter (this: DocumentStoreInstance) {
  // TODO: this pans to the literal center of the canvas, but better usability would be to pan to the center of the items
  const midpoint = boundaries.getBoundingBoxMidpoint(this.canvas)

  this.panTo({
    x: (this.viewport.width / 2) - (midpoint.x * this.zoomLevel),
    y: (this.viewport.height / 2) - (midpoint.y * this.zoomLevel)
  })
}

/**
 * Sets the canvas bounding box.
 */
export function setCanvasBoundingBox (this: DocumentStoreInstance, boundingBox: BoundingBox) {
  this.canvas = { ...boundingBox }
}

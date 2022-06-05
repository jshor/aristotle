import { DocumentStoreInstance } from '..'
import boundaries from '../geometry/boundaries'
import fromDocumentToEditorCoordinates from '@/utils/fromDocumentToEditorCoordinates'

const MIN_SCALE = 0.1
const MAX_SCALE = 2
const SCALE_STEP = 0.1

/**
 * Increments the current zoom by one scale step (in the positive or negative direction).
 *
 * @param [direction = 1] - directional scalar (1 or -1)
 */
export function incrementZoom (this: DocumentStoreInstance, direction = 1) {
  this.setZoom({
    zoom: this.zoomLevel + (SCALE_STEP * direction)
  })
}

/**
 * Sets the zoom level for the document.
 * This will zoom on the focal point (if provided) or the center of the visible area (viewport).
 *
 * @param zoom - percentage of zoom by decimal (e.g., 1.0 = 100%)
 * @param [point] - focal point to zoom on
 */
export function setZoom (this: DocumentStoreInstance, { zoom, point }: { zoom: number, point?: Point }) {
  if (zoom < MIN_SCALE) zoom = MIN_SCALE
  if (zoom > MAX_SCALE) zoom = MAX_SCALE

  zoom = Math.round(zoom * 100) / 100

  if (!point) {
    point = boundaries.getBoundingBoxMidpoint(this.viewport)
    point.x += this.viewport.left
    point.y += this.viewport.top
  }

  const zoomedPoint = fromDocumentToEditorCoordinates(this.canvas, this.viewport, point, this.zoomLevel)
  const scaledPoint = { // the canvas coordinate, scaled by the new zoom factor
    x: zoomedPoint.x * zoom,
    y: zoomedPoint.y * zoom
  }
  const viewportPoint = { // the point w.r.t. the top left offset of the viewport
    x: point.x - this.viewport.x,
    y: point.y - this.viewport.y
  }

  this.panTo({
    x: Math.round(Math.min(viewportPoint.x - scaledPoint.x, 0)),
    y: Math.round(Math.min(viewportPoint.y - scaledPoint.y, 0))
  })

  this.zoomLevel = zoom
}

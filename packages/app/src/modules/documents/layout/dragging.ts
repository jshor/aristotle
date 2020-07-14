import $ from 'jquery'
import { Vue } from 'vue-property-decorator'
import IPoint from '@/interfaces/IPoint'
import IScreenPoint from '@/interfaces/IScreenPoint'
import DragService from '@/services/DragService'

/**
 * Converts a point in screen coordinates (left, top) to Cartesian (x, y).
 *
 * @param {IScreenPoint} position
 * @returns {IPoint}
 */
export function screenToPoint (position: IScreenPoint): IPoint {
  return {
    x: position.left,
    y: position.top
  }
}

/**
 * Returns the id of the first element in the list of snapped elements.
 *
 * @param {DragService} dragService - element dragging service instance
 * @returns {string}
 */
export function getSnappedId (dragService: DragService): string {
  return dragService
    .getSnappedElements()
    .map(e => e.item.dataset.id)
    .filter(id => id)
    .shift()
}

/**
 * Returns the a new position based on the given one, and any element coordinates that it may "snap" to.
 * This provides the base logic for snap-to-align elements.
 *
 * @param {DragService} dragService - element dragging service instance
 * @param {Vue<Canvas>} canvas - instance of the canvas component
 * @param {IScreenPoint} position - current dragged position
 * @param {number} threshold - snapping distance threshold (in pixels)
 * @returns {IScreenPoint}
 */
export function getSnappedPosition (dragService: DragService, canvas, position: IScreenPoint, threshold: number): IScreenPoint {
  const parentRect = dragService.component.$parent.$el.getBoundingClientRect()
  const parentCoords = canvas.fromDocumentToEditorCoordinates(parentRect)
  const newPosition = {
    left: position.left,
    top: position.top
  }

  dragService
    .getSnappedElements()
    .forEach(snappedElement => {
      const itemCoords = canvas.fromDocumentToEditorCoordinates(snappedElement.item.getBoundingClientRect())
      const left = itemCoords.x - parentCoords.x
      const top = itemCoords.y - parentCoords.y

      /* when the dragging element is positioned relative to the canvas */
      if (Math.abs(itemCoords.x - position.left) < threshold) {
        newPosition.left = itemCoords.x
      }

      if (Math.abs(itemCoords.y - position.top) < threshold) {
        newPosition.top = itemCoords.y
      }

      /* when the dragging element is positioned relative to its parent */
      if (Math.abs(left - position.left) < threshold) {
        newPosition.left = left
      }

      if (Math.abs(top - position.top) < threshold) {
        newPosition.top = top
      }
    })

  return newPosition
}

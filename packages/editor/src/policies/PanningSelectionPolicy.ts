import draw2d from 'draw2d'
import Element from '../core/Element'

/**
 * This policy allows the user to move the canvas ("pan") in any direction using the mouse.
 *
 * @class PanningSelectionPolicy
 */
export default class PanningSelectionPolicy extends draw2d.policy.canvas.SingleSelectionPolicy {
  /**
   * The actively-dragged canvas element.
   *
   * @type {Element}
   */
  public mouseDraggingElement: Element = null

  /**
   * The canvas element that the mouse is holding down on.
   *
   * @type {Element}
   */
  public mouseDownElement: Element = null

  /**
   * Scrolls the HTML wrapper element according to the user mouse inputs.
   *
   * @overrides {draw2d.policy.canvas.SingleSelectionPolicy.onMouseDrag()}
   * @param {draw2d.Canvas} canvas
   * @param {number} dx The x diff between start of dragging and this event
   * @param {number} dy The y diff between start of dragging and this event
   * @param {number} dx2 The x diff since the last call of this dragging operation
   * @param {number} dy2 The y diff since the last call of this dragging operation
   * @param {boolean} shiftKey true if the shift key has been pressed during this event
   * @param {boolean} ctrlKey true if the ctrl key has been pressed during the event
   */
  public onMouseDrag = (
    canvas: draw2d.Canvas,
    dx: number,
    dy: number,
    dx2: number,
    dy2: number,
    shiftKey: boolean,
    ctrlKey: boolean
  ): void => {
    super.onMouseDrag(canvas, dx, dy, dx2, dy2, shiftKey, ctrlKey)

    if (this.mouseDraggingElement === null && this.mouseDownElement === null) {
      const area = canvas.getScrollArea()
      const scalar = 1 / canvas.zoomFactor

      area.scrollTop(area.scrollTop() - (dy2 * scalar))
      area.scrollLeft(area.scrollLeft() - (dx2 * scalar))
    }
  }
}

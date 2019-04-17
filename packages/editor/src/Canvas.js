import draw2d from 'draw2d'
import $ from 'jquery'

/**
 * Extends the draw2d Canvas to add user-friendly enhancements and support parent wrapper elements.
 * This class is practically untestable due to the complexity of lack of jsdom SVG support and inability to stub Raphaeljs.
 *
 * @class Canvas
 * @extends draw2d.Canvas
 */
export default class Canvas extends draw2d.Canvas {
  constructor (elementId) {
    super(elementId)

    this.parent = this.html[0].parentNode
    this.setScrollArea(this.parent)
    this.registerEventListeners()
  }

  registerEventListeners = () => {
    document.addEventListener('mousemove', this.onBoundlessMouseMove)
    document.addEventListener('mouseup', this.onBoundlessMouseUp)
    this.commandStack.addEventListener(() => this.fireEvent('commandStackChanged'))
    this.html[0].addEventListener('click', () => {
      if (this.getSelection().getSize() === 0) {
        this.fireEvent('deselect')
      }
    })
  }

  /**
   * Returns the absolute X position in the document of the parent wrapper.
   *
   * @override getAbsoluteX
   * @returns {Number}
   */
  getAbsoluteX = () => $(this.parent).offset().left

  /**
   * Returns the absolute Y position in the document of the parent wrapper.
   *
   * @override getAbsoluteX
   * @returns {Number}
   */
  getAbsoluteY = () => $(this.parent).offset().top

  /**
   * Fires mousedrag events if the mouse is down for any document movement.
   * This fixes the draw2d issue of being unable to change the boundary when the mouse leaves the canvas.
   *
   * @param {MouseEvent} event
   */
  onBoundlessMouseMove = (event) => {
    if (this.mouseDown) {
      const { clientX, clientY, shiftKey, ctrlKey } = event
      const { x, y } = this.fromDocumentToCanvasCoordinate(clientX, clientY)
      const diffXAbs = (clientX - this.mouseDownX) * this.zoomFactor
      const diffYAbs = (clientY - this.mouseDownY) * this.zoomFactor
      const diffX = diffXAbs - this.mouseDragDiffX
      const diffY = diffYAbs - this.mouseDragDiffY
      const hoverFigure = this.currentHoverFigure

      this.editPolicy.each((i, policy) => {
        policy.onMouseDrag(this, diffXAbs, diffYAbs, diffX, diffY, shiftKey, ctrlKey)
      })
      this.mouseDragDiffX = diffXAbs
      this.mouseDragDiffY = diffYAbs
      this.fireEvent('mousemove', { x, y, shiftKey, ctrlKey, hoverFigure })
    }
  }

  /**
   * Fires mouseup events if the mouse is down for any document movement.
   * This fixes the draw2d issue of having DOM movements get "stuck" when the mouse leaves the canvas.
   *
   * @param {MouseEvent} event
   */
  onBoundlessMouseUp = (event) => {
    if (this.mouseDown === false) {
      return
    }

    // event = this._getEvent(event)
    this.calculateConnectionIntersection()

    this.mouseDown = false
    const { x, y } = this.fromDocumentToCanvasCoordinate(event.clientX, event.clientY)

    this.editPolicy.each((i, policy) => {
      policy.onMouseUp(this, x, y, event.shiftKey, event.ctrlKey)
    })

    this.mouseDragDiffX = 0
    this.mouseDragDiffY = 0
  }

  /**
   * Sets the actively-dragged toolbox element dimensions to match the current zoom level.
   *
   * @param {HTMLElememt} elememt
   */
  onDragEnter = (element) => {
    const scale = 1 / this.zoomFactor
    const width = $(element).width() * scale
    const height = $(element).height() * scale

    $('.ui-draggable-dragging').width(width)
    $('.ui-draggable-dragging').height(height)
  }

  /**
   * Returns the document coordinates of the active-dragged toolbox element.
   *
   * @returns {Object} x, y coordinates
   */
  getDraggedCoordinates = () => {
    const { left, top } = $('.ui-draggable-dragging').offset()

    return this.fromDocumentToCanvasCoordinate(left, top)
  }
}

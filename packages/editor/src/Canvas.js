// import draw2d from 'draw2d'
import Draw2DCanvas from './Draw2DCanvas'
import $ from 'jquery'

/**
 * Extends the draw2d Canvas to add user-friendly enhancements and support parent wrapper elements.
 *
 * @class Canvas
 * @extends draw2d.Canvas
 */
export default class Canvas extends Draw2DCanvas {
  constructor (elementId) {
    super(elementId)

    this.wrapper = this.html[0]
    this.parent = this.wrapper.parentNode
    this.setScrollArea(this.parent)
    this.registerEventListeners()
    // $("body").append(`
    // <svg style="position: absolute; width: 1px; height: 1px">
    // <filter id="filter-0" width="1" height="1"><feOffset in="SourceAlpha" dx="1" dy="1" result="1"></feOffset><feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.3 0 " in="1" result="2"></feColorMatrix><feGaussianBlur stdDeviation="2" in="2" result="3"></feGaussianBlur><feMerge in="3" result="4"><feMergeNode in="3"></feMergeNode><feMergeNode in="SourceGraphic"></feMergeNode></feMerge></filter>
    // </svg>
    // `)
    
    // this.html.on("touchend", (event) => {
    //   event = this._getEvent(event)

    //   if(this.mouseDownX === event.clientX || this.mouseDownY === event.clientY){
    //     console.log('ROUTING CLICK')
    //     var pos = this.fromDocumentToCanvasCoordinate(event.clientX, event.clientY);
    //     this.onClick(pos.x, pos.y, event.shiftKey, event.ctrlKey);
    //   }
    // })
  }

  /**
   * Registers the user interaction event listeners.
   */
  registerEventListeners = () => {
    document.addEventListener('mousemove', this.onBoundlessMouseMove)
    document.addEventListener('mouseup', this.onBoundlessMouseUp)
    this.commandStack.addEventListener(() => this.fireEvent('commandStackChanged'))
    this.on('unselect', this.onDeselect)
  }

  /**
   * Fires `toolbox.close` when the canvas is clicked and no elements are actively selected.
   *
   * @emits `deselect`
   * @emits `toolbox.close`
   */
  onDeselect = () => {
    if (this.getSelection().getSize() === 0) {
      this.fireEvent('toolbox.close')
    }
  }

  /**
   * Returns the absolute X position in the document of the parent wrapper.
   *
   * @override {draw2d.Canvas.getAbsoluteX}
   * @returns {Number}
   */
  getAbsoluteX = () => $(this.parent).offset().left

  /**
   * Returns the absolute Y position in the document of the parent wrapper.
   *
   * @override {draw2d.Canvas.getAbsoluteY}
   * @returns {Number}
   */
  getAbsoluteY = () => $(this.parent).offset().top

  /**
   * Fires mousedrag events if the mouse is down for any document movement.
   * This fixes the draw2d issue of being unable to change the boundary when the mouse leaves the canvas.
   *
   * @emits `mousemove`
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
    if (this.mouseDown) {
      this.calculateConnectionIntersection()

      this.mouseDown = false
      const { x, y } = this.fromDocumentToCanvasCoordinate(event.clientX, event.clientY)

      this.editPolicy.each((i, policy) => {
        policy.onMouseUp(this, x, y, event.shiftKey, event.ctrlKey)
      })

      this.mouseDragDiffX = 0
      this.mouseDragDiffY = 0
    }
  }

  /**
   * Handles a toolbox drop event.
   *
   * @override {draw2d.Canvas.onDrop}
   * @param {HTMLElement} el
   */
  onDrop = (el) => {
    const rect = this.parent.getBoundingClientRect()
    const { clientX, clientY } = this.getDomEvent()

    const isInViewport = (
      clientX >= rect.left &&
      clientY >= rect.top &&
      clientX <= rect.right &&
      clientY <= rect.bottom
    )

    if (isInViewport) {
      const { x, y } = this.getDraggedCoordinates()

      // TODO: must get params from `data-` attrs on `el`
      this.addElement(el.data(), x, y)
    }
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

  fromCanvasToDocumentCoordinate = (x, y) => {
    const coords = super.fromCanvasToDocumentCoordinate(x, y)

    coords.x -= this.getAbsoluteX()
    coords.y -= this.getAbsoluteY()

    return coords
  }

  /**
   * Returns the most recent Canvas DOM event.
   *
   * @returns {Event}
   */
  getDomEvent = () => event
}

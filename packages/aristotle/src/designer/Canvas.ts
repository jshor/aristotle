import draw2d from 'draw2d'

/**
 * Extends the draw2d Canvas to add user-friendly enhancements and support parent wrapper elements.
 * This class is practically untestable due to the complexity of lack of jsdom SVG support and inability to stub Raphaeljs.
 *
 * @class Canvas
 * @extends draw2d.Canvas
 */
export default class Canvas extends draw2d.Canvas {
  public mouseDown: boolean = false
  public mouseDownX: number = 0
  public mouseDownY: number = 0
  public mouseDragDiffX: number = 0
  public mouseDragDiffY: number = 0
  public zoomFactor: number = 1
  public currentHoverFigure: any = null
  public editPolicy: draw2d.util.ArrayList
  public html: draw2d.util.ArrayList
  public commandStack: draw2d.CommandStack
  private parent: HTMLElement

  constructor (elementId: string) {
    super(elementId)

    this.parent = this.html[0].parentNode
    super.setScrollArea(this.parent)
    // this.parent = document.createElement('div')
    document.addEventListener('mousemove', this.onBoundlessMouseMove)
    document.addEventListener('mouseup', this.onBoundlessMouseUp)
    this.commandStack.addEventListener(() => super.fireEvent('commandStackChanged'))
    this.html[0].addEventListener('click', () => super.fireEvent('deselect'))
  }

  /**
   * Returns the absolute X position in the document of the parent wrapper.
   *
   * @ts-ignore
   * @override getAbsoluteX
   * @returns {Number}
   */
  // @ts-ignore
  public getAbsoluteX = (): number => $(this.parent).offset().left

  /**
   * Returns the absolute Y position in the document of the parent wrapper.
   *
   * @override getAbsoluteX
   * @returns {Number}
   */
  // @ts-ignore
  public getAbsoluteY = (): number => $(this.parent).offset().top

  public installEditPolicy = (policy: draw2d.policy) => super.installEditPolicy(policy)

  public getSelection = (): any => super.getSelection()

  public add = (shape: draw2d.shape, x: number = 0, y: number = 0) => super.add(shape, x, y)

  /**
   * Fires mousedrag events if the mouse is down for any document movement.
   * This fixes the draw2d issue of being unable to change the boundary when the mouse leaves the canvas.
   *
   * @param {MouseEvent} event
   */
  private onBoundlessMouseMove = (event: MouseEvent) => {
    if (this.mouseDown) {
      const { clientX, clientY, shiftKey, ctrlKey } = event
      const { x, y } = super.fromDocumentToCanvasCoordinate(clientX, clientY)
      const diffXAbs = (clientX - this.mouseDownX) * this.zoomFactor
      const diffYAbs = (clientY - this.mouseDownY) * this.zoomFactor
      const diffX = diffXAbs - this.mouseDragDiffX
      const diffY = diffYAbs - this.mouseDragDiffY
      const hoverFigure = this.currentHoverFigure

      this.editPolicy.each((i: number, policy: draw2d.policy) => {
        policy.onMouseDrag(this, diffXAbs, diffYAbs, diffX, diffY, shiftKey, ctrlKey)
      })
      this.mouseDragDiffX = diffXAbs
      this.mouseDragDiffY = diffYAbs
      super.fireEvent('mousemove', { x, y, shiftKey, ctrlKey, hoverFigure })
    }
  }

  /**
   * Fires mouseup events if the mouse is down for any document movement.
   * This fixes the draw2d issue of having DOM movements get "stuck" when the mouse leaves the canvas.
   *
   * @param {MouseEvent} event
   */
  private onBoundlessMouseUp = (event: MouseEvent) => {
    if (this.mouseDown === false) {
      return
    }

    // event = this._getEvent(event)
    super.calculateConnectionIntersection()

    this.mouseDown = false
    const { x, y } = super.fromDocumentToCanvasCoordinate(event.clientX, event.clientY)

    this.editPolicy.each((i: number, policy: draw2d.policy) => {
      policy.onMouseUp(this, x, y, event.shiftKey, event.ctrlKey)
    })

    this.mouseDragDiffX = 0
    this.mouseDragDiffY = 0
  }
}

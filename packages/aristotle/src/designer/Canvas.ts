import draw2d from 'draw2d'

class Canvas extends draw2d.Canvas {
  public mouseDown: boolean = false
  public mouseDownX: number = 0
  public mouseDownY: number = 0
  public mouseDragDiffX: number = 0
  public mouseDragDiffY: number = 0
  public zoomFactor: number = 1
  public currentHoverFigure: any = null
  public editPolicy: draw2d.util.ArrayList

  constructor (elementId: string) {
    super(elementId)
    this.installEditPolicies()
    this.setScrollArea(elementId)
    document.addEventListener('mousemove', this.onBoundlessMouseMove)
    document.addEventListener('mouseup', this.onBoundlessMouseUp)
  }

  public createConnection = (sourcePort: draw2d.Port, targetPort: draw2d.Port): draw2d.Connection => {
    const connection = new draw2d.Connection()

    connection.setOutlineColor('#000000')
    connection.setOutlineStroke(1)
    connection.setColor('#ff0000')
    connection.setGlow(false)
    connection.setRouter(new draw2d.layout.connection.CircuitConnectionRouter())

    return connection
  }

  public setMouseMode(mode: string) {
    switch (mode) {
      case 'PANNING':
        super.installEditPolicy(new draw2d.policy.canvas.PanningSelectionPolicy())
        break
      case 'SELECTION':
      default:
        super.installEditPolicy(new draw2d.policy.canvas.BoundingboxSelectionPolicy())
        break
    }
  }

  private setScrollArea = (elementId: string) => {
    const el = document.getElementById(elementId)

    if (el) {
      super.setScrollArea(el.parentNode)
    }
  }

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

  private installEditPolicies = () => {
    // this.installEditPolicy(new draw2d.policy.canvas.FadeoutDecorationPolicy())
    super.installEditPolicy(new draw2d.policy.canvas.ShowGridEditPolicy())
    super.installEditPolicy(new draw2d.policy.connection.DragConnectionCreatePolicy({
      createConnection: this.createConnection
    }))
  }

  // getBoundingBox() {
  //   var xCoords = [];
  //   var yCoords = [];
  //   this.getFigures().each(function (i, f) {
  //     // if(f instanceof shape_designer.figure.ExtPort){
  //     //     return;
  //     // }
  //     var b = f.getBoundingBox();
  //     xCoords.push(b.x, b.x + b.w);
  //     yCoords.push(b.y, b.y + b.h);
  //   });
  //   var minX = Math.min.apply(Math, xCoords);
  //   var minY = Math.min.apply(Math, yCoords);
  //   var width = Math.max(10, Math.max.apply(Math, xCoords) - minX);
  //   var height = Math.max(10, Math.max.apply(Math, yCoords) - minY);

  //   return new draw2d.geo.Rectangle(minX, minY, width, height);
  // }
}
export default Canvas

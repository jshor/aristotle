import draw2d from 'draw2d'

class Canvas extends draw2d.Canvas {
  constructor (elementId) {
    super(elementId)
    this.installEditPolicies()
    this.setScrollArea(document.getElementById(elementId).parentNode)
    document.addEventListener('mousemove', this.onBoundlessMouseMove)
    document.addEventListener('mouseup', this.onBoundlessMouseUp)
  }

  /**
   * Fires mousedrag events if the mouse is down for any document movement.
   * This fixes the draw2d issue of being unable to change the boundary when the mouse leaves the canvas.
   *
   * @param {DOMEvent} event
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
   * @param {DOMEvent} event
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

  createConnection = (sourcePort, targetPort) => {
    const connection = new draw2d.Connection()

    connection.setOutlineColor('#000000')
    connection.setOutlineStroke(1)
    connection.setColor('#ff0000')
    connection.setGlow(false)
    connection.setRouter(new draw2d.layout.connection.CircuitConnectionRouter())
    
    return connection
  }

  installEditPolicies = () => {
    // this.installEditPolicy(new draw2d.policy.canvas.FadeoutDecorationPolicy())
    this.installEditPolicy(new draw2d.policy.canvas.ShowGridEditPolicy())
    this.installEditPolicy(new draw2d.policy.connection.DragConnectionCreatePolicy({
      createConnection: this.createConnection
    }))
  }

  setMouseMode (mode) {
    switch (mode) {
      case 'PANNING':
        this.installEditPolicy(new draw2d.policy.canvas.PanningSelectionPolicy())
        break
      case 'SELECTION':
      default:
        this.installEditPolicy(new draw2d.policy.canvas.BoundingboxSelectionPolicy())
        break
    }
  }

  getBoundingBox() {
    var xCoords = [];
    var yCoords = [];
    this.getFigures().each(function (i, f) {
      // if(f instanceof shape_designer.figure.ExtPort){
      //     return;
      // }
      var b = f.getBoundingBox();
      xCoords.push(b.x, b.x + b.w);
      yCoords.push(b.y, b.y + b.h);
    });
    var minX = Math.min.apply(Math, xCoords);
    var minY = Math.min.apply(Math, yCoords);
    var width = Math.max(10, Math.max.apply(Math, xCoords) - minX);
    var height = Math.max(10, Math.max.apply(Math, yCoords) - minY);

    return new draw2d.geo.Rectangle(minX, minY, width, height);
  }
}
export default Canvas
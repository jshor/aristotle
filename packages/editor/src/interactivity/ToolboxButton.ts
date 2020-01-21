import draw2d from 'draw2d'
import Editor from '../core/Editor'
import addTouchEvents from '../utils/addTouchEvents'

export default class ToolboxButton extends draw2d.shape.icon.Gear2 {
  protected container: draw2d.Figure = this

  protected element: draw2d.Figure = this

  protected editor: Editor

  constructor (container: draw2d.Figure, width: number, height: number) {
    super({
      width,
      height,
      color: '#ffffff'
    })

    this.container = container
    this.element = container.parent

    super.addCssClass('clickable')

    this.element.on('added', this.addEventListeners)
    this.element.on('added', addTouchEvents.bind(this, this))

    addTouchEvents(this)
  }

  /**
   * Attaches `select`, `unselect`, and `zoomed` event listeners.
   */
  addEventListeners = (): void => {
    super.on('click', this.fireToolboxEvent)
    this.element.on('added', this.toggleVisibility)
    this.container.canvas.on('unselect', this.toggleVisibility)
    this.container.canvas.on('select', this.toggleVisibility)
    this.container.canvas.on('zoomed', this.scaleToZoomFactor)
  }

  /**
   * Sets the visibility of the toolbox button depending on element selection.
   */
  toggleVisibility = (): void => {
    const isSelected = this.element.isSelected()

    this.container.setVisible(isSelected)
    super.setVisible(isSelected)
  }

  /**
   * Scales the clickable area and the icon according to the canvas' zoom factor.
   */
  scaleToZoomFactor = (): void => {
    const zoomFactor = 1 / this.container.canvas.zoomFactor

    this.container.setWidth(16 / zoomFactor)
    this.container.setHeight(16 / zoomFactor)
    super.setWidth(16 / zoomFactor)
    super.setHeight(16 / zoomFactor)
  }

  /**
   * Fires a `toolbox` update event with the element setting(s) to present a toolbox to the user.
   * The payload will contain cartesian screen coordinates to indicate where to place the toolbox.
   *
   * @emits `toolbox`
   */
  fireToolboxEvent = (): void => {
    const x: number = this.element.x + this.container.x
    const y: number = this.element.y
    const position: Point = this.container.canvas.fromCanvasToDocumentCoordinate(x, y)

    this.container.canvas.fireEvent('toolbox.open', {
      elementId: this.element.id,
      settings: this.element.settings,
      position
    })
  }
}

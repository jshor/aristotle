import draw2d from 'draw2d'
import { Editor } from 'index'

export default class ToolboxButton extends draw2d.shape.basic.Rectangle {
  private icon: draw2d.shape.icon.Gear2

  protected figure: draw2d.Figure = this

  protected editor: Editor

  constructor (parent) {
    super({
      width: 16,
      height: 16,
      visible: false,
      opacity: 0
    })

    super.addCssClass('clickable')
    this.addIcon()
    this.addToParent(parent)
    this.toggleToolboxVisibility()
  }

  addIcon = () => {
    const locator = new draw2d.layout.locator.XYAbsPortLocator(0, 0)
    this.icon = new draw2d.shape.icon.Gear2({
      width: super.getWidth(),
      height: super.getHeight(),
      color: '#ffffff'
    })

    this.icon.addCssClass('clickable')
    this.icon.on('click', this.fireToolboxEvent) // TODO: add 'removed' event
    this.figure.add(this.icon, locator)
  }

  addEventListeners = () => {
    this.figure.canvas.on('unselect', this.toggleToolboxVisibility)
    this.figure.canvas.on('select', this.toggleToolboxVisibility)
    this.figure.canvas.on('zoomed', this.scaleToZoomFactor)
  }

  addToParent = (parent) => {
    const x = parent.width + 10
    const locator = new draw2d.layout.locator.XYAbsPortLocator(x, 0)

    parent.on('added', this.addEventListeners)
    parent.add(this, locator)
  }

  /**
   * Sets the visibility of the toolbox button if it exists.
   */
  toggleToolboxVisibility = () => {
    const isSelected = this.figure.parent.isSelected()

    this.figure.setVisible(isSelected)
    this.icon.setVisible(isSelected)
  }

  scaleToZoomFactor = () => {
    const zoomFactor = 1 / this.figure.canvas.zoomFactor

    this.figure.setWidth(16 / zoomFactor)
    this.figure.setHeight(16 / zoomFactor)
    this.icon.setWidth(16 / zoomFactor)
    this.icon.setHeight(16 / zoomFactor)
  }

  /**
   * Fires a `toolbox` update event with the element setting(s) to present a toolbox to the user.
   * The payload will contain cartesian screen coordinates to indicate where to place the toolbox.
   *
   * @emits `toolbox`
   */
  fireToolboxEvent = () => {
    const { parent } = this.figure
    const x = parent.x + this.figure.x
    const y = parent.y - 5
    const position = this.figure.canvas.fromCanvasToDocumentCoordinate(x, y)

    this.figure.canvas.fireEvent('toolbox.open', {
      elementId: parent.id,
      settings: parent.settings,
      position
    })
  }
}

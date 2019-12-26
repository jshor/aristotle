import draw2d from 'draw2d'

export default class ToolboxButton extends draw2d.shape.basic.Rectangle {
  constructor (parent) {
    super({
      width: 16,
      height: 16,
      visible: false,
      opacity: 0
    })

    this.addCssClass('clickable')
    this.addIcon()
    this.addToParent(parent)
    this.toggleToolboxVisibility()
  }

  addIcon = () => {
    const locator = new draw2d.layout.locator.XYAbsPortLocator(0, 0)
    this.icon = new draw2d.shape.icon.Gear2({
      width: this.width,
      height: this.height,
      color: '#ffffff'
    })

    this.icon.addCssClass('clickable')
    this.icon.on('click', this.fireToolboxEvent) // TODO: add 'removed' event
    this.add(this.icon, locator)
  }

  addEventListeners = () => {
    this.canvas.on('unselect', this.toggleToolboxVisibility)
    this.canvas.on('select', this.toggleToolboxVisibility)
    this.canvas.on('zoomed', this.scaleToZoomFactor)
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
    const isSelected = this.parent.isSelected()

    this.setVisible(isSelected)
    this.icon.setVisible(isSelected)
  }

  scaleToZoomFactor = () => {
    const zoomFactor = 1 / this.canvas.zoomFactor

    this.setWidth(16 / zoomFactor)
    this.setHeight(16 / zoomFactor)
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
    const x = this.parent.x + this.x
    const y = this.parent.y - 5
    const position = this.canvas.fromCanvasToDocumentCoordinate(x, y)


    this.canvas.fireEvent('toolbox.open', {
      elementId: this.parent.id,
      settings: this.parent.settings,
      position
    })
  }
}

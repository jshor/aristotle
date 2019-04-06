
import draw2d from 'draw2d'
import { LogicValue } from '@aristotle/logic-circuit'

export default class Element extends draw2d.shape.basic.Image {
  constructor (id, name) {
    super({ resizeable: false })

    this.setId(id)
    this.name = name
    this.on('added', this.addEventListeners) // TODO: add removed event
    this.hasToolbox = false
  }

  setValue = (value) => {
    this.node.setValue(value)
  }

  render = (renderPorts = false) => {
    const { path, width, height, ports } = this.getSvg('#000')

    this.setPath(path)
    this.setWidth(width)
    this.setHeight(height)
    this.setToolboxButton()

    if (renderPorts) {
      this.setPorts(ports)
    }
  }

  getWireColor = (value) => {
    switch (value) {
      case LogicValue.TRUE:
        return '#0000ff'
      case LogicValue.FALSE:
        return '#ff0000'
      default:
        return '#808080'
    }
  }

  setOutputConnectionColor = (color) => {
    super
      .getConnections()
      .data
      .filter((connection) => connection.getSource().parent === this)
      .forEach((connection) => connection.setColor(color))
  }

  isSelected = () => {
    return this.canvas.selection.all.data.includes(this)
  }

  updateSelectionColor = () => {
    if (this.canvas) {
      const color = this.isSelected() ? '#ff0000' : '#000'

      this.setPath(this.getSvg(color).path)
    }
  }

  setPorts = (ports) => {
    ports.forEach(({ x, y, type }) => {
      this.createPort(type, new draw2d.layout.locator.XYAbsPortLocator(x, y))
    })
  }

  toggleToolboxVisibility = () => {
    this.toolboxButton.setVisible(this.isSelected() && this.hasToolbox)
  }

  setToolboxButton = () => {
    const locator = new draw2d.layout.locator.XYAbsPortLocator(this.width + 10, 0)
    const settings = { width: 16, height: 16, visible: false }
    
    this.toolboxButton = new draw2d.shape.icon.Wrench(settings)
    this.toolboxButton.on('click', this.fireToolboxEvent)
    this.add(this.toolboxButton, locator)
  }

  fireToolboxEvent = (button) => {
    const x = button.x + this.x
    const y = button.y + this.y
    const position = this.canvas.fromCanvasToDocumentCoordinate(x, y)

    this.canvas.fireEvent('toolbox', {
      settings: this.settings,
      position
    })
  }

  onSelectChanged = () => {
    this.updateSelectionColor()
    this.toggleToolboxVisibility()
  }

  addEventListeners = () => {
    this.canvas.on('deselect', this.onSelectChanged)
    this.canvas.on('select', this.onSelectChanged)
    this.canvas.on('reset', this.updateSelectionColor)
  }
}

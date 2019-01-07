
import draw2d from 'draw2d'
import { LogicValue } from '@aristotle/logic-circuit'

export default class Element extends draw2d.shape.basic.Image {
  constructor (id, name) {
    super({ resizeable: false })

    this.setId(id)
    this.name = name
    this.on('added', this.addEventListeners) // TODO: add removed event
  }

  setValue = (value) => {
    this.node.setValue(value)
  }

  render = (renderPorts = false) => {
    const { path, width, height, ports } = this.getSvg('#000')

    this.setPath(path)
    this.setWidth(width)
    this.setHeight(height)

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

  updateSelectionColor = () => {
    if (this.canvas) {
      const isSelected = !!~this.canvas.selection.all.data.indexOf(this)
      const color = isSelected ? '#ff0000' : '#000'

      this.setPath(this.getSvg(color).path)
    }
  }

  setPorts = (ports) => {
    ports.forEach(({ x, y, type }) => {
      this.createPort(type, new draw2d.layout.locator.XYAbsPortLocator(x, y))
    })
  }

  addEventListeners = () => {
    this.canvas.on('deselect', this.updateSelectionColor)
    this.canvas.on('select', this.updateSelectionColor)
    this.canvas.on('reset', this.updateSelectionColor)
  }
}

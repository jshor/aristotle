
import draw2d from 'draw2d'
import { LogicValue } from '@aristotle/logic-circuit'
import getPortIndex from '@/utils/getPortIndex'
import SerializationService from '../services/SerializationService'
import CommandSetInputCount from './commands/CommandSetInputCount'

export default class Element extends draw2d.shape.basic.Image {
  constructor (id) {
    super({ resizeable: false })

    if (id) this.setId(id)
    this.on('added', this.addEventListeners) // TODO: add 'removed' event
  }

  settings = {}

  getSetting = (key) => {
    return this.settings[key].value
  }

  setValue = (value) => {
    this.node.setValue(value)
  }

  getCircuitNode = () => {
    return this.node
  }

  render = (renderPorts = true) => {
    const { path, width, height, ports = [] } = this.getSvg('#000')

    if (renderPorts) {
      this.addPorts(ports)
    }
    this.setPath(path)
    this.setWidth(width)
    this.setHeight(height)
    this.repaint()
    this.createToolboxButton()
    this.updateSelectionColor()
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
    if (!this.canvas) return false
    const { selection } = this.canvas

    if (selection) {
      return selection.all.data.includes(this)
    }
    return false
  }

  updateSelectionColor = () => {
    if (this.canvas) {
      const color = this.isSelected() ? '#ff0000' : '#000'

      this.setPath(this.getSvg(color).path)
    }
  }

  updateSettings = (settings) => {
    this.canvas.commandStack.execute(new CommandSetInputCount(this, settings.inputs))
    // const cmd = new CommandUpdateSettings(this, settings)

    // this.canvas.commandStack.execute(cmd)
    this.fireToolboxEvent(this.toolboxButton) // keep toolbox open
  }

  addPorts = (ports) => {
    ports.forEach(({ x, y, type, id }) => {
      const port = this.createPort(type, new draw2d.layout.locator.XYAbsPortLocator(x, y))
      port.setId(id)
    })
  }

  hasSettings = () => {
    return Object.keys(this.settings).length
  }

  toggleToolboxVisibility = () => {
    if (this.toolboxButton) {
      this.toolboxButton.setVisible(this.isSelected())
    }
  }

  createToolboxButton = () => {
    if (this.toolboxButton || !this.hasSettings()) return

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

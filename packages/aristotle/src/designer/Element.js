
import draw2d from 'draw2d'
import { LogicValue } from '@aristotle/logic-circuit'
import getPortIndex from '@/utils/getPortIndex'
import SerializationService from '../services/SerializationService';

class CommandUpdateSettings extends draw2d.command.Command {
  constructor (element, settings) {
    super()

    this.element = element
    this.oldSettings = this.getSettings()
    this.newSettings = settings
  }

  canExecute = () => {
    return true
  }

  execute = () => {
    this.redo()
  }

  undo = () => {
    this.setSettings(this.oldSettings)
  }

  redo = () => {
    this.setSettings(this.newSettings)
  }

  getSettings = () => {
    const settings = {}

    for (let key in this.element.settings) {
      settings[key] = this.element.settings[key].value
    }

    return settings
  }

  setSettings = (settings) => {
    for (let key in settings) {
      this.element.settings[key].value = settings[key]
    }
    this.element.render()
  }
}

export default class Element extends draw2d.shape.basic.Image {
  constructor (id) {
    super({ resizeable: false })

    this.setId(id)
    this.on('added', this.addEventListeners) // TODO: add 'removed' event
  }

  getSetting = (key) => {
    return this.settings[key].value
  }

  setValue = (value) => {
    this.node.setValue(value)
  }

  render = (renderPorts = true) => {
    const { path, width, height, ports = [] } = this.getSvg('#000')

    if (renderPorts) {
      this.setPorts(ports)
    }
    this.setPath(path)
    this.setWidth(width)
    this.setHeight(height)
    this.repaint()
    this.createToolboxButton()
    this.updateSelectionColor()
  }

  setPorts = (ports) => { // this should be an override method ONLY in LogicGate
    const inputs = []
    const outputs = []

    const connections = super
      .getConnections()
      .data
      .filter((connection) => {
        const a = connection.getSource().parent
        const b = connection.getTarget().parent

        if (a === this) {
          outputs.push({
            node: b,
            index: getPortIndex(connection.getTarget(), 'input')
          })
        } else if (b === this) {
          inputs.push({
            node: a,
            index: getPortIndex(connection.getSource(), 'output')
          })
        }
        
        return a === this || b === this
      })

    connections.forEach((c) => this.canvas.remove(c))
      
    this.resetPorts()
    this.addPorts(ports)

    inputs.forEach(({ node }, index) => this.canvas.addConnection(node, this, index))
    outputs.forEach(({ node, index }) => this.canvas.addConnection(this, node, index))

    // re-connect the cached connections
    // setTimeout(() => {
    //   outputs.forEach(({ node, index }) => this.canvas.addConnection(this, node, index))
    // }, 2000)
    // inputs.forEach((input, index) => this.canvas.addConnection(input, this, 0))
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
    const cmd = new CommandUpdateSettings(this, settings)

    this.canvas.commandStack.execute(cmd)
    this.fireToolboxEvent(this.toolboxButton) // keep toolbox open
  }

  addPorts = (ports) => {
    ports.forEach(({ x, y, type }) => {
      this.createPort(type, new draw2d.layout.locator.XYAbsPortLocator(x, y))
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


import draw2d from 'draw2d'
import { LogicValue } from '@aristotle/logic-circuit'
import CommandSetProperty from './commands/CommandSetProperty'
import uuid from './utils/uuid'
import getPortLocator from './utils/getPortLocator'
import inputPortPolicy from './policies/inputPortPolicy'
import ToolboxButton from './ToolboxButton'

export default class Element extends draw2d.shape.basic.Image {
  constructor (id, { settings }) {
    super({ resizeable: false })

    if (id) this.setId(id) // TODO: is checking for id necessary?
    this.applySettings(settings)
  }

  onContextMenu = (...vars) => {
    if (!this.canvas.getSelection().getSize() || !this.isSelected()) {
      this.canvas.setCurrentSelection(null)
      this.canvas.setCurrentSelection(this)
    }
  }

  /**
   * Returns the value of the given setting key.
   * 
   * @param {String} key
   * @returns {String} setting value
   */
  getSetting = (key) => {
    return this.settings[key].value
  }

  /**
   * Returns the default circuit node.
   * 
   * @returns {CircuitNode}
   */
  getCircuitNode = () => {
    return this.node
  }

  /**
   * Renders the element SVG.
   */
  render = () => {
    const { path, width, height, ports } = this.getSvg()

    this.setPorts(ports)
    this.setPath(path)
    this.setWidth(width)
    this.setHeight(height)
    this.repaint()
    this.createToolboxButton()
  }

  /**
   * Returns the wire color based on the given logic value.
   * 
   * @param {LogicValue} value
   * @returns {String} hexadecimal color value
   */
  getWireColor = (value) => {
    switch (value) {
      case LogicValue.TRUE:
        return '#56AE7C'
      case LogicValue.FALSE:
        return '#868686'
      default:
        return '#8b0000'
    }
  }

  /**
   * Updates the color(s) of the outgoing wire(s).
   * 
   * @param {String} color - hexadecimal color value
   */
  setOutputConnectionColor = (value) => {
    const color = this.getWireColor(value)

    this
      .getConnections()
      .data
      .filter((connection) => connection.getSource().parent === this)
      .forEach((connection) => connection.setColor(color))
  }

  updateVisualValue = (value) => {
    this.setOutputConnectionColor(value)
    this.render()
  }

  applySettings = (settings) => {
    for (let propertyName in settings) {
      this.settings[propertyName].value = settings[propertyName]
    }
  }

  getSettings = () => {
    const settings = {}

    // for (let propertyName in this.settings) {
    //   settings[propertyName] = this.settings[propertyName].value
    // }

    return settings
  }

  updateSettings = (settings) => {
    for (let propertyName in settings) {
      const command = new CommandSetProperty(this)

      command.propertyName = propertyName
      command.newValue = settings[propertyName]
      command.callback = this.settings[propertyName].onUpdate

      this.canvas.commandStack.execute(command)
    }
    this.persistToolbox()
  }

  /**
   * Assigns the ports according to the given definition.
   * 
   * @param {Object[]} <{ x: Number, y: Number, type: String, id: String }>
   */
  setPorts = (ports) => {
    ports.forEach((params) => {
      const port = this.createPort(params.type, getPortLocator(params))
      /*
      if (params.type === "input") {
        port.installEditPolicy(inputPortPolicy)
      }// else {
      //   port.installEditPolicy()
      // }
      */
      port.setId(params.id)
    })
  }

  /**
   * Defines the toolbox button if one is not already present and settings are defined.
   */
  createToolboxButton = () => {
    if (!this.toolboxButton && this.settings) {
      this.toolboxButton = new ToolboxButton(this)
    }
  }

  /**
   * Keeps the toolbox open.
   */
  persistToolbox = () => {
    if (this.toolboxButton) {
      this.toolboxButton.fireToolboxEvent() 
    }
  }

  serialize = () => {
    return {
      id: this.id,
      x: this.x,
      y: this.y,
      type: this.constructor.name,
      name: uuid(),
      settings: this.getSettings()
    }
  }
}


import draw2d from 'draw2d'
import { LogicValue } from '@aristotle/logic-circuit'
import CommandSetInputCount from './commands/CommandSetInputCount'
import uuid from './utils/uuid'
import getPortLocator from './utils/getPortLocator'

export default class Element extends draw2d.shape.basic.Image {
  constructor (id) {
    super({ resizeable: false })

    if (id) this.setId(id) // TODO: is checking for id necessary?
    this.on('added', this.addEventListeners) // TODO: add 'removed' event
  }

  settings = {}

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
   * Sets the circuit value of the current node.
   * 
   * @param {LogicValue} value
   */
  setValue = (value) => {
    this.node.setValue(value)
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
    const { path, width, height, ports } = this.getSvg('#000')

    this.setPorts(ports)
    this.setPath(path)
    this.setWidth(width)
    this.setHeight(height)
    this.repaint()
    this.createToolboxButton()
    this.updateSelectionColor()
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
  setOutputConnectionColor = (color) => {
    this
      .getConnections()
      .data
      .filter((connection) => connection.getSource().parent === this)
      .forEach((connection) => connection.setColor(color))
  }

  /**
   * Returns true if the element is selected.
   * 
   * @returns {Boolean}
   */
  isSelected = () => {
    if (this.canvas) {
      const { selection } = this.canvas

      if (selection) {
        return selection.all.data.includes(this)
      }
    }
    return false
  }

  /**
   * Updates the color of the SVG according to the element's selection state.
   */
  updateSelectionColor = () => { // TODO: MAJOR: DO NOT RE-RENDER IF NOT NECESSARY
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

  /**
   * Assigns the ports according to the given definition.
   * 
   * @param {Object[]} <{ x: Number, y: Number, type: String, id: String }>
   */
  setPorts = (ports) => {
    ports.forEach((params) => {
      const port = this.createPort(params.type, getPortLocator(params))
      port.setId(params.id)
    })
  }

  /**
   * Returns the value of whether settings are defined.
   * 
   * @return {Boolean}
   */
  hasSettings = () => {
    return Object.keys(this.settings).length
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

  /**
   * Sets the visibility of the toolbox button if it exists.
   */
  toggleToolboxVisibility = () => {
    if (this.toolboxButton) {
      this.toolboxButton.setVisible(this.isSelected())
    }
  }

  /**
   * Fires a `toolbox` update event with the element setting(s) to present a toolbox to the user.
   * The payload will contain cartesian screen coordinates to indicate where to place the toolbox.
   * 
   * @emits `toolbox`
   * @param {draw2d.shape} button - toolbox button that was clicked
   */
  fireToolboxEvent = (button) => {
    const x = button.x + this.x
    const y = button.y + this.y
    const position = this.canvas.fromCanvasToDocumentCoordinate(x, y)

    this.canvas.fireEvent('toolbox', {
      settings: this.settings,
      position
    })
  }

  /**
   * Defines the toolbox button if one is not already present and settings are defined.
   */
  createToolboxButton = () => {
    if (this.toolboxButton || !this.hasSettings()) {
      return
    }
    const locator = new draw2d.layout.locator.XYAbsPortLocator(this.width + 10, 0)
    const settings = { width: 16, height: 16, visible: false, cursor: 'pointer' }

    this.toolboxButton = new draw2d.shape.icon.Wrench2(settings)
    this.toolboxButton.on('click', this.fireToolboxEvent)
    this.toolboxButton.setColor('#ffffff')
    this.add(this.toolboxButton, locator)
  }

  serialize = () => {
    return {
      id: this.id,
      x: this.x,
      y: this.y,
      type: this.constructor.name,
      name: uuid()
    }
  }
}

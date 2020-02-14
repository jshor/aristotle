import draw2d from 'draw2d'
import { LogicValue } from '@aristotle/logic-circuit'
import CommandSetProperty from '../commands/CommandSetProperty'
import uuid from '../utils/uuid'
import getPortLocator from '../utils/getPortLocator'
import ToolboxButton from '../interactivity/ToolboxButton'
import SVGBase from 'svg/lib/SVGBase'
import addTouchEvents from '../utils/addTouchEvents'
import { Point, ElementPropertyValues } from '../types'
import IElementProperties from '../interfaces/IElementProperties'

export default class Element extends draw2d.shape.basic.Image {
  node = null

  toolboxButton: ToolboxButton

  canvas: draw2d.Canvas

  svgRenderer: SVGBase

  public properties: IElementProperties = {}

  id: string

  constructor (id: string, properties: ElementPropertyValues) {
    super({ resizeable: false })

    super.setId(id)
    this.applyProperties(properties)
  }

  /**
   * Selects the element if no other elements are is selected in the canvas.
   *
   * @overrides {draw2d.Figure.onContextMenu}
   */
  onContextMenu = () => {
    if (!this.canvas.getSelection().getSize() || !super.isSelected()) {
      this.canvas.setCurrentSelection(null)
      this.canvas.setCurrentSelection(this)
    }
  }

  /**
   * Returns the default circuit node.
   *
   * @param {Connection} [connection]
   * @returns {CircuitNode}
   */
  getCircuitNode = (connection?) => {
    return this.node
  }

  /**
   * Renders the element SVG.
   */
  render = () => {
    const { path, width, height, ports } = this.getSvg() as any // TODO

    this.setPorts(ports)
    super.setPath(path)
    super.setWidth(width)
    super.setHeight(height)
    super.repaint()
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
   * @param {LogicValue} value - hexadecimal color value
   */
  setOutputConnectionColor = (value: LogicValue, portIndex?: number) => {
    const color = this.getWireColor(value)

    super
      .getConnections()
      .data
      .filter((connection) => connection.getSource().parent === this)
      .forEach((connection) => connection.setColor(color))
  }

  updateVisualValue = (value) => {
    this.setOutputConnectionColor(value)
    this.render()
  }

  /**
   * Applies the given map of property values to their respective properties.
   *
   * @param {ElementPropertyValues} properties - key-value pair of property names to values
   */
  public applyProperties = (properties: ElementPropertyValues = {}): void => {
    for (let propertyName in properties) {
      if (this.properties.hasOwnProperty(propertyName)) {
        this.properties[propertyName].value = properties[propertyName]
      }
    }
  }

  /**
   * Returns the value of the given property. Returns null if not defined.
   *
   * @param {string} propertyName
   * @returns {string|number} property value
   */
  public getPropertyValue = (propertyName: string): string | number => {
    if (this.properties.hasOwnProperty(propertyName)) {
      return this.properties[propertyName].value
    }
    return null
  }

  /**
   * Returns a key-value pair of element property names to their respective values.
   *
   * @returns {ElementPropertyValues}
   */
  public serializeProperties = (): ElementPropertyValues => {
    return Object
      .keys(this.properties)
      .reduce((properties, propertyName): ElementPropertyValues => ({
        ...properties,
        [propertyName]: this.properties[propertyName].value
      }), {})
  }

  /**
   * Updates property values using the given map of property values.
   *
   * @emits `properties:open` (via @link`persistToolbox()`)
   * @param {ElementPropertyValues} properties
   */
  public updateProperties = (properties: ElementPropertyValues) => {
    for (let propertyName in properties) {
      const command: any = new CommandSetProperty(this)

      command.propertyName = propertyName
      command.newValue = properties[propertyName]
      command.callback = this.properties[propertyName].onUpdate

      this.canvas.commandStack.execute(command)
    }
    this.persistToolbox()
  }

  public hasProperties = (): boolean => {
    return Object
      .keys(this.properties)
      .length > 0
  }

  /**
   * Assigns the ports according to the given definition.
   *
   * @param {Object[]} <{ x: Number, y: Number, type: String, id: String }>
   */
  setPorts = (ports) => {
    ports.forEach((params) => {
      const port = super.createPort(params.type, getPortLocator(params))
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
   * Defines the toolbox button if one is not already present and properties are defined.
   */
  createToolboxButton = () => {
    if (!this.toolboxButton && this.hasProperties()) {
      const locator = new draw2d.layout.locator.XYAbsPortLocator(0, 0)
      const figure: draw2d.Figure = this.attachClickableArea(20, 20, {
        x: super.getWidth() + 10,
        y: 0
      })
      this.toolboxButton = new ToolboxButton(figure, 16, 16)

      figure.add(this.toolboxButton, locator)
    }
  }

  attachClickableArea = (width: number, height: number, point: Point) => {
    const figure: draw2d.Figure = this as draw2d.Figure
    const locator = new draw2d.layout.locator.XYAbsPortLocator(point.x, point.y)
    const clickableArea = new draw2d.shape.basic.Rectangle({
      opacity: 0,
      width,
      height,
      cssClass: 'clickable'
    })

    figure.on('added', addTouchEvents.bind(this, clickableArea))
    figure.add(clickableArea, locator)

    return clickableArea
  }

  /**
   * Keeps the toolbox open.
   */
  persistToolbox = () => {
    if (this.toolboxButton) {
      this.toolboxButton.fireToolboxEvent()
    }
  }

  public serialize = () => {
    return {
      id: super.getId(),
      x: super.getX(),
      y: super.getY(),
      type: this.constructor.name,
      name: uuid(),
      properties: this.serializeProperties()
    }
  }

  // TODO
  getSvg = () => {}

  on = super.on

  getId = super.getId
}

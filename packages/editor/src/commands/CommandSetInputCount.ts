import draw2d from 'draw2d'
import Element from '../core/Element'

const locator = new draw2d.layout.locator.XYAbsPortLocator(0, 0) // TODO: make constant

/**
 * Updates the number of input ports for the given element.
 *
 * @inheritdoc draw2d.command.CommandCollection
 */
class CommandSetInputCount extends draw2d.command.CommandCollection {
  /**
   * Port count before command was executed.
   *
   * @type {number}
   */
  private oldPortCount: number

  /**
   * Port count after command was executed.
   *
   * @type {number}
   */
  private newPortCount: number

  /**
   * Draw2D figure instance.
   *
   * @type {draw2d.Figure}
   */
  private figure: draw2d.Figure

  /**
   * Draw2D canvas instance.
   *
   * @type {draw2d.Figure}
   */
  private canvas: draw2d.Canvas

  /**
   * Original list of incoming and outgoing connections of the element.
   *
   * @type {draw2d.util.ArrayList}
   */
  private connections: draw2d.util.ArrayList

  /**
   * Original list of incoming and outgoing ports of the element.
   *
   * @type {draw2d.util.ArrayList}
   */
  private ports: draw2d.util.ArrayList

  /**
   * Constructor.
   *
   * @param {Element} element
   * @param {number} newPortCount - new number of input ports
   */
  constructor (element: Element, newPortCount: number) {
    super()

    this.figure = element as draw2d.Figure
    this.oldPortCount = this.figure.properties.inputs.value
    this.newPortCount = newPortCount
    this.canvas = this.figure.getCanvas()
    this.connections = this.figure.getConnections()
    this.ports = this.figure.getPorts()
  }

  /**
   * Executability of the command. Always returns true.
   *
   * @returns {boolean}
   */
  canExecute = (): boolean => {
    return true
  }

  /**
   * Executes the command.
   */
  execute = (): void => {
    this.redo()
  }

  /**
   * Reverses the changes created by the command.
   */
  undo = (): void => {
    this.disconnect()
    this.reset(this.oldPortCount)
    this.addOldPorts()
    this.reconnect()
  }

  /**
   * Invokes the changes created by the command.
   */
  redo = (): void => {
    this.disconnect()
    this.reset(this.newPortCount)
    this.addNewPorts()
    this.reconnect()
  }

  /**
   * Resets the figure to have its original port count.
   */
  reset = (inputCount: number): void => {
    this.figure.properties.inputs.value = parseInt(inputCount.toString(), 10)
    this.figure.resetPorts()
    this.figure.svgRenderer.setInputCount(inputCount)
    this.repaint()
  }

  /**
   * Repaints the figure. Similar to Element.repaint(), except it does not redraw ports.
   */
  repaint = (): void => {
    const { path, width, height } = this.figure.getSvg()

    this.figure.setPath(path)
    this.figure.setWidth(width)
    this.figure.setHeight(height)
    this.figure.repaint()
    this.figure.createToolboxButton()
  }

  /**
   * Reconfigures the original ports before the command was executed.
   */
  addOldPorts = (): void => {
    for (let i: number = 0; i < this.ports.getSize(); ++i) {
      const port = this.ports.get(i)

      this.figure.addPort(port, port.getLocator())
    }
  }

  /**
   * Reconfigures the figure to have the new number of ports.
   */
  addNewPorts = (): void => {
    const { ports } = this.figure.getSvg()

    this.figure.setPorts(ports)
  }

  /**
   * Disconnects all existing connections from the element.
   */
  disconnect = (): void => {
    for (let i: number = 0; i < this.figure.getConnections().getSize(); ++i) {
      this.canvas.remove(this.figure.getConnections().get(i))
    }
  }

  /**
   * Reconnects the available input and output connections of the figure.
   */
  reconnect = (): void => {
    this.reconnectInputs()
    this.reconnectOutputs()
    this.figure.repaint()
  }

  /**
   * Reconnects the available input connections of the figure.
   */
  reconnectInputs = (): void => {
    this
      .connections
      .asArray()
      .filter((connection: draw2d.Connection, index: number): boolean => {
        const isInput = connection.getTarget().parent === this.figure
        const hasPortAvailable = this.figure.properties.inputs.value > index

        return isInput && hasPortAvailable
      })
      .forEach((connection: draw2d.Connection, index: number): void => {
        const port = this.figure.getInputPort(index)

        connection.setTarget(port)
        this.canvas.add(connection, locator)
        connection.reconnect()
      })
  }

  /**
   * Reconnects the available output connections of the figure.
   */
  reconnectOutputs = (): void => {
    this
      .connections
      .asArray()
      .filter((connection: draw2d.Connection): boolean => {
        return connection.getSource().parent === this.figure
      })
      .forEach((connection: draw2d.Connection): void => {
        const port = this.figure.getOutputPort(0)

        connection.setSource(port)
        this.canvas.add(connection, locator)
        connection.reconnect()
      })
  }
}

export default CommandSetInputCount

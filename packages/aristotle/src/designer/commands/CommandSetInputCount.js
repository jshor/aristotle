import draw2d from 'draw2d'

class CommandSetInputCount extends draw2d.command.CommandCollection {
  constructor (figure, newPortCount) {
    super()

    this.oldPortCount = figure.settings.inputs.value
    this.newPortCount = newPortCount
    this.figure = figure
    this.canvas = figure.getCanvas()
    this.connections = figure.getConnections()
    this.ports = figure.getPorts()
  }

  canExecute = () => {
    return true
  }

  execute = () => {
    this.redo()
  }

  undo = () => {
    this.disconnect()
    this.reset(this.oldPortCount)
    this.addOldPorts()
    this.reconnect()
  }

  redo = () => {
    this.disconnect()
    this.reset(this.newPortCount)
    this.addNewPorts()
    this.reconnect()
  }

  reset = (inputCount) => {
    this.figure.settings.inputs.value = parseInt(inputCount)
    this.figure.resetPorts()
    this.repaint()
  }

  repaint = () => {
    const { path, width, height } = this.figure.getSvg('#000')

    this.figure.setPath(path)
    this.figure.setWidth(width)
    this.figure.setHeight(height)
    this.figure.repaint()
    this.figure.createToolboxButton()
    this.figure.updateSelectionColor()
  }

  addOldPorts = () => {
    for (let i = 0; i < this.ports.getSize(); ++i) {
      const port = this.ports.get(i)

      this.figure.addPort(port, port.getLocator())
    }
  }

  addNewPorts = () => {
    const { ports } = this.figure.getSvg('#000')

    this.figure.addPorts(ports)
  }

  disconnect = () => {
    for (let i = 0; i < this.figure.getConnections().getSize(); ++i) {
      this.canvas.remove(this.figure.getConnections().get(i))
    }
  }

  reconnect = (count) => {
    this.reconnectInputs()
    this.reconnectOutputs()
    this.figure.repaint()
  }

  reconnectInputs = () => {
    this
      .connections
      .data
      .filter((connection, index) => {
        const isInput = connection.getTarget().parent === this.figure
        const hasPortAvailable = this.figure.settings.inputs.value > index

        return isInput && hasPortAvailable
      })
      .forEach((connection, index) => {
        const port = this.figure.getInputPort(index)

        connection.setTarget(port)
        this.canvas.add(connection)
        connection.reconnect()
      })
  }

  reconnectOutputs = () => {
    this
      .connections
      .data
      .filter((connection) => connection.getSource().parent === this.figure)
      .forEach((connection, index) => {
        const port = this.figure.getOutputPort(0)

        connection.setSource(port)
        this.canvas.add(connection)
        connection.reconnect()
      })
  }
}

export default CommandSetInputCount

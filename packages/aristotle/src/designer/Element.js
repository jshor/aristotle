
import draw2d from 'draw2d'
import { LogicValue } from '@aristotle/logic-circuit'

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
    this.setToolboxButton()
    this.updateSelectionColor()
  }

  setPorts = (ports) => {
    const outputs = []
    const inputs = []

    super
      .getConnections()
      .data
      .filter((connection) => connection.getSource().parent === this)
      .forEach((connection) => {
        const a = connection.getSource().parent
        const b = connection.getTarget().parent

        // cache the connections, since we're resetting the ports
        if (a === this) {
          outputs.push(b)
        } else {
          inputs.push(b)
        }
      })
      
    this.resetPorts()
    this.addPorts(ports)

    // re-connect the cached connections
    outputs.forEach((output, index) => this.canvas.addConnection(this, output, index))
    inputs.forEach((input, index) => this.canvas.addConnection(input, this, index))
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

  updateSettings = (settings) => {
    for (let key in settings) {
      this.settings[key].value = settings[key]
    }
    
    this.render()
  }

  addPorts = (ports) => {
    ports.forEach(({ x, y, type }) => {
      this.createPort(type, new draw2d.layout.locator.XYAbsPortLocator(x, y))
    })
  }

  toggleToolboxVisibility = () => {
    this.toolboxButton.setVisible(this.isSelected() && Object.keys(this.settings).length)
  }

  setToolboxButton = () => {
    const children = this.children.data
    const locator = new draw2d.layout.locator.XYAbsPortLocator(this.width + 10, 0)
    const settings = { width: 16, height: 16, visible: false }

    if (children) {
      children.forEach((child) => this.remove(child))
      // console.log('child: ', child.length)
      // this.toolboxButton = child
    }
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

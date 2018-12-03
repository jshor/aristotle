
import draw2d from 'draw2d'
import { CircuitNode, LogicValue } from '@aristotle/logic-circuit'

export default class Element extends draw2d.shape.basic.Image {
  protected name: string
  protected node: CircuitNode
  protected canvas: draw2d.Canvas

  constructor (name: string) {
    super({ resizeable: false })

    this.name = name
    super.on('added', this.addEventListeners) // TODO: add removed event
  }

  private addEventListeners = () => {
    this.canvas.on('select', this.updateSelectionColor)
    this.canvas.on('reset', this.updateSelectionColor)
    this.canvas.html[0].addEventListener('click', this.updateSelectionColor)
  }

  private updateSelectionColor = () => {
    if (this.canvas) {
      const isSelected = !!~this.canvas.selection.all.data.indexOf(this)
      const color = isSelected ? '#ff0000' : '#000'

      super.setPath(this.getSvg(color).path)
    }
  }

  private setPorts = (ports: Array<{ x: number, y: number, type: string }>) => {
    ports.forEach(({ x, y, type }) => {
      super.createPort(type, new draw2d.layout.locator.XYAbsPortLocator(x, y))
    })
  }

  protected render = (renderPorts: boolean = false) => {
    const { path, width, height, ports } = this.getSvg('#000')

    super.setPath(path)
    super.setWidth(width)
    super.setHeight(height)

    if (renderPorts) {
      this.setPorts(ports)
    }
  }

  protected getWireColor = (value: string) => {
    switch (value) {
      case LogicValue.TRUE:
        return '#0000ff'
      case LogicValue.FALSE:
        return '#ff0000'
      default:
        return '#808080'
    }
  }

  protected setOutputConnectionColor = (color: string) => {
    super
      .getConnections()
      .data
      .filter((connection: draw2d.Connection) => connection.getSource().parent === this)
      .forEach((connection: draw2d.Connection) => connection.setColor(color))
  }

  protected getSvg = (color: string): any => ({})

  protected on = (eventName: string, fn: Function) => super.on(eventName, fn)

  public setValue = (value: any) => {
    this.node.setValue(value)
  }
}

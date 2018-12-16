
import draw2d from 'draw2d'
import { CircuitNode, LogicValue } from '@aristotle/logic-circuit'

export default class Element extends draw2d.shape.basic.Image {
  public node: CircuitNode
  public name: string
  protected canvas: draw2d.Canvas

  constructor (name: string) {
    super({ resizeable: false })

    this.name = name
    super.on('added', this.addEventListeners) // TODO: add removed event
  }

  public getInputPort = (index: number): draw2d.Port => super.getInputPort(index)

  public getOutputPort = (index: number): draw2d.Port => super.getOutputPort(index)

  public setValue = (value: number): void => {
    this.node.setValue(value)
  }

  public render = (renderPorts: boolean = false): void => {
    const { path, width, height, ports } = this.getSvg('#000')

    super.setPath(path)
    super.setWidth(width)
    super.setHeight(height)

    if (renderPorts) {
      this.setPorts(ports)
    }
  }

  public getWireColor = (value: number): string => {
    switch (value) {
      case LogicValue.TRUE:
        return '#0000ff'
      case LogicValue.FALSE:
        return '#ff0000'
      default:
        return '#808080'
    }
  }

  public setOutputConnectionColor = (color: string): void => {
    super
      .getConnections()
      .data
      .filter((connection: draw2d.Connection) => connection.getSource().parent === this)
      .forEach((connection: draw2d.Connection) => connection.setColor(color))
  }

  public getSvg = (color: string): any => ({})

  public on = (eventName: string, fn: () => void): void => super.on(eventName, fn)

  public updateSelectionColor = (): void => {
    if (this.canvas) {
      const isSelected = !!~this.canvas.selection.all.data.indexOf(this)
      const color = isSelected ? '#ff0000' : '#000'

      super.setPath(this.getSvg(color).path)
    }
  }

  public setPorts = (ports: Array<{ x: number, y: number, type: string }>): void => {
    ports.forEach(({ x, y, type }) => {
      super.createPort(type, new draw2d.layout.locator.XYAbsPortLocator(x, y))
    })
  }

  private addEventListeners = (): void => {
    this.canvas.on('select', this.updateSelectionColor)
    this.canvas.on('reset', this.updateSelectionColor)
    this.canvas.html[0].addEventListener('click', this.updateSelectionColor)
  }
}

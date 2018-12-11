import draw2d from 'draw2d'
import Canvas from './Canvas'
import { Circuit, CircuitNode } from '@aristotle/logic-circuit'
import Connection from './Connection'

const getPortIndex = (port: draw2d.Port, type: string): number => {
  const ports = port.parent[`${type}Ports`].data

  for (let i = 0; i < ports.length; i++) {
    if (ports[i] === port) {
      return i
    }
  }
  return -1
}

export default class Editor extends Canvas {
  public circuit: Circuit = new Circuit()
  public debug: boolean = false

  constructor (elementId: string) {
    super(elementId)

    this.circuit = new Circuit()
    this.installEditPolicies()
  }

  public addNode (node: any, x: number, y: number): void {
    super.add(node, x, y)
    this.circuit.addNode(node.node)
    this.step(true)
  }

  public newConnection = (source: any, target: any, index: number): void => {
    const connection = new Connection(this.circuit)

    connection.setSource(source.getOutputPort(0))
    connection.setTarget(target.getInputPort(index))

    super.add(connection)
    this.step(true)
  }

  public step = (force: boolean = false): void => {
    if (!this.circuit.isComplete() || force) {
      this.circuit.next()
      this.circuit.debug()

      if (!this.debug) {
        setTimeout(() => this.step())
      }
    }
  }

  public setMouseMode (mode: string): void {
    switch (mode) {
      case 'PANNING':
        super.installEditPolicy(new draw2d.policy.canvas.PanningSelectionPolicy())
        break
      case 'SELECTION':
      default:
        super.installEditPolicy(new draw2d.policy.canvas.BoundingboxSelectionPolicy())
        break
    }
  }

  private installEditPolicies = (): void => {
    // this.installEditPolicy(new draw2d.policy.canvas.FadeoutDecorationPolicy())
    super.installEditPolicy(new draw2d.policy.canvas.ShowGridEditPolicy())
    super.installEditPolicy(new draw2d.policy.connection.DragConnectionCreatePolicy({
      createConnection: this.createConnection
    }))
  }
}

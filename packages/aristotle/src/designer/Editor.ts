import draw2d from 'draw2d'
import Canvas from './Canvas'
import Gate from './Gate'
import { Circuit, CircuitNode } from '@aristotle/logic-circuit'

const getPortIndex = (port, type): number => {
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

  public createConnection = (): draw2d.Connection => {
    const connection = new draw2d.Connection()

    connection.setOutlineColor('#000000')

    connection.setOutlineStroke(1)
    connection.setColor('#808080')
    connection.setGlow(false)
    connection.setRouter(new draw2d.layout.connection.CircuitConnectionRouter())
    connection.on('added', () => this.addConnection(connection))
    connection.on('removed', this.removeConnection)

    return connection
  }

  public addNode (node: any, x: number, y: number) {
    super.add(node, x, y)
    this.circuit.addNode(node.node)
    this.step(true)
  }

  public newConnection = (source: any, target: any, index: number) => {
    const connection = this.createConnection()

    connection.setSource(source.getOutputPort(0))
    connection.setTarget(target.getInputPort(index))

    super.add(connection)
    this.step(true)
  }

  public addConnection = (connection: draw2d.Connection) => {
    const source = connection.sourcePort.parent
    const target = connection.targetPort.parent

    this.circuit.addConnection(source.node, target.node, getPortIndex(connection.targetPort, 'input'))
    this.step(true)
  }

  public removeConnection = (connection: draw2d.Connection) => {
    const sourceNode: CircuitNode = connection.sourcePort.parent.node
    const targetNode: CircuitNode = connection.targetPort.parent.node

    this.circuit.removeConnection(sourceNode, targetNode)
    this.step(true)
  }

  public step = (force: boolean = false) => {
    if (!this.circuit.isComplete() || force) {
      this.circuit.next()
      this.circuit.debug()

      if (!this.debug) {
        setTimeout(() => this.step())
      }
    }
  }

  public setMouseMode (mode: string) {
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

  private installEditPolicies = () => {
    // this.installEditPolicy(new draw2d.policy.canvas.FadeoutDecorationPolicy())
    super.installEditPolicy(new draw2d.policy.canvas.ShowGridEditPolicy())
    super.installEditPolicy(new draw2d.policy.connection.DragConnectionCreatePolicy({
      createConnection: this.createConnection
    }))
  }
}

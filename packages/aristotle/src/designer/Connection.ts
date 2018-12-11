import draw2d from 'draw2d'
import { Circuit, CircuitNode } from '@aristotle/logic-circuit'

class Connection extends draw2d.Connection {
  public circuit: Circuit

  constructor(circuit: Circuit) {
    super({
      outlineColor: '#000000',
      outlineStroke: 1,
      color: '#808080',
      glow: false,
      router: new draw2d.layout.connection.CircuitConnectionRouter()
    })

    this.circuit = circuit
    this.on('added', () => this.onAdd)
    this.on('removed', this.onRemove)
  }

  public onAdd = (connection: draw2d.Connection): void => {
    const source = connection.sourcePort.parent
    const target = connection.targetPort.parent

    this.circuit.addConnection(source.node, target.node, getPortIndex(connection.targetPort, 'input'))
    this.step(true)
  }

  public onRemove = (connection: draw2d.Connection): void => {
    const sourceNode: CircuitNode = connection.sourcePort.parent.node
    const targetNode: CircuitNode = connection.targetPort.parent.node

    this.circuit.removeConnection(sourceNode, targetNode)
    this.step(true)
  }
}

export default Connection

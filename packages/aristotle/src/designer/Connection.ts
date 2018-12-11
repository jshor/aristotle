import draw2d from 'draw2d'
import { Circuit, CircuitNode } from '@aristotle/logic-circuit'
import getPortIndex from '../utils/getPortIndex'
import Editor from './Editor'

class Connection extends draw2d.Connection {
  public circuit: Circuit
  public sourcePort: draw2d.Port
  public targetPort: draw2d.Port
  // @ts-ignore
  public canvas: Editor

  constructor (circuit: Circuit) {
    super({
      outlineColor: '#000000',
      outlineStroke: 1,
      color: '#808080',
      glow: false,
      router: new draw2d.layout.connection.CircuitConnectionRouter()
    })

    this.circuit = circuit

    super.on('added', this.onAdd)
    super.on('removed', this.onRemove)
  }

  public onAdd = (): void => {
    const source = this.sourcePort.parent
    const target = this.targetPort.parent

    this.circuit.addConnection(source.node, target.node, getPortIndex(this.targetPort, 'input'))
    this.canvas.step(true)
  }

  public onRemove = (): void => {
    const sourceNode: CircuitNode = this.sourcePort.parent.node
    const targetNode: CircuitNode = this.targetPort.parent.node

    this.circuit.removeConnection(sourceNode, targetNode)
  }

  public setTarget = (port: draw2d.Port) => super.setTarget(port)

  public setSource = (port: draw2d.Port) => super.setSource(port)
}

export default Connection

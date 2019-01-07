import draw2d from 'draw2d'
import getPortIndex from '../utils/getPortIndex'

class Connection extends draw2d.Connection {
  constructor (circuit) {
    super({
      outlineColor: '#000000',
      outlineStroke: 1,
      color: '#808080',
      glow: false,
      router: new draw2d.layout.connection.CircuitConnectionRouter()
    })

    this.circuit = circuit

    this.on('added', this.onAdd)
    this.on('removed', this.onRemove)
  }

  onAdd = () => {
    const source = this.sourcePort.parent
    const target = this.targetPort.parent

    this.circuit.addConnection(source.node, target.node, getPortIndex(this.targetPort, 'input'))
    this.canvas.step(true)
  }

  onRemove = () => {
    const sourceNode = this.sourcePort.parent.node
    const targetNode = this.targetPort.parent.node

    this.circuit.removeConnection(sourceNode, targetNode)
  }
}

export default Connection

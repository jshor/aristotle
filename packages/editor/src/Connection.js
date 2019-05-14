import draw2d from 'draw2d'
import BezierConnectionRouter from './layout/BezierConnectionRouter'
import getPortIndex from './utils/getPortIndex'

class Connection extends draw2d.Connection {
  constructor (circuit) {
    super({
      outlineColor: '#000000',
      outlineStroke: 1,
      color: '#808080',
      glow: true,
      stroke: 1,
      router: new BezierConnectionRouter()
    })

    this.circuit = circuit
    this.on('added', this.addCircuitConnection)
    this.on('removed', this.removeCircuitConnection)
  }

  /**
   * Connects the circuit nodes of the source and target in the circuit instance.
   */
  addCircuitConnection = () => {
    const source = this.sourcePort.parent
    const target = this.targetPort.parent
    const sourceNode = source.getCircuitNode(this)
    const targetNode = target.getCircuitNode(this)
    const targetIndex = getPortIndex(this.targetPort, 'input')

    this.circuit.addConnection(sourceNode, targetNode, targetIndex)
    this.canvas.step(true)
  }

  /**
   * Removes the connection between the circuit nodes of the source and target in the circuit instance.
   */
  removeCircuitConnection = () => {
    const source = this.sourcePort.parent
    const target = this.targetPort.parent
    const sourceNode = source.getCircuitNode(this)
    const targetNode = target.getCircuitNode(this)

    this.circuit.removeConnection(sourceNode, targetNode)
  }

  serialize = () => {
    const source = this.getSource()
    const target = this.getTarget()
    const sourceIndex = getPortIndex(source, 'output')
    const targetIndex = getPortIndex(target, 'input')

    return {
      inputId: source.getParent().id,
      outputId: target.getParent().id,
      sourceIndex,
      targetIndex
    }
  }
}

export default Connection

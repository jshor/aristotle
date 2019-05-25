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
    // this.shape.forEach((element) => {
    //   if (element[0]) {
    //     // $(element[0]).off('click touchstart')
    //     // $(element[0]).on('click touchstart', () => {
    //     //   console.log('CLICKED')
    //     // })
    //     const el = $(element[0]).clone()


    //     $(element[0]).css('pointer-events', 'none')
    //     el.insertAfter($(element[0]))
    //     el.attr('stroke', 'transparent')
    //     el.attr('stroke-width', '15')
    //     el.off('click touchstart')
    //     el.on('click touchstart', (e) => {
    //       this.canvas.setCurrentSelection(this)
    //       e.stopPropagation()
    //     })

    //     this.on('change:start', () => {
    //       el.attr('d', $(element[0]).attr('d'))
    //     })

    //     this.on('change:end', () => {
    //       el.attr('d', $(element[0]).attr('d'))
    //     })
    //   }
    //   // console.log('html: ',element[0])
    // })

    // this.on('change:end', () => {
    //   console.log('ebd')
    // })


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

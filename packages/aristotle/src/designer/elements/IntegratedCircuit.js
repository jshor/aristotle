import Element from '../Element'
import { Buffer, Nor } from '@aristotle/logic-circuit'
import { renderIc } from '@aristotle/logic-gates'
import getPortIndex from '@/utils/getPortIndex'

class IntegratedCircuit extends Element {
  constructor (id, { ports, nodes, connections }) {
    super (id)
    
    this.portDefinitions = ports
    this.connections = connections
    this.nodes = nodes.map(this.getInitializedNode)
    this.inputIds = this.getNodeListByType(nodes, 'input')
    this.outputIds = this.getNodeListByType(nodes, 'output')
    
    this.on('added', this.buildCircuit)
    this.render()
  }

  getCircuitNodeId = (connection) => {
    const source = connection.getSource()
    const target = connection.getTarget()

    if (source.parent === this) {
      return this.outputIds[getPortIndex(source, 'output')]
    }
    return this.inputIds[getPortIndex(target, 'input')]
  }

  getCircuitNodeById = (nodeId) => {
    return this
      .nodes
      .filter((node) => node.name === nodeId)
      .pop()
  }
  
  getCircuitNode = (connection) => {
    const nodeId = this.getCircuitNodeId(connection)

    return this.getCircuitNodeById(nodeId)
  }

  getNodeListByType = (nodes, type) => {
    return nodes
      .filter(({ nodeType }) => nodeType === type)
      .sort((a, b) => a.portIndex - b.portIndex)
      .map(({ id }) => id)
  }

  getInitializedNode = ({ id, nodeType, portIndex }) => { // TODO: need to remap ids here too
    if (nodeType === 'input' || nodeType === 'output') {
      // replace inputs and outputs with buffers
      const node = new Buffer(id)

      if (nodeType === 'output') {
        // if the node is an output, propagate the color change
        node.on('change', this.updateWireColor.bind(this, id, portIndex))
      }

      node.forceContinue = true

      return node
    }

    return new Nor(id) // TODO
  }

  buildCircuit = () => {
    this.nodes.forEach(this.canvas.circuit.addNode.bind(this))

    this.connections.forEach(({ inputId, outputId, targetIndex }) => {
      const input = this.getCircuitNodeById(inputId)
      const output = this.getCircuitNodeById(outputId)

      this.canvas.circuit.addConnection(input, output, targetIndex)
    })
  }

  setOutputConnectionColor = (color, portIndex) => {
    super
      .getConnections()
      .data
      .filter((connection) => connection.getSource().parent === this)
      .filter((connection) => getPortIndex(connection.getSource(), 'output') === portIndex)
      .forEach((connection) => connection.setColor(color))
  }

  updateWireColor = (nodeId, portIndex, value) => {
    this.setOutputConnectionColor(this.getWireColor(value), portIndex)
  }

  getSvg = (color) => {
    return renderIc(this.portDefinitions, color, this.bgColor)
  }
}

export default IntegratedCircuit
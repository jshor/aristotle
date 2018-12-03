import CircuitNode from './CircuitNode'

class OutputNode extends CircuitNode {
  /**
   * Updates the value of the node.
   * 
   * @override CircuitNode.update
   * @param {LogicValue} value
   */
  update (value) {
    this.newValue = value
  }
}

export default OutputNode

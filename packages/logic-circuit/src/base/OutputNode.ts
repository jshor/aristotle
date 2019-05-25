import CircuitNode from './CircuitNode'

class OutputNode extends CircuitNode {
  /**
   * Updates the value of the node.
   *
   * @override CircuitNode.update
   * @param {LogicValue} value
   */
  public update = (value: number): void => {
    this.newValue = value
  }
}

export default OutputNode

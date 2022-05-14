import CircuitNode from './CircuitNode'

class OutputNode extends CircuitNode {
  /**
   * Updates the value of the node.
   *
   * @override CircuitNode.update
   * @param {LogicValue} value
   */
  public update = (value: number): void => {
    if (this.newValue !== value) {
      this.newValue = value
      this.invokeEvent('change', value)
    }
  }
}

export default OutputNode

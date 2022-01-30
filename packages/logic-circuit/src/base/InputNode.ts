import CircuitNode from './CircuitNode'

class InputNode extends CircuitNode {
  /**
   * Resets the node.
   *
   * @override CircuitNode.reset
   */
  public reset = (): void => {
    // do nothing
  }
}

export default InputNode

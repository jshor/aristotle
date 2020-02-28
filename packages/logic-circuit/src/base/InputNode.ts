import CircuitNode from './CircuitNode'
import LogicValue from '../types/LogicValue'

class InputNode extends CircuitNode {
  inputValues = [LogicValue.UNKNOWN]

  constructor (name: string) {
    super(name)
  }

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

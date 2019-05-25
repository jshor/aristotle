import CircuitNode from './CircuitNode'
import LogicValue from '../types/LogicValue'

class InputNode extends CircuitNode {
  inputValues = [LogicValue.UNKNOWN]

  constructor (name: string) {
    super(name)
  }

  /**
   * Updates the node's value to be static having the given value.
   *
   * @override CircuitNode.setValue
   * @param {LogicValue} value
   */
  public setValue = (value: number): void => {
    this.newValue = value
    this.eval = () => value
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

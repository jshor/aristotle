import CircuitNode from '../base/CircuitNode'
import LogicValue from '../types/LogicValue'

class Buffer extends CircuitNode {
  /**
   * Updates the input value at the given index with the given value.
   *
   * @override CircuitNode.update
   * @param {LogicValue} value - new value
   * @param {Number} index - source index
   */
  public update = (value: number): void => {
    this.inputValues[0] = value
    this.newValue = this.eval()
  }

  protected eval = (): number => {
    return this.inputValues[0]
  }
}

export default Buffer

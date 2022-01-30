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
    const id = Object
      .keys(this.inputValues)
      .pop()

    this.inputValues[id] = value
    this.newValue = this.eval()
  }

  protected eval = (): number => {
    return Object
      .values(this.inputValues)
      .pop()
  }
}

export default Buffer

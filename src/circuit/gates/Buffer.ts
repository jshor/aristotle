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

    if (id) {
      this.inputValues[id] = value
      this.newValue = this.eval()
    }
  }

  protected eval = (): number => {
    const values = Object.values(this.inputValues)

    // TODO: if any inputs to buffer are TRUE, then return TRUE
    // otherwise, return the first value discovered
    return values.find(v => v === 1) || values.pop() || 0
  }
}

export default Buffer

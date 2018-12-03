import CircuitNode from './CircuitNode'
import LogicValue from '../types/LogicValue'

class InputNode extends CircuitNode {
  inputValues = [LogicValue.UNKNOWN]

  /**
   * Updates the node's value to be static having the given value.
   * 
   * @override CircuitNode.setValue
   * @param {LogicValue} value
   */
  setValue (value) {
    this.newValue = value
    this.eval = () => value
  }

  /**
   * Resets the node.
   * 
   * @override CircuitNode.reset
   */
  reset () {
    // do nothing
  }
}

export default InputNode

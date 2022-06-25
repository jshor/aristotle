import CircuitNode from '../base/CircuitNode'
import LogicValue from '../types/LogicValue'

class Nand extends CircuitNode {
  public eval = (): number => {
    return Object
      .values(this.inputValues)
      .reduce((result, value) => {
        return result || value === LogicValue.FALSE
      }, false) ? LogicValue.TRUE : LogicValue.FALSE
  }
}

export default Nand

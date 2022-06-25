import CircuitNode from '../base/CircuitNode'
import LogicValue from '../types/LogicValue'

class And extends CircuitNode {
  public eval = (): number => {
    return Object
      .values(this.inputValues)
      .reduce((result, value) => {
        return result && value === LogicValue.TRUE
      }, true) ? LogicValue.TRUE : LogicValue.FALSE
  }
}

export default And

import CircuitNode from '../base/CircuitNode'
import LogicValue from '../types/LogicValue'

class Or extends CircuitNode {
  inputValues = [LogicValue.UNKNOWN, LogicValue.UNKNOWN]

  protected eval = (): number => {
    if (this.valueCount(LogicValue.TRUE)) {
      return LogicValue.TRUE
    }

    if (this.valueCount(LogicValue.UNKNOWN)) {
      return LogicValue.UNKNOWN
    }

    return LogicValue.FALSE
  }
}

export default Or

import CircuitNode from '../base/CircuitNode'
import LogicValue from '../types/LogicValue'

class Or extends CircuitNode {
  inputValues = [LogicValue.UNKNOWN, LogicValue.UNKNOWN]

  protected eval (): number {
    if (super.valueCount(LogicValue.TRUE)) {
      return LogicValue.TRUE
    }

    if (super.valueCount(LogicValue.UNKNOWN)) {
      return LogicValue.UNKNOWN
    }

    return LogicValue.FALSE
  }
}

export default Or

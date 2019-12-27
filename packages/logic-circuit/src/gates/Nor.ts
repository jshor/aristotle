import CircuitNode from '../base/CircuitNode'
import LogicValue from '../types/LogicValue'

class Nor extends CircuitNode {
  inputValues = [LogicValue.UNKNOWN, LogicValue.UNKNOWN]

  protected eval = (): number => {
    if (this.valueCount(LogicValue.TRUE)) {
      return LogicValue.FALSE
    }

    if (this.valueCount(LogicValue.UNKNOWN)) {
      return LogicValue.UNKNOWN
    }

    return LogicValue.TRUE
  }
}

export default Nor

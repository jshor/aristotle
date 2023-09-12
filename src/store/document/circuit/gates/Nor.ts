import CircuitNode from '../CircuitNode'
import LogicValue from '@/types/enums/LogicValue'

class Nor extends CircuitNode {
  public eval = (): number => {
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

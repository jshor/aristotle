import CircuitNode from '../CircuitNode'
import LogicValue from '@/types/enums/LogicValue'

class Not extends CircuitNode {
  public eval = (): number => {
    const value = Object
      .values(this.inputValues)
      .pop()

    switch (value) {
      case LogicValue.TRUE:
        return LogicValue.FALSE
      case LogicValue.FALSE:
        return LogicValue.TRUE
      default:
        return LogicValue.UNKNOWN
    }
  }
}

export default Not

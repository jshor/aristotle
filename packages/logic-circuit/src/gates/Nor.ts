import Or from './Or'
import LogicValue from '../types/LogicValue'

class Nor extends Or {
  // protected eval (): number {
  //   switch (super.eval()) {
  //     case LogicValue.TRUE:
  //       return LogicValue.FALSE
  //     case LogicValue.FALSE:
  //       return LogicValue.TRUE
  //     default:
  //       return LogicValue.UNKNOWN
  //   }
  // }
  protected eval (): number {
    if (super.valueCount(LogicValue.TRUE)) {
      return LogicValue.FALSE
    }

    if (super.valueCount(LogicValue.UNKNOWN)) {
      return LogicValue.UNKNOWN
    }

    return LogicValue.TRUE
  }
}

export default Nor

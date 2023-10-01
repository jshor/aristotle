import LogicValue from '../enums/LogicValue'
import Property from './Property'

type ItemProperties = {
  /** The number of available input connections to a circuit component. */
  inputCount?: Property<number>
  /** The speed of the clock. */
  interval?: Property<number>
  /** The user-friendly name of this item. */
  name?: Property<string>
  /** The logical value for this item to start at when the circuit starts or resets. */
  startValue?: Property<LogicValue>
}

export default ItemProperties

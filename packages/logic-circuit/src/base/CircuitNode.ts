import Connection from '../types/Connection'
import LogicValue from '../types/LogicValue'
import OutputNode from './OutputNode'

class CircuitNode {
  /**
   * Incoming values, to be used for calculation of the node's state.
   *
   * @type {Array<LogicValue>}
   */
  public inputValues: Array<number> = []

  /**
   * List of outgoing connections.
   *
   * @type {Array<Connection>}
   */
  public outputs: Array<Connection> = []

  /**
   * Flag for if the value of the node has changed since last circuit evaluation.
   *
   * @type {Boolean}
   */
  public isValueChanged: boolean = false

  /**
   * Name of the node.
   *
   * @type {String}
   */
  public name: string

  /**
   * Current value of the node.
   *
   * @type {LogicValue}
   * @default LogicValue.UNKNOWN
   */
  public value: number = LogicValue.UNKNOWN

  /**
   * Next value for the node.
   *
   * @type {LogicValue}
   * @default LogicValue.UNKNOWN
   */
  public newValue: number = LogicValue.UNKNOWN

  /**
   * List of dictionaries containing event types and their respective callbacks.
   * Used for the invocation of event listeners when their respective events are fired.
   *
   * @type {Array<Object>}
   */
  public events: Array<{ eventType: string, callback: Function }> = []

  /**
   * Constructor.
   *
   * @param {String} name - name of the node
   */
  constructor (name: string) {
    this.name = name
  }

  /**
   * Invokes the registered events having the given `eventType`.
   *
   * @param {String} eventType - 'change' or 'reset'
   * @param {LogicValue} value
   */
  protected invokeEvent (eventType: string, value: number): void {
    this.events.forEach((event) => {
      if (event.eventType === eventType) {
        event.callback(value)
      }
    })
  }

  /**
   * Evaluates the node. Default behavior returns the current value.
   *
   * @returns {LogicValue}
   */
  protected eval (): number {
    return this.value
  }

  /**
   * Calculates how many input values equal the given comparison value.
   *
   * @param {LogicValue} compare - value to get count of
   * @returns {Number}
   */
  protected valueCount (compare: number): number {
    return this
      .inputValues
      .filter((value) => value === compare)
      .length
  }

  /**
   * Updates all outgoing connected nodes with the given value.
   *
   * @param {LogicValue} newValue - new value to output to the nodes
   */
  public updateOutputs (newValue: number): void {
    this.outputs.forEach(({ node, index }: Connection) => {
      node.update(newValue, index)
    })
  }

  /**
   * Updates the input value at the given index with the given value.
   *
   * @param {LogicValue} value - new value
   * @param {Number} index - source index
   */
  public update (value: number, index: number): void {
    this.inputValues[index] = value
    this.newValue = this.eval()
  }

  /**
   * Propagates a signal, if the value of the node has changed.
   *
   * @returns {Array<CircuitNodes>} list of all outgoing connected nodes
   */
  public propagate (): Array<CircuitNode> {
    if (this.value !== this.newValue) {
      this.isValueChanged = true
      this.value = this.newValue
      this.updateOutputs(this.newValue)
      this.invokeEvent('change', this.newValue)

      return this.outputs.map(({ node }) => node)
    }
    return []
  }

  /**
   * Resets the value and subsequent value of the node with Hi-Z.
   */
  public reset (): void {
    this.value = LogicValue.UNKNOWN
    this.newValue = LogicValue.UNKNOWN
    this.invokeEvent('change', this.newValue)
  }

  /**
   * Registers an event listener.
   *
   * @param {String} eventType - 'change' or 'reset'
   * @param {Function} callback - method to invoke on event
   */
  public on (eventType: string, callback: Function): void {
    this.events.push({ eventType, callback })
  }
}


export default CircuitNode

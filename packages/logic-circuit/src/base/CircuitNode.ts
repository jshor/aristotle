import Connection from '../types/Connection'
import LogicValue from '../types/LogicValue'

class CircuitNode {
  /**
   * Incoming values, to be used for calculation of the node's state.
   *
   * @type {Array<LogicValue>}
   */
  public inputValues: { [id: string]: number } = {}

  /**
   * List of outgoing connections.
   *
   * @type {Array<Connection>}
   */
  public outputs: Array<Connection> = []

  /**
   * Set to true if the value of the node has changed since last circuit evaluation.
   *
   * @type {Boolean}
   */
  public isValueChanged: boolean = true

  /**
   * Set to true to have the debugger continue regardless of whether this node changed or not.
   *
   * @type {Boolean}
   */
  public forceContinue: boolean = false

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
   * @param {Number} [inputIds = []] - ids for each input port
   */
  constructor (name: string, inputIds: string[] = []) {
    this.name = name
    this.inputValues = inputIds.reduce((map, id) => ({
      ...map,
      [id]: LogicValue.UNKNOWN
    }), {})
  }

  /**
   * Updates the node's value to be static having the given value.
   *
   * @param {LogicValue} value
   */
  public setValue = (value: number): void => {
    this.newValue = value
    this.eval = () => value
  }

  /**
   * Invokes the registered events having the given `eventType`.
   *
   * @param {String} eventType - 'change' or 'reset'
   * @param {LogicValue} value
   */
  protected invokeEvent = (eventType: string, value: number): void => {
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
  protected eval = (): number => {
    return this.value
  }

  /**
   * Calculates how many input values equal the given comparison value.
   *
   * @param {LogicValue} compare - value to get count of
   * @returns {Number}
   */
  protected valueCount = (compare: number): number => {
    return Object
      .values(this.inputValues)
      .filter((value) => value === compare)
      .length
  }

  /**
   * Updates all outgoing connected nodes with the given value.
   *
   * @param {LogicValue} newValue - new value to output to the nodes
   */
  public updateOutputs = (newValue: number): void => {
    this.outputs.forEach(({ node, id }: Connection) => {
      node.update(newValue, id)
    })
  }

  /**
   * Updates the input value at the given index with the given value.
   *
   * @param {LogicValue} value - new value
   * @param {Number} id - source port id
   */
  public update = (value: number, id: string): void => {
    this.inputValues[id] = value
    this.newValue = this.eval()
  }

  /**
   * Propagates a signal, if the value of the node has changed.
   *
   * @returns {Array<CircuitNodes>} list of all outgoing connected nodes
   */
  public propagate = (): Array<CircuitNode> => {
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
  public reset = (): void => {
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
  public on = (eventType: string, callback: Function): void => {
    this.events.push({ eventType, callback })
  }

  /**
   * Returns the value of the node next time the circuit is evaluated.
   *
   * @returns {Number}
   */
  public getProjectedValue = (): number => {
    return this.newValue || this.value
  }
}


export default CircuitNode

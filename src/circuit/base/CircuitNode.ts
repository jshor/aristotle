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
  }

  /**
   * Invokes the registered events having the given `eventType`.
   *
   * @param {String} eventType - 'change' or 'reset'
   * @param {LogicValue} value
   */
  public invokeEvent = (eventType: string, value: number, outputIds: string[]): void => {
    this.events.forEach((event) => {
      if (event.eventType === eventType) {
        event.callback(value, outputIds)
      }
    })
  }

  /**
   * Evaluates the node. Default behavior returns the current value.
   *
   * @returns {LogicValue}
   */
  public eval = (): number => {
    return this.value
  }

  /**
   * Calculates how many input values equal the given comparison value.
   *
   * @param {LogicValue} compare - value to get count of
   * @returns {Number}
   */
  public valueCount = (compare: number): number => {
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
    const outputIds: string[] = []

    this.outputs.forEach(({ node, id }: Connection) => {
      node.update(newValue, id)
      outputIds.push(id)
    })

    this.invokeEvent('change', newValue, outputIds)
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
    this.invokeEvent('change', this.newValue, this.outputs.map(({ id }) => id))
  }

  /**
   * Propagates a signal, if the value of the node has changed.
   *
   * @returns {CircuitNodes[]} queue of all resulting nodes to be evaluated in the next state
   */
  public propagate = (): Array<CircuitNode> => {
    let queue: CircuitNode[] = []

    if (this.value !== this.newValue) {
      this.isValueChanged = true
      this.value = this.newValue
      this.updateOutputs(this.newValue)

      this
        .outputs
        .forEach(({ node }) => {
          if (node.forceContinue) {
            // if this node is forced to continue propagation, enqueue its result
            queue = queue.concat(node.propagate())
          } else {
            // otherwise, just enqueue the node itself
            queue.push(node)
          }
        })
    }

    return queue
  }

  /**
   * Resets the value and subsequent value of the node with Hi-Z.
   */
  public reset = (): void => {
    this.value = LogicValue.UNKNOWN
    this.newValue = LogicValue.UNKNOWN
    this.invokeEvent('change', this.newValue, this.outputs.map(({ id }) => id))
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
    return this.eval() || this.newValue || this.value
  }
}


export default CircuitNode

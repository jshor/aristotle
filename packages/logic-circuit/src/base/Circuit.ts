import CircuitNode from '../base/CircuitNode'
import InputNode from '../base/InputNode'
import Connection from '../types/Connection'
import LogicValue from '../types/LogicValue'

export default class Circuit {
  /**
   * The debugger processing queue.
   *
   * @type {Array<CircuitNode>}
   */
  public queue: Array<CircuitNode> = []

  /**
   * A list of all the nodes in the circuit.
   *
   * @type {Array<CircuitNode>}
   */
  public nodes: Array<CircuitNode> = []

  /**
   * A list of all input nodes in the circuit.jest
   *
   * @type {Array<CircuitNode>}
   */
  public inputs: Array<InputNode> = []

  /**
   * Adds a node to the circuit and its appropriate queue(s).
   *
   * @param {CircuitNode} node - node to add
   */
  public addNode (node: CircuitNode): void {
    if (node instanceof InputNode) {
      this.inputs.push(node)
      this.enqueue(node)
    }
    this.nodes.push(node)
  }

  /**
   * Removes a node from the circuit and its appropriate queue(s).
   *
   * @param {CircuitNode} node - node to remove
   */
  public removeNode (node: CircuitNode): void {
    if (node instanceof InputNode) {
      this.inputs.splice(this.inputs.indexOf(node), 1)
      this.reset()
    }
    this.nodes.splice(this.nodes.indexOf(node), 1)
    this.removeNodeOutputs(node)
    this.next()
  }

  /**
   * Adds a connection entry from the source node to the target node on the given index.
   *
   * @param {CircuitNode} source - source node
   * @param {CircuitNode} target - target node
   * @param {Number} targetIndex - entry index on the target node for the connection
   */
  public addConnection (source: CircuitNode, target: CircuitNode, targetIndex: number): void {
    source.outputs.push(new Connection(target, targetIndex))
    source.value = LogicValue.UNKNOWN
    this.enqueue(source)
    this.next()
  }

  /**
   * Removes the connection on the source node at the source index and the connection at its target node.
   * The input value at the target index will be reset to Hi-Z.
   *
   * @param {CircuitNode} sourceNode - source node to disconnect
   * @param {CircuitNode} targetNode - target node to disconnect
   */
  public removeConnection (sourceNode: CircuitNode, targetNode: CircuitNode): void {
    sourceNode
      .outputs
      .concat()
      .forEach(({ node, index }: Connection, i: number) => {
        if (targetNode === node) {
          // reset the input of the target for this connection to hi-Z
          targetNode.update(LogicValue.UNKNOWN, index)

          // remove the output entry at the source
          sourceNode.outputs.splice(i, 1)

          // place the target node in the queue for processing
          this.enqueue(sourceNode, targetNode)
        }
      })
    this.next()
  }

  /**
   * Removes all connections from the given source node.
   *
   * @param {CircuitNode} source
   */
  removeNodeOutputs (source: CircuitNode): void {
    for (let i: number = 0; i < source.outputs.length; i++) {
      this.removeConnection(source, source.outputs[i].node)
    }
  }

  /**
   * Appends the given node(s) to the processing queue.
   *
   * @param {...CircuitNode} added - node(s) to add to the queue
   */
  public enqueue (...added: CircuitNode[]): void {
    added.forEach((node) => {
      if (!~this.queue.indexOf(node)) {
        this.queue.push(node)
      }
    })
  }

  /**
   * Removes the given node from the processing queue.
   *
   * @param {CircuitNode} removed - node to remove from the queue
   */
  public dequeue (removed: CircuitNode): void {
    const removedIndex = this.queue.indexOf(removed)

    if (~removedIndex) {
      this.queue.splice(removedIndex, 1)
    }
  }

  /**
   * Resets the circuit.
   */
  public reset (): void {
    this.nodes.forEach((node) => node.reset())
  }

  /**
   * Advances the circuit simulation one step. If none of the node values have changed,
   * it continues stepping through until either a value changes or the queue is empty.
   */
  public next = (): void => {
    let isValueChanged = false
    let forceContinue = false

    this.queue.forEach((node) => {
      this.enqueue(...node.propagate())
      this.dequeue(node)

      if (node.isValueChanged) {
        isValueChanged = true
        node.isValueChanged = false
      }

      if (node.forceContinue) {
        forceContinue = true
      }
    })

    if (!this.isComplete() && (!isValueChanged || forceContinue)) {
      // queue is not finished but the node determined we should step again
      return this.next()
    }
  }

  /**
   * Returns true when the queue is finished processing.
   *
   * @returns {Boolean}
   */
  public isComplete (): boolean {
    return this.queue.length === 0
  }

  debug (): void { // TODO: delete this
    this.nodes.forEach(({ name, value, newValue }) => {
      console.log(`${name}:`, value, newValue)
    })
  }
}

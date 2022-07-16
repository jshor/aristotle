import CircuitNode from '../base/CircuitNode'
import Connection from '../types/Connection'
import LogicValue from '../types/LogicValue'
import InputNode from './InputNode'
import OutputNode from './OutputNode'

class Circuit {
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
   * A list of all input nodes in the circuit.
   *
   * @type {Array<CircuitNode>}
   */
  public inputNodes: Array<InputNode> = []

  /**
   * Adds a node to the circuit and its appropriate queue(s).
   *
   * @param {CircuitNode} node - node to add
   */
  public addNode = (node: CircuitNode): void => {
    if (node instanceof InputNode) {
      this.inputNodes.push(node)
      this.enqueue(node)
    }
    this.nodes.push(node)
  }

  /**
   * Removes a node from the circuit and its appropriate queue(s).
   *
   * @param {CircuitNode} node - node to remove
   */
  public removeNode = (node: CircuitNode): void => {
    if (node instanceof InputNode) {
      const inputIndex = this.inputNodes.findIndex(({ name }) => name === node.name)

      if (inputIndex !== -1) {
        this.inputNodes.splice(inputIndex, 1)
      }
      // this.reset() // TODO: why?
    }

    const index = this.nodes.findIndex(({ name }) => name === node.name)

    if (index !== -1) {
      this.removeNodeOutputs(node)
      this.nodes.splice(index, 1)
    }

    this.next()
  }

  /**
   * Adds a connection entry from the source node to the target node on the given index.
   *
   * @param {CircuitNode} source - source node
   * @param {CircuitNode} target - target node
   * @param {Number} targetId - entry port id on the target node for the connection
   */
  public addConnection = (source: CircuitNode, target: CircuitNode, targetId: string, sourceValue: number = LogicValue.UNKNOWN): void => {
    source.outputs.push(new Connection(target, targetId))
    source.value = sourceValue

    if (!sourceValue) {
      this.enqueue(source)
    }
  }

  /**
   * Removes the connection on the source node at the source index and the connection at its target node.
   * The input value at the target index will be reset to Hi-Z.
   *
   * @param {CircuitNode} sourceNode - source node to disconnect
   * @param {CircuitNode} targetNode - target node to disconnect
   */
  public removeConnection = (sourceNode: CircuitNode, targetNode: CircuitNode, sourceValue: number = LogicValue.UNKNOWN): void => {
    sourceNode
      .outputs
      .concat()
      .forEach(({ node, id }: Connection, i: number) => {
        if (targetNode === node) {
          // reset the input of the target for this connection to hi-Z
          targetNode.update(sourceValue, id)

          // remove the output entry at the source
          sourceNode.outputs.splice(i, 1)

          // place the target node in the queue for processing
          this.enqueue(targetNode)
        }
      })
  }

  /**
   * Removes all connections from the given source node.
   *
   * @param {CircuitNode} source
   */
  removeNodeOutputs = (source: CircuitNode): void => {
    for (let i: number = 0; i < source.outputs.length; i++) {
      this.removeConnection(source, source.outputs[i].node)
    }
  }

  /**
   * Appends the given node(s) to the processing queue.
   *
   * @param {...CircuitNode} added - node(s) to add to the queue
   */
  public enqueue = (...added: CircuitNode[]): void => {
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
  public dequeue = (removed: CircuitNode): void => {
    const removedIndex = this.queue.indexOf(removed)

    if (~removedIndex) {
      this.queue.splice(removedIndex, 1)
    }
  }

  /**
   * Resets the circuit.
   */
  public reset = (): void => {
    this.nodes.forEach((node) => node.reset())
  }

  /**
   * Advances the circuit simulation one step. If none of the node values have changed,
   * it continues stepping through until either a value changes or the queue is empty.
   */
  public next = (): void => {
    let isValueChanged = false
    let localQueue: CircuitNode[] = []

    while (this.queue.length > 0) {
      const node = this.queue.shift()

      if (!node) continue

      localQueue = localQueue.concat(node.propagate())

      this.dequeue(node)

      if (node.isValueChanged) {
        isValueChanged = true
      }

      if (node.forceContinue) {
        this.enqueue(...localQueue)
        localQueue = []
      }
    }

    if (isValueChanged) {
      this.enqueue(...localQueue)
    }
  }

  /**
   * Returns true when the queue is finished processing.
   *
   * @returns {Boolean}
   */
  public isComplete = (): boolean => {
    let isComplete = true

    if (this.queue.length === 0) {
      return true
    }

    this.queue.forEach(node => {
      const nextValue = node.getProjectedValue()

      if (nextValue !== node.value && !(node instanceof OutputNode)) {
        isComplete = false
      }
    })

    if (isComplete) {
      this.queue = []
    }

    return isComplete
  }
}

export default Circuit

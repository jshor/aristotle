import CircuitNode from '../base/CircuitNode'

class Connection {
  node: CircuitNode
  index: number

  constructor (node: CircuitNode, index: number) {
    this.node = node
    this.index = index
  }
}

export default Connection

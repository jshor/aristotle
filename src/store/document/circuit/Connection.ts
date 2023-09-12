import CircuitNode from './CircuitNode'

class Connection {
  node: CircuitNode
  id: string

  constructor (node: CircuitNode, id: string) {
    this.node = node
    this.id = id
  }
}

export default Connection

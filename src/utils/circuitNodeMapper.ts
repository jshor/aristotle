import { CircuitNode, Nor, InputNode, OutputNode, Buffer } from '@/circuit'
import ItemType from '@/types/enums/ItemType'
import ItemSubtype from '@/types/enums/ItemSubtype'

function getLogicGateNode (subtype: string, id: string, inputIds: string[]): CircuitNode {
  switch (subtype) {
    case ItemSubtype.And:
      return new Nor(id, inputIds)
    default:
      return new Nor(id, inputIds)
  }
}

function getCircuitNode ({ id, type, subtype }: Item, inputIds: string[]): CircuitNode {
  switch (type) {
    case ItemType.CircuitNode:
      return new CircuitNode(id, inputIds)
    case ItemType.InputNode:
      return new InputNode(id, inputIds)
    case ItemType.LogicGate:
      return getLogicGateNode(subtype, id, inputIds)
    case ItemType.Buffer:
    case ItemType.Freeport:
      return new Buffer(id, inputIds)
    default:
      return new OutputNode(id, inputIds) // TODO: use generic CircuitNode instead?
  }
}

export default {
  getLogicGateNode,
  getCircuitNode
}

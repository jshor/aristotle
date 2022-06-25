import CircuitNode from '@/circuit/base/CircuitNode'
import InputNode from '@/circuit/base/InputNode'
import OutputNode from '@/circuit/base/OutputNode'
import Buffer from '@/circuit/gates/Buffer'
import And from '@/circuit/gates/And'
import Nand from '@/circuit/gates/Nand'
import Or from '@/circuit/gates/Or'
import Nor from '@/circuit/gates/Nor'
import Not from '@/circuit/gates/Not'
import ItemType from '@/types/enums/ItemType'
import ItemSubtype from '@/types/enums/ItemSubtype'

function getLogicGateNode (subtype: string, id: string, inputIds: string[]): CircuitNode {
  switch (subtype) {
    case ItemSubtype.And:
      return new And(id, inputIds)
    case ItemSubtype.Nand:
      return new Nand(id, inputIds)
    case ItemSubtype.Or:
      return new Or(id, inputIds)
    case ItemSubtype.Nor:
      return new Nor(id, inputIds)
    case ItemSubtype.Not:
      return new Not(id, inputIds)
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
